# `app/main/teacher/payouts`

Teacher-facing Stripe Connect payouts page — the page that owns onboarding status display, the onboarding CTA, and a payout history table. Single file: `page.tsx`.

## `page.tsx`

Server component. Auth-gates, then fetches `getConnectStatus()` and `fetchPaymentsByTeacherId(session.user.email)` (both `app/lib/actions/paymets.actions.ts` / `payouts.actions.ts`) in parallel alongside `searchParams`. Redirects to `/main/teacher/dashboard` if `getConnectStatus()` returns an error shape (non-teacher role, or not authenticated — defense in depth given the page-level auth check already ran).

**Handles Stripe's Account Link `refresh_url` contract inline**: if the teacher lands back here with `?refresh=true` and their status still isn't `active`, the page itself calls `startConnectOnboarding()` again and redirects to the fresh link — per the code comment, this matches Stripe's documented contract for `refresh_url` (silently mint a new link and send them right back in, rather than making them click "Continue onboarding" again). A separate `?return=true` param (the `return_url` destination) just shows an informational "we're still checking your account status" alert if `connectStatus` isn't yet `active` — Connect status itself updates asynchronously via the `account.updated` webhook, so this page doesn't poll or force a fresh Stripe lookup on return.

Renders:
- A status banner: green "Payouts are active" alert if `connectStatus === "active"`, otherwise a card with `<ConnectOnboardingButton>` (`app/ui/main/payouts/connect-onboarding-button.tsx`) whose label depends on `status.hasAccount` (new vs. resume).
- A payout history table built directly in this file (not reusing `payments-table.tsx` from `app/ui/main/payments/` — that component is admin-only/all-payments; this is a simpler teacher-scoped table with its own inline `PAYOUT_STATUS_BADGE`/`PAYOUT_STATUS_LABEL` maps, duplicated from `payments-table.tsx` rather than shared).

## How it fits together

- Status data (`connectStatus`, `connectChargesEnabled`, etc.) is written by the `account.updated` and `account.application.deauthorized` Stripe webhook handlers (`app/api/webhooks/stripe/route.ts`) — this page only reads it, never writes it directly.
- Onboarding itself is delegated entirely to `<ConnectOnboardingButton>` / `startConnectOnboarding()` (`app/lib/actions/payouts.actions.ts`), which creates the Express account (if needed, via `ensureConnectAccount` in `app/lib/payouts.ts`) and mints a fresh Account Link.
- Each payout row links (via `payment.id`) toward the receipt at `/main/teacher/payments/[id]/receipt`.

## Non-obvious conventions / gotchas

- `PAYOUT_STATUS_BADGE`/`PAYOUT_STATUS_LABEL` are copy-pasted here and in `app/ui/main/payments/payments-table.tsx` — a third place to update if the `payoutStatus` values or labels ever change (see that directory's README for the same note from the other side).
- Account Links are single-use and short-lived (per `startConnectOnboarding`'s own comment) — this page's `refresh=true` handling is the reason that constraint doesn't strand teachers on an expired link.
