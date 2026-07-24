import { createPaymentForClass } from "@/app/lib/actions/paymets.actions";
import { sendDisputeAlertEmail } from "@/app/lib/email";
import { transferPendingPayoutsForTeacher } from "@/app/lib/payouts";
import prisma from "@/prisma";
import Stripe from "stripe";
import type { ConnectStatus } from "@prisma/client";

// Stripe requires a separate webhook destination (and signing secret) for
// "Events from: Connected accounts" vs "Your account" — account.updated for a
// teacher's Express account arrives on a different secret than everything
// else this endpoint already handles. STRIPE_WEBHOOK_SECRET_CONNECT can hold
// one or more comma-separated secrets (one per Connect destination), so
// adding another destination later never needs a code change.
function getWebhookSecrets(): string[] {
	return [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET_CONNECT]
		.flatMap((value) => value?.split(",") ?? [])
		.map((secret) => secret.trim())
		.filter(Boolean);
}

export async function POST(req: Request) {
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
	const sig = req.headers.get("stripe-signature") ?? "";
	const rawBody = await req.text(); // Read raw body directly

	let event: Stripe.Event | null = null;
	let lastError: unknown;
	for (const secret of getWebhookSecrets()) {
		try {
			event = stripe.webhooks.constructEvent(rawBody, sig, secret);
			break;
		} catch (err) {
			lastError = err;
		}
	}

	if (!event) {
		const message = lastError instanceof Error ? lastError.message : "Unknown error";
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

			// Disputes aren't actionable from inside The Learning Nexus (they're resolved in
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

		case "account.updated": {
			const account = event.data.object;
			const user = await prisma.user.findUnique({
				where: { stripeConnectAccountId: account.id },
				select: { id: true },
			});
			if (!user) break; // Not one of ours, or arrived before we persisted the id — safe to ignore

			const chargesEnabled = account.charges_enabled;
			const payoutsEnabled = account.payouts_enabled;
			const detailsSubmitted = account.details_submitted;
			const newStatus: ConnectStatus =
				chargesEnabled && payoutsEnabled && detailsSubmitted
					? "active"
					: detailsSubmitted
						? "restricted"
						: "pending";

			await prisma.user.update({
				where: { id: user.id },
				data: {
					connectChargesEnabled: chargesEnabled,
					connectPayoutsEnabled: payoutsEnabled,
					connectDetailsSubmitted: detailsSubmitted,
					connectStatus: newStatus,
					connectUpdatedAt: new Date(),
				},
			});

			// Just went fully active — sweep any completed-class payouts that
			// accrued while this teacher hadn't onboarded yet.
			if (newStatus === "active") {
				await transferPendingPayoutsForTeacher(user.id);
			}
			break;
		}

		default:
			break;
	}

	return new Response(JSON.stringify({ received: true }), { status: 200 });
}
