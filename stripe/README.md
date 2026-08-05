# stripe

A single file, and it appears to be **dead code**.

## Key files

- **`get-stripe.ts`** — a client-side Stripe.js loader: `getStripe()` memoizes and returns a `Promise<Stripe | null>` from `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` (the `@stripe/stripe-js` browser SDK, keyed by the *publishable* key). This is unrelated to `app/lib/stripe.ts`, which is the **server-side** Stripe SDK client (keyed by the *secret* key) — the two files share a function name (`getStripe`) but serve opposite purposes and live in different runtimes; don't confuse them.

## Gotcha — unused

Every real payment component that needs the client-side Stripe.js instance (`app/ui/payment/checkout-form.tsx`, `pre-auth-form.tsx`, `setup-card-form.tsx`) calls `loadStripe(...)` **inline itself** rather than importing this shared helper. A repo-wide search finds no import of `stripe/get-stripe` anywhere in `app/**`. This file looks like an early scaffold that was superseded by each component constructing its own `stripePromise`, and was never deleted. If you're adding a new Stripe.js-consuming component, consider whether to finally import this shared helper (removing the duplication across the three existing components) rather than adding a fourth inline `loadStripe()` call — but that's a refactor, not something this README is asking you to do.
