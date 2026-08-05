# app/ui/login

Client-side forms for the login and password-recovery flows. All three are thin: they hold no validation logic themselves (that lives server-side in `app/lib/auth/*`) and just wire a `useActionState` hook to a server action, rendering whatever error/status string the action returns.

## Files

- **`login-form.tsx`** — `LoginForm`, used by `app/login/page.tsx`. `useActionState(authenticate, undefined)` where `authenticate` is `app/lib/auth/authenticate.ts`. The one piece of real logic here: `authenticate()` deliberately does *not* redirect on success (see that file's README for why), so this component tracks pending→success transitions itself with a `wasPending` ref + `useEffect`, and on success does `window.location.href = "/"` — a full page navigation, not `router.push`, specifically so the fresh session cookie is carried through `middleware.ts` instead of Next's client router serving a stale cached logged-out render.
- **`forgot-password-form.tsx`** — `ForgotPasswordForm`, used by `app/forgot-password/page.tsx`. Wraps `requestPasswordReset` (`app/lib/auth/request-password-reset.ts`). Displays whatever message the action returns as an `alert-info` banner — that action always returns the same generic "if an account exists..." message regardless of outcome, by design, so this form has no success/failure branching to do.
- **`reset-password-form.tsx`** — `ResetPasswordForm`, used by `app/reset-password/page.tsx`, which passes it the `token` query param as a prop. Wraps `resetPassword` (`app/lib/auth/reset-password.ts`); the token is carried through as a hidden input (`<input type="hidden" name="token" value={token} />`) rather than re-read from the URL inside the action.

## Conventions confirmed here

- **No Zod** — matches the repo-wide convention. All three forms rely entirely on native HTML validation (`required`, `type="email"`) client-side and the server action for anything real.
- **Icons are inline SVG, not Font Awesome.** Despite Font Awesome (via CDN `<Script>`) being the icon system used elsewhere in the app (e.g. `app/main/admin/teachers/[id]/delete/page.tsx` uses `<i className="fa-solid ...">`), all three forms here hand-roll their alert icons as raw inline `<svg>` paths. If you touch these forms, match the existing inline-SVG pattern rather than introducing an FA `<i>` tag — or flag the inconsistency if you're doing a broader icon cleanup.
- All three use daisyUI `form-control` / `input input-bordered validator` / `alert` classes consistently.
