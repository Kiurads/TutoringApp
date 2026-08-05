# `app/api/payment-intent/pre-auth`

Stripe PaymentIntent endpoint for **Flow B — pre-authorization / manual capture**, the newer of the app's two payment paths. Unlike `../route.ts` (Flow A), this route runs *before* a `Class` row exists — it authorizes a hold on the student's card at request time, and nothing is charged until a teacher accepts.

## Files

- **`route.ts`** — `POST` handler, more involved than the Flow A route:
  1. Auth-gates on session email.
  2. Validates required fields (`teacherId`, `durationInHours`, `startTime`).
  3. Loads the teacher's `pricePerHour` directly from `prisma.user` (not from a pre-existing class — there isn't one yet).
  4. **Re-validates availability server-side** via `isWithinAvailability` (`app/lib/availability/check-availability.ts`) against the teacher's `TeacherAvailability` rows — the client's slot selection is never trusted, returns `422` if the requested `startTime`/`durationInHours` falls outside it. Note the comment in the code: this check is "only enforced if the teacher has configured slots" — a teacher with zero `TeacherAvailability` rows effectively has no server-side time restriction.
  5. Looks up the student's `StudentGameProfile.studyBoostActive` flag and applies a discount via `computeClassPrice()` (`app/lib/classes/compute-class-price.ts`) — a 5% Study Boost discount when active (see `pre-auth/route.test.ts`'s "20 * 1 * 0.95 = 19" case).
  6. Creates the PaymentIntent with **`capture_method: "manual"`** — this is what makes it a hold instead of an immediate charge — and stashes `teacherId`, `durationInHours`, `createdByEmail`, and `studyBoostApplied` in `metadata` (note: no `classId` here, since none exists yet).
  7. Returns `{ clientSecret, intentId, totalPrice, studyBoostApplied }` — this is the one PaymentIntent route in the app that returns the raw intent id to the client, because the caller needs it to pass into `createClassWithPreAuth`.
- **`route.test.ts`** — covers 401/400/404/422 paths, the happy-path pricing/metadata assertion, and the Study Boost discount math. Comment worth noting: "Stripe must be mocked as a class (constructor) — arrow functions cannot be called with `new`" — a real gotcha when mocking `getStripe()`'s return value in tests that construct `new Stripe(...)` elsewhere (see `app/lib/payouts.ts`, which does NOT go through `getStripe()` — see that file's own notes).

## How it fits together

- **Caller**: `app/ui/main/classes/create/student/create-class-form.tsx` (the student booking flow) fetches `clientSecret`/`intentId` from this route, then renders `app/ui/payment/pre-auth-form.tsx`, which confirms the PaymentIntent client-side via `stripe.confirmPayment({ elements, redirect: "if_required" })`.
- **On `requires_capture` status**, the client calls `createClassWithPreAuth(classData, paymentIntent.id)` (`app/lib/classes/create-class-with-pre-auth.ts`) — *this* is what actually creates the `Class` row, with `preAuthIntentId` set and `status: "requested"`. This route itself never touches the `Class` table.
- **Capture happens later, in `acceptClassById`** (`app/lib/actions/classes.actions.ts`, owned by class-lifecycle-engineer) — when the teacher accepts, it calls `stripe.paymentIntents.capture()` directly and inserts the `Payment` row inline (plus gamification hooks).
- **Release happens in `refuseClassById`** and in `cancelClassById` when unpaid — both call `stripe.paymentIntents.cancel()` to void the hold.
- **Refund tiers** (for already-captured/paid classes) live in `cancelClassById`, not here: `>24h` before `startTime` → full refund, `12–24h` → 50%, `≤12h` → no refund, via `stripe.refunds.create()`.
- The webhook (`app/api/webhooks/stripe/route.ts`) still fires `payment_intent.succeeded` when a manual-capture intent is captured — its idempotency guard (checking for an existing `Payment` by `intentId` before calling `createPaymentForClass`) exists specifically because `acceptClassById` may already have written that `Payment` row inline before the webhook event arrives. Never remove that guard.

## Non-obvious conventions / gotchas

- This is the only PaymentIntent creation site in the app that does its own **server-side price computation** (`computeClassPrice`) rather than trusting an already-persisted `totalPrice` — because none exists yet at request time.
- `capture_method: "manual"` is the single flag that defines this whole flow; if you ever see a manual-capture intent, assume Flow B semantics (hold → accept/refuse/cancel lifecycle) apply, not Flow A's fire-and-forget auto-capture.
- Availability re-validation here is server-authoritative but silent when a teacher has no configured availability rows at all — don't assume a `422` here means every teacher has enforced hours.
- `metadata.classId` is deliberately absent at this stage (chicken-and-egg — the class doesn't exist yet); `createClassWithPreAuth` presumably needs to reconcile the intent back to the new class by `intentId`/`preAuthIntentId`, not by metadata.
