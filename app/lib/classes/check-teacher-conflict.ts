import prisma from "@/prisma";

/**
 * Checks whether a teacher already has a `scheduled` class overlapping the
 * given time window. Only `scheduled` classes count as real conflicts —
 * other `requested` classes for the same slot are expected (a teacher may
 * receive several competing requests before accepting one), so this isn't
 * checked at request-creation time against other requests, only against
 * classes that have actually been confirmed.
 *
 * Fetches the teacher's scheduled classes and compares overlap in JS rather
 * than via a raw SQL computed-column comparison — same approach already
 * used in worker/src/complete-classes.ts for the equivalent
 * (startTime + durationInHours) problem, which MySQL can't do in a typed
 * Prisma `where`.
 */
export async function teacherHasSchedulingConflict(
	teacherId: string,
	candidateStart: Date,
	candidateDurationInHours: number,
	excludeClassId?: string,
): Promise<boolean> {
	const candidateStartMs = candidateStart.getTime();
	const candidateEndMs = candidateStartMs + candidateDurationInHours * 3_600_000;

	const scheduled = await prisma.class.findMany({
		where: {
			teacherId,
			status: "scheduled",
			...(excludeClassId ? { id: { not: excludeClassId } } : {}),
		},
		select: { startTime: true, durationInHours: true },
	});

	return scheduled.some((cls) => {
		const existingStartMs = cls.startTime.getTime();
		const existingEndMs = existingStartMs + cls.durationInHours.toNumber() * 3_600_000;
		return existingStartMs < candidateEndMs && existingEndMs > candidateStartMs;
	});
}
