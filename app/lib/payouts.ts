"use server";

import prisma from "@/prisma";
import Stripe from "stripe";
import { createNotification } from "@/app/lib/notifications";

// Attempts to transfer a completed class's teacher payout to their connected
// Stripe account. Called once a Class transitions to "completed" — from both
// classes.actions.ts's completeClass (the manual/UI path) AND the worker's
// markCompletedClasses (the automated poller). Shared here the same way
// gamification.ts already is between the two.
//
// Idempotency: two independent callers (a manual "Mark Complete" click and
// the worker's 5-min poll) could race on the same class reaching "completed"
// at nearly the same moment. A conditional updateMany is the compare-and-swap
// guard — only the caller whose update actually affects a row proceeds to
// call Stripe — rather than relying on the two triggers to coordinate.
export async function transferPayoutForClass(classId: string): Promise<void> {
	const payment = await prisma.payment.findFirst({
		where: { classId },
		include: {
			teacher: {
				select: { id: true, stripeConnectAccountId: true, connectPayoutsEnabled: true },
			},
		},
	});
	if (!payment) return; // Class was never paid (e.g. pre-auth never captured) — nothing to pay out
	if (payment.payoutStatus === "transferred") return;

	if (!payment.teacher.stripeConnectAccountId || !payment.teacher.connectPayoutsEnabled) {
		// Teacher hasn't onboarded (or onboarding incomplete) — accrue for
		// later. Only claims the row if it isn't already transferred, so a
		// concurrent caller that already flipped it to "transferred" wins.
		await prisma.payment.updateMany({
			where: { id: payment.id, payoutStatus: { not: "transferred" } },
			data: { payoutStatus: "pending" },
		});
		return;
	}

	// Claim this payout before calling Stripe — the DB is the guard, not
	// call-site coordination between the server action and the worker.
	const claim = await prisma.payment.updateMany({
		where: { id: payment.id, payoutStatus: { in: ["not_applicable", "pending", "failed"] } },
		data: { payoutAttemptedAt: new Date() },
	});
	if (claim.count === 0) return; // another caller already claimed/transferred this payout

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
	try {
		const transfer = await stripe.transfers.create({
			amount: Math.round(Number(payment.teacherPayoutAmount) * 100),
			currency: "eur",
			destination: payment.teacher.stripeConnectAccountId,
			transfer_group: `class_${classId}`,
			metadata: { classId, paymentId: payment.id },
		});

		await prisma.payment.update({
			where: { id: payment.id },
			data: { payoutStatus: "transferred", transferId: transfer.id },
		});

		await createNotification(
			payment.teacherId,
			"payout_sent",
			"Payout Sent",
			`€${Number(payment.teacherPayoutAmount).toFixed(2)} has been transferred to your Stripe account.`,
			"/main/teacher/payouts",
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		await prisma.payment.update({
			where: { id: payment.id },
			data: { payoutStatus: "failed", payoutError: message },
		});
	}
}

// Sweeps all of a teacher's accrued-but-unpaid completed-class payouts —
// called when their Connect account just became fully active (see the
// account.updated webhook handler).
export async function transferPendingPayoutsForTeacher(teacherId: string): Promise<void> {
	const pending = await prisma.payment.findMany({
		where: { teacherId, payoutStatus: { in: ["pending", "failed"] } },
		select: { classId: true },
	});

	for (const p of pending) {
		await transferPayoutForClass(p.classId);
	}
}
