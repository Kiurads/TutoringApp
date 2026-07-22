"use server";

import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { calcTier, calcRank, getTierName, getRankName } from "./gamification-utils";

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
			"/main/student/dashboard",
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
		if (count === 1) await awardBadge(userId, "first_class");
		if (count === 10) await awardBadge(userId, "sessions_10");
		if (count === 50) await awardBadge(userId, "sessions_50");
	} else {
		if (count === 1) await awardBadge(userId, "first_session");
		if (count === 100) await awardBadge(userId, "sessions_100");
	}
}
