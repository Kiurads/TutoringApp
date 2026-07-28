import prisma from "@/prisma";
import Stripe from "stripe";
import { createNotification } from "@/app/lib/notifications";
import { reverseClassPoints } from "@/app/lib/gamification";

// Deliberately has no "use server"/auth import, unlike refund-requests.actions.ts
// — this needs to be safely importable from the worker (worker/src/expire-
// refund-requests.ts) without pulling in the whole NextAuth/Prisma-adapter
// chain, same reasoning as payouts.ts vs payouts.actions.ts and
// materialize-occurrences.ts vs regular-classes.actions.ts.
export async function expireIfNeeded(requestId: string) {
	const req = await prisma.refundRequest.findUnique({ where: { id: requestId } });
	if (!req || req.status !== "pending") return;
	if (new Date() < req.expiresAt) return;

	const cls = await prisma.class.findUnique({
		where: { id: req.classId },
		include: { payments: { select: { intentId: true }, take: 1 } },
	});

	if (cls?.payments[0]) {
		try {
			const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
			await stripe.refunds.create({ payment_intent: cls.payments[0].intentId });
		} catch { /* already refunded or failed — mark resolved anyway */ }
	}
	// Reverses regardless of the try/catch outcome above, matching this
	// function's existing "proceed as refunded either way" tolerance.
	if (cls) await reverseClassPoints(cls);

	await prisma.refundRequest.update({
		where: { id: requestId },
		data: { status: "expired" },
	});

	await createNotification(
		req.studentId,
		"refund_decided",
		"Refund Approved (Expired)",
		"Your no-show report was not disputed within 5 days. A refund has been issued.",
		`/main/student/classes/${req.classId}`,
	);
}
