"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import { fetchUserByEmail } from "./actions/users.actions";
import { awardGems, awardSparks } from "./gamification";
import { getWeekStart } from "./gamification-utils";

// Fixed weekly quests — deliberately not a configurable/admin-managed
// catalog (that's a much bigger feature); "purpose over points" from the
// gamification research means a handful of goals tied to real platform
// behavior (showing up, giving feedback) beats a sprawling checklist.
// Progress is computed live from Class/TeacherRating rows, never stored —
// QuestClaim only exists to make claiming idempotent per user per week.
export interface QuestDef {
	key: string;
	role: "student" | "teacher";
	title: string;
	description: string;
	target: number;
	reward: number; // gems for student quests, sparks for teacher quests
}

const STUDENT_QUESTS: QuestDef[] = [
	{
		key: "weekly_2_classes",
		role: "student",
		title: "Stay on Track",
		description: "Complete 2 classes this week",
		target: 2,
		reward: 30,
	},
	{
		key: "weekly_leave_review",
		role: "student",
		title: "Share Feedback",
		description: "Leave a review this week",
		target: 1,
		reward: 15,
	},
];

const TEACHER_QUESTS: QuestDef[] = [
	{
		key: "weekly_3_classes",
		role: "teacher",
		title: "Keep Teaching",
		description: "Complete 3 classes this week",
		target: 3,
		reward: 30,
	},
];

export interface QuestProgress extends QuestDef {
	progress: number;
	completed: boolean;
	claimed: boolean;
}

async function computeProgress(
	questKey: string,
	role: "student" | "teacher",
	userId: string,
	weekStart: Date,
): Promise<number> {
	if (questKey === "weekly_2_classes" || questKey === "weekly_3_classes") {
		return prisma.class.count({
			where: {
				status: "completed",
				updatedAt: { gte: weekStart },
				...(role === "student" ? { studentId: userId } : { teacherId: userId }),
			},
		});
	}
	if (questKey === "weekly_leave_review") {
		return prisma.teacherRating.count({
			where: { studentId: userId, createdAt: { gte: weekStart } },
		});
	}
	return 0;
}

export async function fetchWeeklyQuests(): Promise<QuestProgress[]> {
	const session = await auth();
	if (!session?.user?.email) return [];

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role === "admin") return [];

	const role = user.role === "teacher" ? "teacher" : "student";
	const defs = role === "student" ? STUDENT_QUESTS : TEACHER_QUESTS;
	const weekStart = getWeekStart(new Date());

	const claims = await prisma.questClaim.findMany({
		where: { userId: user.id, weekStart, questKey: { in: defs.map((d) => d.key) } },
		select: { questKey: true },
	});
	const claimedKeys = new Set(claims.map((c) => c.questKey));

	const results: QuestProgress[] = [];
	for (const def of defs) {
		const progress = await computeProgress(def.key, role, user.id, weekStart);
		results.push({
			...def,
			progress: Math.min(progress, def.target),
			completed: progress >= def.target,
			claimed: claimedKeys.has(def.key),
		});
	}
	return results;
}

export async function claimWeeklyQuest(questKey: string): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role === "admin") return { error: "Unauthorised." };

	const role = user.role === "teacher" ? "teacher" : "student";
	const def = (role === "student" ? STUDENT_QUESTS : TEACHER_QUESTS).find((d) => d.key === questKey);
	if (!def) return { error: "Unknown quest." };

	const weekStart = getWeekStart(new Date());

	// Re-derive progress server-side rather than trusting the client.
	const progress = await computeProgress(def.key, role, user.id, weekStart);
	if (progress < def.target) return { error: "This quest isn't complete yet." };

	try {
		await prisma.questClaim.create({ data: { userId: user.id, questKey, weekStart } });
	} catch {
		// @@unique([userId, questKey, weekStart]) violation
		return { error: "Already claimed this week." };
	}

	if (role === "student") await awardGems(user.id, def.reward);
	else await awardSparks(user.id, def.reward);

	revalidatePath(role === "student" ? "/main/student/dashboard" : "/main/teacher/dashboard");
	return {};
}
