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

	await prisma.studentGameProfile.upsert({
		where: { userId },
		create: { userId, insightGems: amount },
		update: { insightGems: { increment: amount } },
	});

	const newGems = oldGems + amount;
	const oldTier = calcTier(oldGems);
	const newTier = calcTier(newGems);

	if (newTier !== oldTier) {
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

	await prisma.teacherGameProfile.upsert({
		where: { userId },
		create: { userId, reputationSparks: amount },
		update: { reputationSparks: { increment: amount } },
	});

	const newSparks = oldSparks + amount;
	const oldRank = calcRank(oldSparks);
	const newRank = calcRank(newSparks);

	if (newRank !== oldRank) {
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
