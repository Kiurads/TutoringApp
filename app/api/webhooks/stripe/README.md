# `app/api/webhooks/stripe`

The single Stripe webhook receiver for the whole app (`POST /api/webhooks/stripe`). This is the reconciliation point for everything Stripe does asynchronously — payment completion, Connect account status, disputes, and reversed transfers — across both payment flows and the Connect payout system.

## Files

- **`route.ts`** — the handler. Structure:
  1. Reads the raw body via `req.text()` and verifies the `stripe-signature` header with `stripe.webhooks.constructEvent`. **Never** parse the body as JSON before this, and never add middleware that could consume/transform the request body ahead of this route — signature verification needs the exact raw bytes.
  2. **Two webhook secrets, tried in order**: `getWebhookSecrets()` reads `STRIPE_WEBHOOK_SECRET` (the platform account) and `STRIPE_WEBHOOK_SECRET_CONNECT` (Connect-scoped events like `account.updated`), each of which may itself be a comma-separated list of secrets (supporting multiple Connect webhook destinations without a code change). It tries `constructEvent` against every configured secret until one verifies; only fails 400 if none do. In local testing this means `STRIPE_WEBHOOK_SECRET` must match whatever the Stripe CLI's `stripe listen` prints, not a dashboard value — see `start-stripe.bat` at the repo root.
  3. Dispatches on `event.type` via a `switch`.
- **`route.test.ts`** — exhaustive per-event-type coverage, including the multi-secret fallback, every branch below, and the two idempotency/no-op cases per handler (e.g. "is a safe no-op when no Payment matches").

## Event handlers

| Event | What it does |
|---|---|
| `payment_intent.succeeded` | Reads `metadata.classId`. **Idempotency guard**: checks for an existing `Payment` row by `intentId` before calling `createPaymentForClass(classId, intent.id)` (`app/lib/actions/paymets.actions.ts`). This guard exists because Flow B's `acceptClassById` may already have inserted the `Payment` row inline (capture also fires this event) before this webhook arrives. **Never remove it** — doing so double-inserts payments and double-awards gamification gems per pre-auth capture. |
| `payment_intent.payment_failed` | Not auto-remediated (the app can't safely guess whether e.g. a Flow A intent should just let the student retry, or a Flow B pre-auth failure needs the class refused). Logs via `console.error` and emails every admin (`sendPaymentIssueAlertEmail`, `app/lib/email.ts`) for manual review. |
| `payment_intent.canceled` | Same "log + email admins" treatment. Comment flags that Stripe auto-cancels an uncaptured pre-auth after ~7 days, so a `scheduled`/`requested` class still sitting around when this fires may need manual reconciliation. |
| `charge.refunded` | Logged only (`console.error`) — no DB write. Refund tiers/logic already lives upstream in `cancelClassById`, which calls `stripe.refunds.create()` itself; this handler is just an observability tap. |
| `charge.dispute.created` | Logged + emails every admin via `sendDisputeAlertEmail`. Disputes are resolved in the Stripe dashboard, not in-app, so email (not an in-app notification) is the deliberate channel. |
| `charge.dispute.closed` | Only acts when `status === "lost"` **and** the linked `Payment.payoutStatus === "transferred"` — i.e. the teacher was already paid out before the customer got their money back via chargeback. In that case it flips `payoutStatus` to `"failed"`, records `payoutError`, and notifies the teacher (`createNotification(..., "payout_reversed", ...)`). A won dispute, or a lost one before payout, is a no-op. |
| `transfer.reversed` | Looks up the `Payment` by `transferId` (not `intentId`). If found, marks `payoutStatus: "failed"` with an explanatory `payoutError`, logs, and notifies the teacher. Exists specifically because `app/lib/payouts.ts`'s `transferPayoutForClass` only catches *synchronous* errors from `stripe.transfers.create` — a transfer that succeeded and was marked `"transferred"` can still be reversed later (e.g. the connected account gets restricted, or a later deduction exceeds its balance) with no other code path catching that. |
| `account.updated` | Connect account status sync. Looks up the `User` by `stripeConnectAccountId`, derives `ConnectStatus` from three booleans (`charges_enabled && payouts_enabled && details_submitted` → `active`; `details_submitted` alone → `restricted`; otherwise → `pending`), and persists all four `connect*` fields + `connectUpdatedAt`. **If the new status is `active`, it also sweeps `transferPendingPayoutsForTeacher(user.id)`** (`app/lib/payouts.ts`) — any completed-class payouts that accrued as `pending` while the teacher hadn't finished onboarding get paid out immediately on this transition. |
| `account.application.deauthorized` | Fires when a teacher disconnects the platform's Stripe access (or Stripe revokes it). Reads the connected account id off `event.account` (Connect-scoped events aren't tied to a lookup-able object the way others are). Clears `stripeConnectAccountId` to `null` (not just the status) — deliberately, so the teacher's *next* onboarding attempt creates a fresh Express account rather than `startConnectOnboarding` trying to reuse an account the platform no longer has access to — resets all `connect*` flags, logs, and notifies the teacher. |
| default | No-op. |

Every branch returns `200 { received: true }` (even the log-only ones) — Stripe will retry on non-2xx, and none of these failure modes are something a retry would fix.

## How it fits together

- **Two distinct secrets** because Stripe requires separate webhook destinations for "Events from: Your account" vs. "Events from: Connected accounts" — `account.updated` and `account.application.deauthorized` are Connect-scoped and arrive signed with the Connect destination's secret, not the platform one.
- Reads from/writes to: `prisma.payment`, `prisma.user`. Calls out to `createPaymentForClass` (`app/lib/actions/paymets.actions.ts`), `transferPendingPayoutsForTeacher` (`app/lib/payouts.ts`), `createNotification` (`app/lib/notifications.ts`), and `sendDisputeAlertEmail`/`sendPaymentIssueAlertEmail` (`app/lib/email.ts`).
- Local testing: `start-stripe.bat` runs `stripe listen -f localhost:3000/api/webhooks/stripe` — point local dev here rather than inventing another way to trigger events; remember the CLI mints its own signing secret at each `listen` invocation, separate from whatever's configured in the Stripe dashboard.

## Non-obvious conventions / gotchas

- This handler now covers substantially more than "mark a class paid" — it's also the sync point for the entire Stripe Connect payout lifecycle (account status, disputes clawing back payouts, reversed transfers). Any change to Connect account fields on `User` (`connectStatus`, `connectChargesEnabled`, etc.) should be cross-checked against this file, since it's the primary writer of those fields outside of `ensureConnectAccount`/`payouts.actions.ts`.
- The comment referencing "plan.md Phase 11B" flags that these console.error-based manual-review paths are meant to eventually route to real error monitoring — currently they rely on `console.error` plus an admin email actually being read.
- `payment_intent.succeeded`'s idempotency check is by `intentId`, and `transfer.reversed`'s lookup is by `transferId` — two different unique-ish keys on the same `Payment` model; don't confuse them when adding new handlers that need to find a `Payment` from a Stripe object.
