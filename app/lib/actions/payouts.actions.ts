"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import Stripe from "stripe";
import type { ConnectStatus } from "@prisma/client";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";

function getAppUrl() {
	return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// Creates (if needed) a Stripe Express account for the current teacher and
// returns a fresh onboarding link. Account Links are single-use and expire
// after a few minutes, so this must be called fresh on every "Set up
// payouts" / "Continue onboarding" click — never cached or stored.
export async function startConnectOnboarding(): Promise<{ url?: string; error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "teacher") return { error: "Only teachers can set up payouts." };

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
	let accountId = user.stripeConnectAccountId;

	if (!accountId) {
		const account = await stripe.accounts.create({
			type: "express",
			email: user.email,
			capabilities: { transfers: { requested: true } },
			business_type: "individual",
			metadata: { userId: user.id },
		});
		accountId = account.id;
		await prisma.user.update({
			where: { id: user.id },
			data: { stripeConnectAccountId: accountId, connectStatus: "pending" },
		});
	}

	const appUrl = getAppUrl();
	const accountLink = await stripe.accountLinks.create({
		account: accountId,
		type: "account_onboarding",
		refresh_url: `${appUrl}/main/teacher/payouts?refresh=true`,
		return_url: `${appUrl}/main/teacher/payouts?return=true`,
	});

	return { url: accountLink.url };
}

export interface ConnectStatusInfo {
	hasAccount: boolean;
	connectStatus: ConnectStatus;
	connectChargesEnabled: boolean;
	connectPayoutsEnabled: boolean;
	connectDetailsSubmitted: boolean;
}

export async function getConnectStatus(): Promise<ConnectStatusInfo | { error: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "teacher") return { error: "Only teachers have payout status." };

	return {
		hasAccount: !!user.stripeConnectAccountId,
		connectStatus: user.connectStatus,
		connectChargesEnabled: user.connectChargesEnabled,
		connectPayoutsEnabled: user.connectPayoutsEnabled,
		connectDetailsSubmitted: user.connectDetailsSubmitted,
	};
}
