"use server";

import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { calcTier, calcRank, getTierName, getRankName, computeStreakUpdate, type StreakUpdate } from "./gamification-utils";

// ── Student: award Insight Gems ───────────────────────────────────────────────

export async function awardGems(userId: string, amount: number): Promise<void> {
	const before = await prisma.studentGameProfile.findUnique({
		where: { userId },
		select: { insightGems: true },
	});

	const oldGems = before?.insightGems ?? 0;
	// Clamped, not just incremented — `amount` can be negative (point
	// reversal on a refund), and there's nowhere else floors this at 0.
	const newGems = Math.max(0, oldGems + amount);

	await prisma.studentGameProfile.upsert({
		where: { userId },
		create: { userId, insightGems: newGems },
		update: { insightGems: newGems },
	});

	const oldTier = calcTier(oldGems);
	const newTier = calcTier(newGems);

	// Only the increase direction is a "tier up" worth notifying about — a
	// negative amount (reversal) can lower the tier too, which must not fire
	// the congratulatory notification.
	if (newTier > oldTier) {
		await prisma.studentGameProfile.update({
			where: { userId },
			data: { learningTier: newTier },
		});
		await createNotification(
			userId,
			"tier_up",
			"New Learning Tier!",
			`You've reached the ${getTierName(newTier)} tier!`,
			"/main/student/dashboard",
		);
	}
}

// ── Teacher: award Reputation Sparks ─────────────────────────────────────────

export async function awardSparks(
	userId: string,
	amount: number,
): Promise<void> {
	const before = await prisma.teacherGameProfile.findUnique({
		where: { userId },
		select: { reputationSparks: true },
	});

	const oldSparks = before?.reputationSparks ?? 0;
	// Clamped, not just incremented — see awardGems for why.
	const newSparks = Math.max(0, oldSparks + amount);

	await prisma.teacherGameProfile.upsert({
		where: { userId },
		create: { userId, reputationSparks: newSparks },
		update: { reputationSparks: newSparks },
	});

	const oldRank = calcRank(oldSparks);
	const newRank = calcRank(newSparks);

	// Only the increase direction is a "rank up" worth notifying about — see
	// awardGems for why this isn't just `!==`.
	if (newRank > oldRank) {
		await prisma.teacherGameProfile.update({
			where: { userId },
			data: { mentorshipRank: newRank },
		});
		await createNotification(
			userId,
			"rank_up",
			"New Mentorship Rank!",
			`You've reached the ${getRankName(newRank)} rank!`,
			"/main/teacher/dashboard",
		);
		// Elite Mentor (rank 3) — awardBadge is idempotent, safe to call on
		// every future rank-up too (it just no-ops once already held).
		if (newRank >= 3) await awardBadge(userId, "engaging_educator", "teacher");
	}
}

// ── Refund: claw back whatever points this class actually granted ───────────
//
// `gemsAwarded`/`sparksAwarded` are running totals maintained by whichever
// award call sites fired for this class (accept bonus, completion bonus —
// the amounts differ between the worker's auto-complete and the manual
// "Mark Complete" action, and a class can receive both), so this reverses
// exactly what was given rather than guessing a fixed amount. Idempotent via
// `pointsReversed` — safe to call even if a class somehow gets refunded
// twice (e.g. a retried webhook).
export async function reverseClassPoints(cls: {
	id: string;
	studentId: string;
	teacherId: string | null;
	gemsAwarded: number;
	sparksAwarded: number;
	pointsReversed: boolean;
}): Promise<void> {
	if (cls.pointsReversed) return;

	if (cls.gemsAwarded > 0) {
		await awardGems(cls.studentId, -cls.gemsAwarded);
	}
	if (cls.teacherId && cls.sparksAwarded > 0) {
		await awardSparks(cls.teacherId, -cls.sparksAwarded);
	}

	await prisma.class.update({
		where: { id: cls.id },
		data: { pointsReversed: true, gemsAwarded: 0, sparksAwarded: 0 },
	});
}

// ── Award a badge (no-op if already held) ────────────────────────────────────

export async function awardBadge(
	userId: string,
	badgeKey: string,
	role: "student" | "teacher" = "student",
): Promise<boolean> {
	const badge = await prisma.badge.findUnique({ where: { key: badgeKey } });
	if (!badge) return false;

	try {
		await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
		await createNotification(
			userId,
			"badge_earned",
			"Badge Earned!",
			`You earned the "${badge.name}" badge!`,
			role === "student" ? "/main/student/dashboard" : "/main/teacher/dashboard",
		);
		return true;
	} catch {
		// @@unique([userId, badgeId]) violation — already held
		return false;
	}
}

// ── Check and award session-count milestone badges ───────────────────────────

export async function checkSessionBadges(
	userId: string,
	role: "student" | "teacher",
): Promise<void> {
	const count = await prisma.class.count({
		where: {
			status: "completed",
			...(role === "student" ? { studentId: userId } : { teacherId: userId }),
		},
	});

	if (role === "student") {
		if (count === 1) await awardBadge(userId, "first_class", "student");
		if (count === 10) await awardBadge(userId, "sessions_10", "student");
		if (count === 50) await awardBadge(userId, "sessions_50", "student");
	} else {
		if (count === 1) await awardBadge(userId, "first_session", "teacher");
		if (count === 100) await awardBadge(userId, "sessions_100", "teacher");
	}
}

// ── Weekly activity streak ───────────────────────────────────────────────────
//
// Tutoring's natural cadence is weekly/biweekly sessions, not daily practice,
// so a Duolingo-style daily streak would punish completely normal usage —
// the unit here is "a week with at least one completed class." A single
// missed week is covered by a streak freeze instead of resetting to 0;
// freezes are earned for free every 4-week streak rather than sold, so the
// safety net isn't gated behind a purchase.
//
// Deliberately does NOT notify when a streak breaks — ethical-gamification
// guidance is explicit that loss-aversion push notifications on
// disengagement (the mechanic behind Snapchat's streak-anxiety problem)
// create real distress without a matching retention benefit. The user just
// sees the reset count next time they open their dashboard.
//
// The actual branching logic lives in computeStreakUpdate() in
// gamification-utils.ts, not here — this file has "use server", which
// requires every export to be an async function, and that logic needs to
// stay a plain synchronous function to unit test without a database.

export async function updateActivityStreak(
	userId: string,
	role: "student" | "teacher",
): Promise<void> {
	const now = new Date();

	if (role === "student") {
		const before = await prisma.studentGameProfile.findUnique({
			where: { userId },
			select: { currentStreakWeeks: true, longestStreakWeeks: true, streakFreezes: true, lastActivityAt: true },
		});
		const result = computeStreakUpdate(before, now);

		if (result.kind === "first_activity") {
			await prisma.studentGameProfile.upsert({
				where: { userId },
				create: { userId, currentStreakWeeks: 1, longestStreakWeeks: 1, lastActivityAt: now },
				update: { currentStreakWeeks: 1, longestStreakWeeks: Math.max(1, before?.longestStreakWeeks ?? 0), lastActivityAt: now },
			});
		} else if (result.kind === "already_counted") {
			await prisma.studentGameProfile.update({ where: { userId }, data: { lastActivityAt: now } });
		} else if (result.kind === "continued") {
			await prisma.studentGameProfile.update({
				where: { userId },
				data: {
					currentStreakWeeks: result.newStreak,
					longestStreakWeeks: result.newLongest,
					lastActivityAt: now,
					streakFreezes: result.newFreezes,
				},
			});
			await onStreakContinued(userId, role, result);
		} else {
			await prisma.studentGameProfile.update({ where: { userId }, data: { currentStreakWeeks: 1, lastActivityAt: now } });
		}
		return;
	}

	const before = await prisma.teacherGameProfile.findUnique({
		where: { userId },
		select: { currentStreakWeeks: true, longestStreakWeeks: true, streakFreezes: true, lastActivityAt: true },
	});
	const result = computeStreakUpdate(before, now);

	if (result.kind === "first_activity") {
		await prisma.teacherGameProfile.upsert({
			where: { userId },
			create: { userId, currentStreakWeeks: 1, longestStreakWeeks: 1, lastActivityAt: now },
			update: { currentStreakWeeks: 1, longestStreakWeeks: Math.max(1, before?.longestStreakWeeks ?? 0), lastActivityAt: now },
		});
	} else if (result.kind === "already_counted") {
		await prisma.teacherGameProfile.update({ where: { userId }, data: { lastActivityAt: now } });
	} else if (result.kind === "continued") {
		await prisma.teacherGameProfile.update({
			where: { userId },
			data: {
				currentStreakWeeks: result.newStreak,
				longestStreakWeeks: result.newLongest,
				lastActivityAt: now,
				streakFreezes: result.newFreezes,
			},
		});
		await onStreakContinued(userId, role, result);
	} else {
		await prisma.teacherGameProfile.update({ where: { userId }, data: { currentStreakWeeks: 1, lastActivityAt: now } });
	}
}

async function onStreakContinued(
	userId: string,
	role: "student" | "teacher",
	result: Extract<StreakUpdate, { kind: "continued" }>,
): Promise<void> {
	if (result.usedFreeze) {
		await createNotification(
			userId,
			"streak_saved",
			"Streak Saved!",
			`A streak freeze covered your missed week — your ${result.newStreak}-week streak continues.`,
			role === "student" ? "/main/student/dashboard" : "/main/teacher/dashboard",
		);
	}

	if (result.newStreak === 4) await awardBadge(userId, "streak_7", role);
	if (result.newStreak === 12) await awardBadge(userId, "streak_30", role);
}

// ── Variable reward: small chance of a bonus on class completion ────────────
//
// A single, transparent, always-positive mechanic — never a loss, never a
// rarity ladder — the "surprise and delight" pattern from gamification
// research without the manipulative edge some variable-reward
// implementations have (e.g. loot-box-style rarity tiers).
//
// Returns the bonus amount actually awarded (0 if the roll didn't hit), so
// callers can fold it into the same Class.gemsAwarded/sparksAwarded running
// total used for refund reversal — a lucky bonus tied to a class should be
// clawed back with the rest of that class's points if it's later refunded.
const LUCKY_BONUS_CHANCE = 0.1;
const LUCKY_BONUS_GEMS = 25;
const LUCKY_BONUS_SPARKS = 15;

export async function maybeAwardLuckyBonus(
	userId: string,
	role: "student" | "teacher",
): Promise<number> {
	if (Math.random() >= LUCKY_BONUS_CHANCE) return 0;

	if (role === "student") {
		await awardGems(userId, LUCKY_BONUS_GEMS);
		await createNotification(
			userId,
			"gem_received",
			"🍀 Lucky Bonus!",
			`You earned an extra ${LUCKY_BONUS_GEMS} gems for that session!`,
			"/main/student/dashboard",
		);
		return LUCKY_BONUS_GEMS;
	}

	await awardSparks(userId, LUCKY_BONUS_SPARKS);
	await createNotification(
		userId,
		"sparks_received",
		"🍀 Lucky Bonus!",
		`You earned an extra ${LUCKY_BONUS_SPARKS} sparks for that session!`,
		"/main/teacher/dashboard",
	);
	return LUCKY_BONUS_SPARKS;
}
