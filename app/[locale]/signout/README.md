# app/signout

Route: `/signout` — the `signOut` page configured in `auth.config.ts`. `page.tsx` is a trivial wrapper rendering `SignOutForm` (`app/ui/signout/signout-form.tsx`) in the standard auth-page shell. All the actual sign-out logic lives in that component — see `app/ui/signout/README.md`.
