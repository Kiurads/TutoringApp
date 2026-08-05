# app/lib/refund-requests

A single background-safe helper that auto-resolves a `RefundRequest` once its response window has passed. The interactive create/approve/deny actions for refund requests live in `app/lib/actions/refund-requests.actions.ts` — this directory holds only the piece that needs to run outside a Next.js server-action context.

## Key file

- **`expire-refund-request.ts`** — exports `expireIfNeeded(requestId)`. Given a refund request id, no-ops unless the request is still `status: "pending"` **and** `new Date() >= req.expiresAt` (i.e. the dispute window has closed with no teacher response). When both hold:
  1. Looks up the associated `Class` and its first `Payment` (`payments[0]`).
  2. If a payment exists, attempts a Stripe refund (`stripe.refunds.create`) for that `payment_intent`, but the failure is swallowed (`catch { /* already refunded or failed — mark resolved anyway */ }`) — the request still gets marked `expired` regardless of whether the Stripe call actually succeeded, per the "proceed as refunded either way" tolerance called out in the inline comment.
  3. Calls `reverseClassPoints(cls)` (from `app/lib/gamification.ts`) **unconditionally**, matching the same "proceed either way" tolerance — points/gems already awarded for the class are clawed back even if the Stripe refund itself silently failed.
  4. Flips `RefundRequest.status` to `"expired"` and notifies the student (`refund_decided`, "Refund Approved (Expired)").
  - **Deliberately has no `"use server"` directive and no `auth()` import**, unlike `refund-requests.actions.ts`. The inline comment spells out why: this needs to be safely importable from `worker/src/expire-refund-requests.ts` without dragging in the whole NextAuth/Prisma-adapter chain that a Next.js server action file implicitly pulls in. The same split exists elsewhere in the codebase for the same reason — `payouts.ts` vs. `payouts.actions.ts`, and `materialize-occurrences.ts` vs. `regular-classes.actions.ts` — this is a recurring, intentional pattern: **plain, framework-free logic lives in `app/lib/<domain>/`, and the Next.js server-action wrapper (auth-gated, `"use server"`) lives in `app/lib/actions/<domain>.actions.ts`.**

## How it fits together

- Called by `worker/src/expire-refund-requests.ts` on a periodic sweep, checking pending refund requests past their `expiresAt`.
- The "no-show report → refund request → 5-day dispute window → auto-approve if undisputed" flow is initiated elsewhere (`refund-requests.actions.ts`, triggered from the no-show reporting UI — see `app/ui/main/classes/no-show-report-section.tsx`); this file is purely the timeout-expiry half of that flow. A teacher who disputes within the window presumably resolves the request through a different action in `refund-requests.actions.ts` before `expireIfNeeded` would ever act on it (its `status !== "pending"` guard is what makes that safe — a disputed/resolved request is simply skipped).
- Reuses `createNotification` (`app/lib/notifications.ts`) and `reverseClassPoints` (`app/lib/gamification.ts`) rather than reimplementing either.

## Gotchas

- The Stripe-refund-failure swallow is intentional, not a missing error path — don't add a bail-out on Stripe error without understanding this means "mark expired/refunded" is meant to be an unconditional side effect once the window has passed, presumably because the alternative (an unresolved refund request stuck in limbo) is considered worse than a rare double-refund-attempt or a mismatch between Stripe state and app state.
- `reverseClassPoints` runs even when the Stripe refund call failed — if you ever need points reversal to be conditional on refund success, that's a behavior change, not a bug fix.
- No file-level test exists in this directory as of this writing (no `expire-refund-request.test.ts` alongside it) — check `worker/` or `refund-requests.actions.test.ts` for related coverage before assuming this path is untested.
