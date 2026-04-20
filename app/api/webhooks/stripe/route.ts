import { createPaymentForClass } from "@/app/lib/actions/paymets.actions";
import Stripe from "stripe";

export async function POST(req: Request) {
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
	const sig = req.headers.get("stripe-signature") ?? "";
	const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

	let event;
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

	if (event.type === "payment_intent.succeeded") {
		const intentId = event.data.object.id;
		const classId  = event.data.object.metadata?.classId;

		if (classId) {
			// Idempotency: skip if a Payment record already exists for this intent
			// (acceptClassById creates it inline for pre-auth captures)
			const existing = await import("@/prisma").then((m) =>
				m.default.payment.findFirst({ where: { intentId } }),
			);
			if (!existing) {
				await createPaymentForClass(classId, intentId);
			}
		}
	}

	return new Response(JSON.stringify({ received: true }), { status: 200 });
}
