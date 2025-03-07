import { createPaymentForClass } from "@/app/lib/actions/paymets.actions";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

export async function POST(req) {
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
	const sig = req.headers.get("stripe-signature");
	const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

	let event;
	try {
		const rawBody = await req.text(); // Read raw body directly
		event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
	} catch (err) {
		return new Response(
			JSON.stringify({ error: `Webhook Error: ${err.message}` }),
			{ status: 400 }
		);
	}

	if (event.type === "payment_intent.succeeded") {
		console.log("✅ Payment received:", event.data.object.id);

		await createPaymentForClass(
			event.data.object.metadata.classId,
			event.data.object.id
		);
	}

	return new Response(JSON.stringify({ received: true }), { status: 200 });
}
