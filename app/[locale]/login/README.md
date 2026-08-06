# app/login

Route: `/login`. The app's sign-in page — also the `signIn` page configured in `auth.config.ts`, so it's where NextAuth's `authorized()` callback (`middleware.ts`) sends any unauthenticated request to a `/main/*` route.

`page.tsx` is a **server component** (not `"use client"`) so it can read `searchParams` directly without a `useSearchParams()`/`Suspense` dance, even though the actual form (`LoginForm` from `app/ui/login/login-form.tsx`) is a client component nested inside it. It reads three query params and renders a banner for each:

- `verify` — set by `app/api/auth/verify/route.ts` after an email-verification link is clicked (`success`, `missing-token`, `invalid-token`, `expired-token`, `user-not-found` — see `VERIFY_MESSAGES` in this file).
- `reset=success` — set by `app/lib/auth/reset-password.ts` after a successful password reset.
- `passwordChanged=true` — set after an in-app password change (`app/lib/auth/change-password.ts` stamps `passwordChangedAt`, which invalidates the current session — the caller is expected to append this param when redirecting back to login).

If you add a new redirect outcome anywhere that lands back on this page, add its message to `VERIFY_MESSAGES` (or a sibling map) here too.
