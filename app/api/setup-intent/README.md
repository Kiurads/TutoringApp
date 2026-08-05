# `app/api/setup-intent`

Stripe SetupIntent endpoint — a third, distinct flow from the two PaymentIntent flows (`app/api/payment-intent/**`). This one doesn't move money at all; it saves a card on file (off-session) for later automated charges against **recurring classes**.

## Files

- **`route.ts`** — `POST` handler (no request body). Auth-gates on session email, then:
  1. Loads the `User`, including `stripeCustomerId`.
  2. **Creates a Stripe Customer only if the user doesn't already have one**, and persists `stripeCustomerId` back onto the `User` row immediately — this is the app's only Stripe Customer-creation site, and every other flow (Flow A, Flow B) never creates or references a Customer object at all; they're anonymous PaymentIntents.
  3. Creates a SetupIntent with `usage: "off_session"` and `payment_method_types: ["card"]`, scoped to that customer.
  4. Returns `{ clientSecret }`.
- **`route.test.ts`** — 401 case, "reuses existing customer" case (asserts `customers.create` is NOT called), and "creates + persists a new customer" case.

## How it fits together

- **Caller**: `app/ui/main/regular-classes/request-regular-class-form.tsx`, which renders `app/ui/payment/setup-card-form.tsx` — a third Stripe Elements form (alongside `checkout-form.tsx` and `pre-auth-form.tsx`) that calls `stripe.confirmSetup({ elements, redirect: "if_required" })` and, on `succeeded`, hands the resulting `setupIntent.id` back up via an `onSaved` callback.
- **The saved card is actually charged later** by `app/lib/regular-classes/materialize-occurrences.ts` — each time a recurring class occurrence is materialized, that code charges the customer's saved payment method off-session. This route only sets up the reusable payment method; it never itself creates a charge.
- After `setup-card-form.tsx` gets a `succeeded` SetupIntent client-side, its `onSaved(setupIntentId)` callback flows into `app/lib/actions/payment-methods.actions.ts`, which **re-fetches the SetupIntent from Stripe by id** (`stripe.setupIntents.retrieve`) rather than trusting the client-reported status, verifies `setupIntent.customer === user.stripeCustomerId`, and only then persists `setupIntent.payment_method` as `User.defaultPaymentMethodId`. This route (`/api/setup-intent`) only issues the intent — it never writes `defaultPaymentMethodId` itself.

## Non-obvious conventions / gotchas

- This is the only place `stripeCustomerId` gets created/written — if a user's off-session card charge ever fails with "no such customer," this is the code path that should have set it up first.
- `usage: "off_session"` is required for `materialize-occurrences.ts`'s later off-session charges to be allowed by Stripe/card issuers without triggering SCA friction every time; don't drop it if refactoring this route.
- Like the other two PaymentIntent routes, the Stripe client comes from `getStripe()` (`app/lib/stripe.ts`), constructed lazily inside the handler — never at module scope.
