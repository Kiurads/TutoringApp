import { createPaymentForClass } from "@/app/lib/actions/paymets.actions";
import { sendDisputeAlertEmail } from "@/app/lib/email";
import prisma from "@/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
	const sig = req.headers.get("stripe-signature") ?? "";
	const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

	let event: Stripe.Event;
	try {
		const rawBody = await req.text(); // Read raw body directly
		event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return new Response(
			JSON.stringify({ error: `Webhook Error: ${message}` }),
			{ status: 400 }
		);
	}

	switch (event.type) {
		case "payment_intent.succeeded": {
			const intent = event.data.object;
			const classId = intent.metadata?.classId;

			if (classId) {
				// Idempotency: skip if a Payment record already exists for this intent
				// (acceptClassById creates it inline for pre-auth captures)
				const existing = await prisma.payment.findFirst({
					where: { intentId: intent.id },
				});
				if (!existing) {
					await createPaymentForClass(classId, intent.id);
				}
			}
			break;
		}

		// The four cases below aren't acted on automatically — this app doesn't
		// have enough context to safely guess the right business-logic response
		// (e.g. a canceled pre-auth might mean the class needs to be refused, or
		// might already be handled by the flow that canceled it). They're logged
		// with enough detail for manual reconciliation instead. Once error
		// monitoring is wired up (see plan.md Phase 11B), these should route
		// there rather than console.error.

		case "payment_intent.payment_failed": {
			const intent = event.data.object;
			console.error(
				`[stripe webhook] payment_intent.payment_failed: intent ${intent.id}` +
					(intent.metadata?.classId ? `, class ${intent.metadata.classId}` : "") +
					` — ${intent.last_payment_error?.message ?? "no error message"}. Needs manual review.`
			);
			break;
		}

		case "payment_intent.canceled": {
			const intent = event.data.object;
			console.error(
				`[stripe webhook] payment_intent.canceled: intent ${intent.id}` +
					(intent.metadata?.classId ? `, class ${intent.metadata.classId}` : "") +
					` — reason: ${intent.cancellation_reason ?? "unknown"}. If the linked class is still "scheduled", it may need manual reconciliation (Stripe auto-cancels an uncaptured pre-auth after ~7 days).`
			);
			break;
		}

		case "charge.refunded": {
			const charge = event.data.object;
			const intentId =
				typeof charge.payment_intent === "string"
					? charge.payment_intent
					: charge.payment_intent?.id;
			console.error(
				`[stripe webhook] charge.refunded: charge ${charge.id}` +
					(intentId ? `, payment intent ${intentId}` : "") +
					`, amount refunded: ${charge.amount_refunded}.`
			);
			break;
		}

		case "charge.dispute.created": {
			const dispute = event.data.object;
			const paymentIntentId =
				typeof dispute.payment_intent === "string"
					? dispute.payment_intent
					: dispute.payment_intent?.id;
			console.error(
				`[stripe webhook] charge.dispute.created: dispute ${dispute.id}, payment intent ${paymentIntentId}, reason ${dispute.reason}, amount ${dispute.amount}. Needs immediate manual review in the Stripe dashboard before the evidence deadline.`
			);

			// Disputes aren't actionable from inside eStudyou (they're resolved in
			// the Stripe dashboard), so email is the right channel here rather
			// than an in-app notification.
			const admins = await prisma.user.findMany({
				where: { role: "admin" },
				select: { email: true },
			});
			await Promise.all(
				admins.map((admin) =>
					sendDisputeAlertEmail(admin.email, {
						disputeId: dispute.id,
						paymentIntentId: paymentIntentId ?? "unknown",
						reason: dispute.reason,
						amount: dispute.amount,
					})
				)
			);
			break;
		}

		default:
			break;
	}

	return new Response(JSON.stringify({ received: true }), { status: 200 });
}
