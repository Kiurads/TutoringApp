# app/reset-password

Route: `/reset-password?token=...`. `page.tsx` is a server component that reads the `token` query param and either renders `ResetPasswordForm` (`app/ui/login/reset-password-form.tsx`, passed `token` as a prop) or, if `token` is missing/empty, an inline "Invalid reset link" card with a link back to `/forgot-password` — this is the page's only real branch of logic. The form itself wraps `resetPassword` from `app/lib/auth/reset-password.ts`, which re-validates the token server-side regardless of what this page assumed.
