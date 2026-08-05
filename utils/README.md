# utils

Small, framework-agnostic pure-function helpers used from both server and client code. Distinct from `app/utils/` (a single API-response-shaping helper scoped to route handlers) — this directory holds general-purpose utilities with no Next.js dependency.

## Key files

- **`get-avatar.ts`** — `getAvatar(email, optionsJson?)` returns a generated "toon-head" avatar as a data URI, computed entirely locally (no network request, no external avatar service). It delegates the actual generation to `buildAvatarDataUri`/`parseAvatarOptions` in `app/lib/avatar-utils.ts`; this file is just the thin public entry point. `email` is used as the deterministic seed so the same user always gets the same default avatar, and `optionsJson` is the raw `User.avatarOptions` JSON string (may be `null` for users who haven't customized anything).
- **`decimal-to-time.ts`** — `decimalToHours(decimal)` / `decimalStringToHours(decimalString)` format a decimal-hours duration (e.g. `1.5`) into a zero-padded `"01H30M"` string. Used for displaying class durations, which are stored as decimal hours. The string variant throws on non-numeric input rather than silently coercing to `NaN`.
- **`status.ts`** — A small `Status` class (`{ success: boolean; message: string }`) with `Status.success(message?)` / `Status.error(message)` static constructors, presumably intended as a uniform return shape for actions/operations.

## Gotchas

- **`status.ts`'s `Status` class currently has zero imports anywhere in the app** — it looks like dead code from an earlier convention that was superseded by the plain-string / `useActionState` error-return pattern actually used throughout `app/lib/actions/**` today. Don't assume it's wired into any live code path.
- `decimal-to-time.ts` has no `.ts` extension issue but note the *string* variant (`decimalStringToHours`) exists specifically because Prisma's `Decimal` fields often arrive at client components already stringified — check call sites before assuming a raw `number` is available.
