# `app/ui/payment`

Client-side Stripe Elements forms — one per Stripe intent type the app uses. Each file is a self-contained `"use client"` component that wraps Stripe's `<Elements>` provider around a `<PaymentElement>` and confirms the intent, then hands control back up via props/callbacks. All three call `loadStripe()` **inline, locally**, rather than importing the shared helper at `/stripe/get-stripe.ts` (repo root) — that helper currently has zero importers anywhere in the app; if asked to deduplicate, prefer migrating these three call sites onto it rather than deleting it, since the duplication looks unintentional rather than deliberate.

## Files — mapped to their flow

| File | Stripe intent type | Flow | Confirm call |
|---|---|---|---|
| `checkout-form.tsx` | PaymentIntent (auto-capture) | **Flow A** — immediate capture | `stripe.confirmPayment({ elements, confirmParams: { return_url } })` — full redirect flow, not `redirect: "if_required"` |
| `pre-auth-form.tsx` | PaymentIntent (`capture_method: "manual"`) | **Flow B** — pre-authorization | `stripe.confirmPayment({ elements, redirect: "if_required" })` |
| `setup-card-form.tsx` | SetupIntent | Recurring-class card-on-file (neither Flow A nor B) | `stripe.confirmSetup({ elements, redirect: "if_required" })` |

### `checkout-form.tsx`
Used by the "Pay Now" action in `app/ui/main/classes/details/class-action-modals.tsx` for classes created via Flow A (`app/api/payment-intent/route.ts`). On submit, calls `stripe.confirmPayment` with a `return_url` — this is a **redirect-based** confirmation (unlike the other two forms), meaning some payment methods will bounce the browser away and back. The `return_url` is built from `window.location.origin` plus a hardcoded path shape `/main/student/classes/${classId}/pay/success`. **This is flagged as a known gap**: the path is student-scoped even though Flow A is also used for teacher-initiated bookings, and historically didn't match the actual nested route structure. Verify current routing behavior before assuming this redirect target is correct — it should likely be derived from the caller's actual role-scoped path, not assumed to be `/main/student/...` unconditionally.

### `pre-auth-form.tsx`
Used by the student booking flow (`app/ui/main/classes/create/student/create-class-form.tsx`), fed a `clientSecret`/`intentId` from `app/api/payment-intent/pre-auth/route.ts`. Notably takes `classData: PreAuthClassData` and `totalPrice`/`teacherName` as props and renders its own booking summary + an explicit "pre-authorization only" info callout so the student understands their card isn't charged yet. On a `requires_capture` result, it calls `createClassWithPreAuth(classData, paymentIntent.id)` (`app/lib/classes/create-class-with-pre-auth.ts`) inside a `useTransition` — this is what actually creates the `Class` row; the form itself never touches the DB. Any other `paymentIntent.status` is treated as an error ("Unexpected payment status. Please try again.").

### `setup-card-form.tsx`
Used by `app/ui/main/regular-classes/request-regular-class-form.tsx`, fed a `clientSecret` from `app/api/setup-intent/route.ts`. On `succeeded`, calls the `onSaved(setupIntent.id)` prop rather than performing any persistence itself — the caller is responsible for feeding that id into `app/lib/actions/payment-methods.actions.ts` to actually attach the payment method to the user. Generic `submitLabel` prop (defaults to "Save Card") suggests this is reused for both initial card setup and later card-replacement flows — check call sites before assuming there's only one.

## Shared shape across all three

- All wrap `<Elements stripe={stripePromise} options={{ appearance: { theme: "stripe" }, clientSecret }}>` around an inner component that calls `useStripe()`/`useElements()` — the outer exported component exists solely to own the `<Elements>` boundary; the actual form logic lives in an unexported inner component (`PaymentForm`, `PreAuthInner`, `SetupCardInner`).
- All disable their submit button while `!stripe || !elements || isLoading`.
- All render an identical "Secured by Stripe" footer with a shield icon — a small UI convention worth preserving if adding a fourth form.
- None of the three import `app/lib/stripe.ts` (the server-only `getStripe()`) — that file is guarded by `import "server-only"` specifically so it can never be pulled into a client bundle like these.
