# `app/api/payment-intent`

Stripe PaymentIntent endpoint for **Flow A — immediate capture**, the older/simpler of the app's two payment paths. This route is for classes that already exist in the DB with a known `totalPrice` and are sitting unpaid (status `scheduled`) — e.g. a broadcast request that got claimed after the fact, or a teacher-initiated booking. See `pre-auth/README.md` for the other flow (manual-capture, pre-authorization at request time, before a class row even exists).

## Files

- **`route.ts`** — `POST` handler. Auth-gates on session email, loads the class via `fetchClassById(classId)`, 404s if the class or its `totalPrice` is missing, converts the price to cents (`Math.round(parseFloat(totalPrice) * 100)`), and calls `stripe.paymentIntents.create({ amount, currency: "eur", metadata: { classId } })` — a standard **auto-capture** intent (no `capture_method` override). Returns `{ clientSecret }` only; the intent id itself is never sent to the client.
- **`route.test.ts`** — covers the 401/404 paths, the happy path (asserts the exact `paymentIntents.create` call shape), and a rounding case (`10.005` → `1001` cents, i.e. cents are rounded, not truncated).

## How it fits together

- **Caller**: `app/ui/main/classes/details/class-action-modals.tsx` — the "Pay Now" action — fetches `clientSecret` from this route, then hands it to `app/ui/payment/checkout-form.tsx`, which wraps Stripe `<Elements>` and calls `stripe.confirmPayment()` client-side.
- **Persistence is NOT done here.** This route only creates the intent. The actual `Payment` row gets written later by `app/api/webhooks/stripe/route.ts` when Stripe fires `payment_intent.succeeded` — it reads `metadata.classId` back off the event and calls `createPaymentForClass(classId, intent.id)` from `app/lib/actions/paymets.actions.ts`. If you're debugging "payment succeeded but nothing changed in the DB," the webhook (and whether `STRIPE_WEBHOOK_SECRET` is correctly forwarding locally via `stripe listen`) is where to look, not this route.
- Class price validation/lookup goes through `fetchClassById` in `app/lib/actions/classes.actions.ts` (owned by class-lifecycle-engineer) — this route trusts whatever `totalPrice` is already persisted on the class; it does not recompute pricing the way `pre-auth/route.ts` does.

## Non-obvious conventions / gotchas

- **Amount is derived from `parseFloat(classData.totalPrice)`**, a Prisma Decimal serialized to string — rounding happens once, in cents, at intent-creation time. There's no re-validation against a live teacher rate here (unlike the pre-auth flow), because by the time a class is in Flow A its price was already fixed at creation.
- **`currency` is hardcoded `"eur"`** — same convention across every PaymentIntent/SetupIntent/Transfer call site in the app.
- **`metadata.classId` is the only link** back to the app's data model — the webhook trusts nothing else off the event.
- No `capture_method` is set, which means Stripe defaults to `automatic` — funds move as soon as the customer confirms, unlike the pre-auth flow's `manual` capture. Don't add `capture_method: "manual"` here without also adding an explicit capture step somewhere; nothing in Flow A currently captures separately.
