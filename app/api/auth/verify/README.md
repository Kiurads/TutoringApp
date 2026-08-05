# app/api/auth/verify

Email verification link handler — the landing target for the link sent by `createAndSendVerificationEmail()` (`app/lib/auth/verification.ts`) after a student or teacher registers.

## `route.ts`

`GET /api/auth/verify?token=...`:

1. No `token` query param → redirect to `/login?verify=missing-token`.
2. Looks up the token via `prisma.verificationToken.findFirst({ where: { token, purpose: "EMAIL_VERIFICATION" } })` — `findFirst`, not `findUnique`, because `token` alone isn't `@unique` in the schema (only the `[identifier, token]` pair is). Scoping by `purpose` is what prevents a password-reset token (same table, see `app/lib/auth/reset-password.ts`) from ever verifying an email — covered explicitly by a test case.
3. No match → redirect to `/login?verify=invalid-token`.
4. **Deletes the token immediately, before checking expiry** — a used or expired token must never be redeemable twice, regardless of outcome. The delete is wrapped in `.catch(() => {})` to tolerate a concurrent request already having consumed it.
5. If expired → redirect to `/login?verify=expired-token`.
6. Otherwise sets `User.emailVerified = new Date()` for the token's `identifier` (email) and redirects to `/login?verify=success`. If the user was deleted since the token was issued, the update throws and the route redirects to `/login?verify=user-not-found` instead of erroring.

`app/login/page.tsx` reads the `verify` query param and maps each of these five outcomes to a banner message (`VERIFY_MESSAGES` in that file) — if you add a new redirect outcome here, add the matching copy there too.

`route.test.ts` covers all the above (missing token, valid token, wrong-`purpose` token, expired token) by mocking `@/prisma` directly.

## Gotcha

**This route does not gate login.** A user with `emailVerified: null` can still sign in normally — `verifyCredentials()` in `app/lib/auth/verify-credentials.ts` doesn't check this field at all. The route's own comment flags this explicitly: gating login on verification is called out as an intentional, not-yet-done follow-up (referenced there as "plan.md Phase 11A"). `User.emailVerified` is otherwise dead data today — nothing reads it besides this route writing to it.
