import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const badges = [
	// ── Student badges ────────────────────────────────────────────────────────
	// (streak_7/streak_30 below are shared with teachers — see the weekly
	// activity streak in app/lib/gamification.ts)
	{
		key: "first_class",
		name: "First Step",
		description: "Completed your very first class.",
		iconKey: "fa-graduation-cap",
		category: "milestone" as const,
	},
	{
		key: "sessions_10",
		name: "Committed Learner",
		description: "Completed 10 classes.",
		iconKey: "fa-book-open",
		category: "milestone" as const,
	},
	{
		key: "sessions_50",
		name: "Dedicated Scholar",
		description: "Completed 50 classes.",
		iconKey: "fa-star",
		category: "milestone" as const,
	},
	{
		key: "feedback_champion",
		name: "Feedback Champion",
		description: "Left a review for a teacher.",
		iconKey: "fa-comment-dots",
		category: "engagement" as const,
	},
	{
		key: "streak_7",
		name: "Steady Streak",
		description: "Maintained a 4-week activity streak.",
		iconKey: "fa-fire",
		category: "engagement" as const,
	},
	{
		key: "streak_30",
		name: "Unstoppable",
		description: "Maintained a 12-week activity streak.",
		iconKey: "fa-fire-flame-curved",
		category: "engagement" as const,
	},
	// ── Teacher badges ────────────────────────────────────────────────────────
	{
		key: "first_session",
		name: "First Lesson",
		description: "Taught your first class.",
		iconKey: "fa-chalkboard-teacher",
		category: "milestone" as const,
	},
	{
		key: "sessions_100",
		name: "100 Sessions Club",
		description: "Taught 100 classes.",
		iconKey: "fa-trophy",
		category: "milestone" as const,
	},
	{
		key: "top_reviewed",
		name: "Top Reviewed",
		description: "Received a 5-star review.",
		iconKey: "fa-star",
		category: "milestone" as const,
	},
	{
		key: "engaging_educator",
		name: "Engaging Educator",
		description: "Reached Elite Mentor rank.",
		iconKey: "fa-lightbulb",
		category: "pedagogy" as const,
	},
];

async function main() {
	console.log("Seeding badges...");
	for (const badge of badges) {
		await prisma.badge.upsert({
			where: { key: badge.key },
			update: badge,
			create: badge,
		});
	}
	console.log(`✅ Seeded ${badges.length} badges.`);
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
