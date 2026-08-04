import { createPaymentForClass } from "@/app/lib/actions/paymets.actions";
import { sendDisputeAlertEmail, sendPaymentIssueAlertEmail } from "@/app/lib/email";
import { transferPendingPayoutsForTeacher } from "@/app/lib/payouts";
import { createNotification } from "@/app/lib/notifications";
import prisma from "@/prisma";
import { getStripe } from "@/app/lib/stripe";
import type Stripe from "stripe";
import type { ConnectStatus } from "@prisma/client";

async function getAdminEmails(): Promise<string[]> {
	const admins = await prisma.user.findMany({
		where: { role: "admin" },
		select: { email: true },
	});
	return admins.map((admin) => admin.email);
}

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
	const stripe = getStripe();
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
			const reason = intent.last_payment_error?.message ?? "no error message";
			console.error(
				`[stripe webhook] payment_intent.payment_failed: intent ${intent.id}` +
					(intent.metadata?.classId ? `, class ${intent.metadata.classId}` : "") +
					` — ${reason}. Needs manual review.`
			);

			const admins = await getAdminEmails();
			await Promise.all(
				admins.map((email) =>
					sendPaymentIssueAlertEmail(email, {
						kind: "payment_failed",
						intentId: intent.id,
						classId: intent.metadata?.classId,
						reason,
					})
				)
			);
			break;
		}

		case "payment_intent.canceled": {
			const intent = event.data.object;
			const reason = `canceled — reason: ${intent.cancellation_reason ?? "unknown"}. If the linked class is still "scheduled", it may need manual reconciliation (Stripe auto-cancels an uncaptured pre-auth after ~7 days).`;
			console.error(
				`[stripe webhook] payment_intent.canceled: intent ${intent.id}` +
					(intent.metadata?.classId ? `, class ${intent.metadata.classId}` : "") +
					` — ${reason}`
			);

			const admins = await getAdminEmails();
			await Promise.all(
				admins.map((email) =>
					sendPaymentIssueAlertEmail(email, {
						kind: "pre_auth_canceled",
						intentId: intent.id,
						classId: intent.metadata?.classId,
						reason,
					})
				)
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
			const admins = await getAdminEmails();
			await Promise.all(
				admins.map((email) =>
					sendDisputeAlertEmail(email, {
						disputeId: dispute.id,
						paymentIntentId: paymentIntentId ?? "unknown",
						reason: dispute.reason,
						amount: dispute.amount,
					})
				)
			);
			break;
		}

		case "charge.dispute.closed": {
			const dispute = event.data.object;
			const paymentIntentId =
				typeof dispute.payment_intent === "string"
					? dispute.payment_intent
					: dispute.payment_intent?.id;

			console.error(
				`[stripe webhook] charge.dispute.closed: dispute ${dispute.id}, payment intent ${paymentIntentId}, status ${dispute.status}, amount ${dispute.amount}.`
			);

			// A won dispute (or one lost before any payout went out) needs no
			// further reconciliation on our side. A lost dispute after the
			// teacher was already paid out is the same shape of problem as a
			// transfer reversal above — the platform no longer has the funds
			// it already sent out — so it's surfaced the same way: mark the
			// payout failed (visible to the teacher/admin) and notify.
			if (paymentIntentId && dispute.status === "lost") {
				const payment = await prisma.payment.findFirst({
					where: { intentId: paymentIntentId },
				});
				if (payment && payment.payoutStatus === "transferred") {
					await prisma.payment.update({
						where: { id: payment.id },
						data: {
							payoutStatus: "failed",
							payoutError: `Dispute ${dispute.id} lost — funds returned to the customer after the teacher was already paid out.`,
						},
					});
					await createNotification(
						payment.teacherId,
						"payout_reversed",
						"Payout Disputed",
						`A class you were paid €${Number(payment.teacherPayoutAmount).toFixed(2)} for is now under a lost payment dispute. Contact support.`,
						"/main/teacher/payouts",
					);
				}
			}
			break;
		}

		case "transfer.reversed": {
			// Only synchronous errors from stripe.transfers.create are caught in
			// payouts.ts — a transfer that succeeded and was marked "transferred"
			// can still be reversed later (e.g. the connected account gets
			// restricted or its balance is insufficient to cover a later
			// deduction). Without this, that row stays marked "transferred"
			// forever even though the money came back to the platform.
			const transfer = event.data.object;
			const payment = await prisma.payment.findFirst({
				where: { transferId: transfer.id },
			});
			if (!payment) break; // Not one of ours, or arrived before we recorded the transferId

			await prisma.payment.update({
				where: { id: payment.id },
				data: {
					payoutStatus: "failed",
					payoutError: `Transfer reversed by Stripe (amount_reversed: ${transfer.amount_reversed}).`,
				},
			});

			console.error(
				`[stripe webhook] transfer.reversed: transfer ${transfer.id}, payment ${payment.id}, class ${payment.classId} — amount_reversed ${transfer.amount_reversed}. Needs manual review: the teacher's payout was clawed back but the student was not automatically refunded.`
			);

			await createNotification(
				payment.teacherId,
				"payout_reversed",
				"Payout Reversed",
				`A previous payout of €${Number(payment.teacherPayoutAmount).toFixed(2)} was reversed by Stripe. Contact support if this is unexpected.`,
				"/main/teacher/payouts",
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

		case "account.application.deauthorized": {
			// Fires when a teacher disconnects the platform's access to their
			// Connect account (or Stripe revokes it). Without this, future
			// completed classes for them keep silently failing to pay out —
			// transferPayoutForClass would try to transfer to an account we no
			// longer have access to — with no reason surfaced anywhere. The
			// connected account id lives on the event itself (Connect-scoped
			// events aren't otherwise tied to a specific object we can look up).
			const accountId = event.account;
			if (!accountId) break;

			const user = await prisma.user.findUnique({
				where: { stripeConnectAccountId: accountId },
				select: { id: true },
			});
			if (!user) break;

			// Clear the account id (not just the status): a stale id here would
			// make startConnectOnboarding try to reuse an account the platform
			// no longer has access to. Clearing it means the teacher's next
			// onboarding attempt creates a fresh Express account instead.
			await prisma.user.update({
				where: { id: user.id },
				data: {
					stripeConnectAccountId: null,
					connectStatus: "not_started",
					connectChargesEnabled: false,
					connectPayoutsEnabled: false,
					connectDetailsSubmitted: false,
					connectUpdatedAt: new Date(),
				},
			});

			console.error(
				`[stripe webhook] account.application.deauthorized: account ${accountId}, user ${user.id} — teacher disconnected Stripe Connect. Future completed classes for them will accrue as pending payouts until they reconnect.`
			);

			await createNotification(
				user.id,
				"connect_disconnected",
				"Stripe Account Disconnected",
				"Your Stripe account was disconnected, so future class payouts can't be sent. Reconnect it from Payouts to keep getting paid.",
				"/main/teacher/payouts",
			);
			break;
		}

		default:
			break;
	}

	return new Response(JSON.stringify({ received: true }), { status: 200 });
}
