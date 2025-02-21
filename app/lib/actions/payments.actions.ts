import Stripe from "stripe";

export async function createPaymentIntent(
	amount: number,
	currency: string = "EUR"
): Promise<string> {
	// Initialize Stripe
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

	try {
		// Create a PaymentIntent
		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(amount * 100), // Convert amount to cents
			currency: currency, // Use dynamic currency
			automatic_payment_methods: {
				enabled: true, // Let Stripe handle payment methods
			},
		});

		// Return the client secret
		if (!paymentIntent.client_secret) {
			throw new Error(
				"Failed to create PaymentIntent: client_secret is missing."
			);
		}

		return paymentIntent.client_secret;
	} catch (error: any) {
		// Log the error for debugging
		console.error("Error creating PaymentIntent:", error);

		// Return a generic error message to the client
		throw new Error("Failed to create PaymentIntent. Please try again.");
	}
}
