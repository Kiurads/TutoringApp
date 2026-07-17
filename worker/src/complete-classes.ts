import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { awardGems, awardSparks, checkSessionBadges } from "@/app/lib/gamification";

/**
 * Marks `scheduled` classes as `completed` once their end time has passed,
 * then awards gems/sparks and checks session-count badges for both parties.
 *
 * Filters candidates in JS rather than via a raw SQL DATE_ADD comparison —
 * the "requested" backlog aside, the set of currently-`scheduled` classes is
 * small, and this avoids hand-writing/maintaining raw SQL for a computed
 * (startTime + durationInHours) comparison MySQL can't do in a typed `where`.
 */
export async function markCompletedClasses(): Promise<void> {
	const scheduled = await prisma.class.findMany({
		where: { status: "scheduled" },
		select: {
			id: true,
			studentId: true,
			teacherId: true,
			startTime: true,
			durationInHours: true,
			subject: { select: { name: true } },
		},
	});

	const now = Date.now();

	for (const cls of scheduled) {
		if (!cls.teacherId) continue; // Scheduled classes always have a teacher; guard for the type anyway

		const endTime =
			cls.startTime.getTime() + cls.durationInHours.toNumber() * 3_600_000;
		if (endTime > now) continue;

		await prisma.class.update({
			where: { id: cls.id },
			data: { status: "completed" },
		});

		await awardGems(cls.studentId, 100);
		await awardSparks(cls.teacherId, 20);
		await checkSessionBadges(cls.studentId, "student");
		await checkSessionBadges(cls.teacherId, "teacher");

		await createNotification(
			cls.studentId,
			"class_completed",
			"Class Completed",
			`Your ${cls.subject.name} class is complete. Leave a review to help other students!`,
			`/main/student/classes/${cls.id}`,
		);
		await createNotification(
			cls.teacherId,
			"class_completed",
			"Class Completed",
			`Your ${cls.subject.name} class is complete.`,
			`/main/teacher/classes/${cls.id}`,
		);

		console.log(`[worker] Marked class ${cls.id} as completed.`);
	}
}
