# app/main/admin/settings

Admin settings page: `/main/admin/settings`.

## `page.tsx`

Server component (`SettingsPage`), no data fetching at all. Two cards:

1. An **"Environment" status card** showing three rows (Stripe
   Integration / Database / Authentication) each with a hardcoded
   `badge-success badge-sm` "Active"/"Connected" badge. **These are static
   JSX, not derived from any live health check** — the page does not ping
   Stripe, run a DB query, or check the auth provider; it always renders
   green. If this is ever mistaken for a real status dashboard, that's
   worth flagging — as written it's decorative copy, not monitoring. An
   `alert-info` banner above it clarifies that real platform settings
   (Stripe keys, email credentials, DB config) are managed via environment
   variables and require a system administrator, not this UI.
2. A **change-password card** that simply renders `ChangePasswordForm`
   from `@/app/ui/main/users/change-password-form.tsx` (see that
   directory's README) — i.e. the admin's own account settings, reusing
   the exact same component students/teachers use for themselves. There is
   no admin-specific settings logic beyond this and the static status
   card.

Whole page is capped at `max-w-lg` and has no client-side state of its own
— all interactivity is inside the embedded `ChangePasswordForm`.
