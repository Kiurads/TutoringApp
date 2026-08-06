# app/forgot-password

Route: `/forgot-password`. Thin client-component page (`page.tsx`) that renders `ForgotPasswordForm` (`app/ui/login/forgot-password-form.tsx`) inside the standard daisyUI `hero`/`card` auth-page shell used across `/login`, `/register`, `/reset-password`, etc. No logic of its own — the form wraps `requestPasswordReset` from `app/lib/auth/request-password-reset.ts`. Linked from `LoginForm`'s "Forgot password?" link.
