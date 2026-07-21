import "server-only";

import Stripe from "stripe";

// Lazily constructed: Next.js imports every route module during `next build`
// to collect page data, even for fully dynamic/authenticated routes. Building
// the client eagerly at module scope means the build itself crashes in any
// environment without STRIPE_SECRET_KEY set (e.g. CI without Stripe secrets
// configured, or a build stage that runs before secrets are mounted) — the
// other two Stripe call sites in this app already construct their client
// inside the request handler for the same reason; this matches that.
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
	if (!stripeInstance) {
		stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string);
	}
	return stripeInstance;
}
