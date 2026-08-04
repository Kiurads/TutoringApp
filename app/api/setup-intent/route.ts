import { auth } from "@/auth";
import prisma from "@/prisma";
import { getStripe } from "@/app/lib/stripe";

// Creates (or reuses) a Stripe Customer for the current student and issues a
// SetupIntent so their card can be saved for later off-session charges — see
// app/lib/regular-classes/materialize-occurrences.ts, which charges this
// saved card each time a recurring class occurrence is materialized.
export async function POST() {
	const session = await auth();
	if (!session?.user?.email) {
		return Response.json({ error: "Not authenticated." }, { status: 401 });
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true, email: true, stripeCustomerId: true },
	});
	if (!user) {
		return Response.json({ error: "User not found." }, { status: 404 });
	}

	const stripe = getStripe();

	let customerId = user.stripeCustomerId;
	if (!customerId) {
		const customer = await stripe.customers.create({
			email: user.email,
			metadata: { userId: user.id },
		});
		customerId = customer.id;
		await prisma.user.update({
			where: { id: user.id },
			data: { stripeCustomerId: customerId },
		});
	}

	const setupIntent = await stripe.setupIntents.create({
		customer: customerId,
		payment_method_types: ["card"],
		usage: "off_session",
	});

	return Response.json({ clientSecret: setupIntent.client_secret });
}
