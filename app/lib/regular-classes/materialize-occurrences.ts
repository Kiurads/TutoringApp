import Stripe from "stripe";
import prisma from "@/prisma";
import { Prisma } from "@prisma/client";
import { generateJitsiRoom } from "@/app/lib/classes/generate-jitsi-room";
import { computeCommissionSplit } from "@/app/lib/payouts-utils";
import { createNotification } from "@/app/lib/notifications";

const WEEKS_AHEAD = 4;

type RegularClassTemplate = Prisma.RegularClassGetPayload<{
	include: {
		student: { select: { stripeCustomerId: true; defaultPaymentMethodId: true } };
	};
}>;

/**
 * Charges the student's saved card (off-session) for one occurrence, then
 * creates the Class row reflecting the outcome. A recurring series is only
 * ever accepted once — there's no per-occurrence "accept" step the way a
 * one-off class has, so this off-session charge is what actually moves money
 * for it. Never throws: a declined card or missing payment method still
 * produces the Class row (the session is still expected to happen), just
 * unpaid, with the student notified to fix their payment method.
 */
async function createChargedOccurrence(
	rc: RegularClassTemplate,
	occurrenceStart: Date,
	jitsiRoom: string,
): Promise<void> {
	const { stripeCustomerId, defaultPaymentMethodId } = rc.student;

	if (!stripeCustomerId || !defaultPaymentMethodId) {
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
				jitsiRoom,
			},
		});
		await createNotification(
			rc.studentId,
			"regular_class_payment_failed",
			"Payment Method Needed",
			"Add a payment method so your upcoming recurring classes can be charged automatically.",
			"/main/student/regular-classes",
		);
		return;
	}

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
	const totalPrice = Number(rc.totalPrice);

	try {
		const intent = await stripe.paymentIntents.create({
			amount: Math.round(totalPrice * 100),
			currency: "eur",
			customer: stripeCustomerId,
			payment_method: defaultPaymentMethodId,
			off_session: true,
			confirm: true,
			metadata: { regularClassId: rc.id, occurrenceStart: occurrenceStart.toISOString() },
		});

		const cls = await prisma.class.create({
			data: {
				studentId: rc.studentId,
				teacherId: rc.teacherId,
				subjectId: rc.subjectId,
				startTime: occurrenceStart,
				durationInHours: rc.durationInHours,
				totalPrice: rc.totalPrice,
				status: "scheduled",
				paid: true,
				requesterId: rc.studentId,
				regularClassId: rc.id,
				jitsiRoom,
			},
		});

		const split = computeCommissionSplit(totalPrice);
		await prisma.payment.create({
			data: {
				amount: totalPrice,
				intentId: intent.id,
				classId: cls.id,
				studentId: rc.studentId,
				teacherId: rc.teacherId,
				platformFeeAmount: split.platformFeeAmount,
				teacherPayoutAmount: split.teacherPayoutAmount,
				platformFeeRateBps: split.platformFeeRateBps,
			},
		});
	} catch (err) {
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
				jitsiRoom,
			},
		});
		const message = err instanceof Error ? err.message : "Unknown error";
		await createNotification(
			rc.studentId,
			"regular_class_payment_failed",
			"Payment Failed",
			`We couldn't charge your card for an upcoming recurring class: ${message}. Please update your payment method.`,
			"/main/student/regular-classes",
		);
	}
}

/**
 * Materializes real, bookable `Class` occurrences for an `active` RegularClass
 * template, walking forward from its `lastMaterializedThrough` watermark (or
 * "now" on the first run) through a rolling window `WEEKS_AHEAD` weeks out.
 * Each new occurrence is charged (off-session, against the student's saved
 * card) as it's created — see createChargedOccurrence above.
 *
 * The watermark only ever moves forward. This is what stops a student's
 * cancelled occurrence (now soft-cancelled to status "cancelled", see
 * cancelClassCore) from silently reappearing on the next run — once a date
 * has been passed, it's never re-scanned, regardless of the row's status.
 *
 * Shared by the periodic worker job and by `acceptRegularClass`'s immediate
 * first-pass, so accepting a series doesn't make the student wait for the
 * next worker tick to see their first occurrence.
 *
 * Returns the number of new occurrences created.
 */
export async function materializeOccurrences(regularClassId: string): Promise<number> {
	const rc = await prisma.regularClass.findUnique({
		where: { id: regularClassId },
		include: {
			student: { select: { stripeCustomerId: true, defaultPaymentMethodId: true } },
		},
	});
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
					await createChargedOccurrence(rc, occurrenceStart, generateJitsiRoom());
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
