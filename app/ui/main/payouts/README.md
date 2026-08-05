# `app/ui/main/payouts`

Single-component directory for the Stripe Connect onboarding call-to-action shown to teachers.

## Files

- **`connect-onboarding-button.tsx`** — `"use client"` button that calls `startConnectOnboarding()` (`app/lib/actions/payouts.actions.ts`) inside a `useTransition`. On success, does a **hard navigation** (`window.location.href = result.url`), not `router.push` — the comment in the code explicitly notes this is deliberate: the destination is a Stripe-hosted external URL (an Account Link), not an internal route, so a Next.js client-side transition would be wrong here. Shows an inline `alert-error` on failure and a spinner while pending. Takes a single `label` prop — the caller decides the button text (e.g. "Set up payouts" vs. "Continue onboarding" depending on whether the teacher already has a connected account).

## How it fits together

- **Sole consumer**: `app/main/teacher/payouts/page.tsx`, which decides the `label` based on `status.hasAccount` and only renders this button when `connectStatus !== "active"`.
- `startConnectOnboarding()` itself (in `app/lib/actions/payouts.actions.ts`, not this directory) is presumably what calls `ensureConnectAccount()` (`app/lib/payouts.ts`) to lazily create the Stripe Express account shell if one doesn't exist yet, then generates a fresh Account Link. This component has no knowledge of that — it just redirects wherever the server action tells it to.
- The teacher lands back on `/main/teacher/payouts` after Stripe-hosted onboarding, with `?return=true` or `?refresh=true` query params that the payouts page itself interprets (a `refresh=true` return means the Account Link expired mid-flow, and the page silently re-mints a new one and redirects again — see that page's own comment on Stripe's documented `refresh_url` contract).
- Account status changes (`connectStatus` becoming `active`, `restricted`, etc.) are pushed by the `account.updated` Stripe webhook (`app/api/webhooks/stripe/route.ts`), not polled by this button — this component only *starts* onboarding, it never checks or displays status itself.

## Non-obvious conventions / gotchas

- This is intentionally a dumb/generic button — no Connect-specific UI branching lives here (status badges, "why do I need this" copy, etc. all live in the page). If Connect UI grows, consider whether new pieces belong here or stay page-local; there's no established pattern yet since this directory has exactly one file.
