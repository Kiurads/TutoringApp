# types

Ambient TypeScript declaration files (`.d.ts`) that augment third-party module types. Nothing here is imported directly — these are picked up automatically by `tsconfig.json`'s `include` and merged into the global type-checking context.

## Key files

- **`next-auth.d.ts`** — Module augmentation for `next-auth`, extending `User`, `Session.user`, and the JWT (`next-auth/jwt`) with this app's custom fields:
  - `role` — the app's role string (`student` / `teacher` / `admin`), not part of stock NextAuth.
  - `teacherPreferencesSet` — onboarding-completion flag.
  - `passwordChangedAt` (on `User`) / `passwordChangedAt` as epoch ms (on the `JWT`) — used together for **session staleness detection**: `auth.ts` compares the JWT's snapshot of `passwordChangedAt` against the live DB value on each request. A mismatch (e.g. the user changed their password, or an admin forced a reset) means the token predates that change.
  - `invalidated` (JWT only) — set once that mismatch is detected; `auth.config.ts`'s `session` callback checks this flag and refuses to present a user even though the JWT's own signature/expiry are still valid. This is how the app revokes an already-issued, cryptographically-valid session without a server-side session store.
- **`daisyui.d.ts`** — A one-line `declare module "daisyui"` stub. daisyUI ships as a Tailwind CSS plugin, not a typed JS/TS package, so without this stub any `import` of `"daisyui"` (e.g. in `tailwind.config.ts`) would fail TypeScript's module resolution. This silences that with an untyped (`any`) module declaration.

## How it fits together

`next-auth.d.ts` is the single source of truth for what extra fields flow through the NextAuth session/JWT — if you add a new field to the session (e.g. a new onboarding flag), it has to be declared here or `session.user.yourField` won't type-check anywhere in the app. See `app/lib/auth/session-staleness.ts` and `auth.config.ts` for where the `passwordChangedAt`/`invalidated` fields are actually consumed.
