"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { getStripe } from "@/app/lib/stripe";

/**
 * Persists the payment method confirmed by a SetupIntent (see
 * app/api/setup-intent/route.ts) as the student's default for off-session
 * recurring-class charges. Re-fetches the SetupIntent from Stripe rather
 * than trusting the client-supplied id at face value, and checks it belongs
 * to this user's own Stripe Customer before saving.
 */
export async function saveDefaultPaymentMethod(
	setupIntentId: string,
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true, stripeCustomerId: true },
	});
	if (!user?.stripeCustomerId) return { error: "No payment profile found." };

	const stripe = getStripe();
	const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

	if (setupIntent.customer !== user.stripeCustomerId) {
		return { error: "This payment method does not belong to your account." };
	}
	if (setupIntent.status !== "succeeded" || !setupIntent.payment_method) {
		return { error: "Card setup was not completed." };
	}

	await prisma.user.update({
		where: { id: user.id },
		data: { defaultPaymentMethodId: setupIntent.payment_method as string },
	});

	return {};
}

export async function getPaymentMethodStatus(): Promise<{ hasPaymentMethod: boolean }> {
	const session = await auth();
	if (!session?.user?.email) return { hasPaymentMethod: false };

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { defaultPaymentMethodId: true },
	});

	return { hasPaymentMethod: !!user?.defaultPaymentMethodId };
}
