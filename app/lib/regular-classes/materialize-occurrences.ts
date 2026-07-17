import prisma from "@/prisma";
import { generateJitsiRoom } from "@/app/lib/classes/generate-jitsi-room";

const WEEKS_AHEAD = 4;

/**
 * Materializes real, bookable `Class` occurrences for an `active` RegularClass
 * template, walking forward from its `lastMaterializedThrough` watermark (or
 * "now" on the first run) through a rolling window `WEEKS_AHEAD` weeks out.
 *
 * The watermark only ever moves forward. This is what stops a student's
 * cancelled occurrence (cancelClassById hard-deletes the Class row) from
 * silently reappearing on the next run — once a date has been passed, it's
 * never re-scanned, regardless of whether the row for it still exists.
 *
 * Shared by the periodic worker job and by `acceptRegularClass`'s immediate
 * first-pass, so accepting a series doesn't make the student wait for the
 * next worker tick to see their first occurrence.
 *
 * Returns the number of new occurrences created.
 */
export async function materializeOccurrences(regularClassId: string): Promise<number> {
	const rc = await prisma.regularClass.findUnique({ where: { id: regularClassId } });
	if (!rc || rc.status !== "active") return 0;

	const now = new Date();
	const horizon = new Date(now.getTime() + WEEKS_AHEAD * 7 * 24 * 3_600_000);

	const watermark =
		rc.lastMaterializedThrough && rc.lastMaterializedThrough > now
			? rc.lastMaterializedThrough
			: now;

	const hour = rc.startTime.getHours();
	const minute = rc.startTime.getMinutes();

	let created = 0;
	const cursor = new Date(watermark);
	cursor.setHours(0, 0, 0, 0);

	while (cursor <= horizon) {
		if (cursor.getDay() === rc.dayOfWeek) {
			const occurrenceStart = new Date(cursor);
			occurrenceStart.setHours(hour, minute, 0, 0);

			if (occurrenceStart > watermark && occurrenceStart <= horizon) {
				const existing = await prisma.class.findUnique({
					where: {
						regularClassId_startTime: {
							regularClassId: rc.id,
							startTime: occurrenceStart,
						},
					},
					select: { id: true },
				});

				if (!existing) {
					await prisma.class.create({
						data: {
							studentId: rc.studentId,
							teacherId: rc.teacherId,
							subjectId: rc.subjectId,
							startTime: occurrenceStart,
							durationInHours: rc.durationInHours,
							totalPrice: rc.totalPrice,
							status: "scheduled",
							requesterId: rc.studentId,
							regularClassId: rc.id,
							jitsiRoom: generateJitsiRoom(),
						},
					});
					created++;
				}
			}
		}
		cursor.setDate(cursor.getDate() + 1);
	}

	const newWatermark = rc.lastMaterializedThrough && rc.lastMaterializedThrough > horizon
		? rc.lastMaterializedThrough
		: horizon;

	await prisma.regularClass.update({
		where: { id: rc.id },
		data: { lastMaterializedThrough: newWatermark },
	});

	return created;
}
