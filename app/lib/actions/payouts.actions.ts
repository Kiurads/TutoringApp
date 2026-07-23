"use server";

import { auth } from "@/auth";
import Stripe from "stripe";
import type { ConnectStatus } from "@prisma/client";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import { ensureConnectAccount } from "@/app/lib/payouts";

function getAppUrl() {
	return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// Returns a fresh onboarding link for the current teacher's Stripe Express
// account (creating the account first if registerTeacher's best-effort
// creation didn't already, or somehow failed). Account Links are single-use
// and expire after a few minutes, so this must be called fresh on every
// "Set up payouts" / "Continue onboarding" click — never cached or stored.
export async function startConnectOnboarding(): Promise<{ url?: string; error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "teacher") return { error: "Only teachers can set up payouts." };

	const accountId = await ensureConnectAccount(user);
	if (!accountId) {
		return { error: "Couldn't start payout setup. Please try again shortly." };
	}

	try {
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
		const appUrl = getAppUrl();
		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			type: "account_onboarding",
			refresh_url: `${appUrl}/main/teacher/payouts?refresh=true`,
			return_url: `${appUrl}/main/teacher/payouts?return=true`,
		});

		return { url: accountLink.url };
	} catch (err) {
		// Surfaces as a friendly inline error (see ConnectOnboardingButton)
		// instead of crashing the whole page — e.g. Stripe Connect not yet
		// enabled for this platform account, or a transient API error.
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[startConnectOnboarding]", message);
		return { error: "Couldn't start payout setup. Please try again shortly." };
	}
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
