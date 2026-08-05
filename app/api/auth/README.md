# app/api/auth

Two unrelated API routes that happen to share the `/api/auth` prefix.

- **`[...nextauth]/route.ts`** — the NextAuth catch-all handler: `export { GET, POST } from "@/auth"`. Handles every `/api/auth/*` NextAuth-internal endpoint (session, csrf, callback, signin/signout POSTs, etc.) via the handlers exported from the root `auth.ts`. There's nothing else to document — all real logic lives in `auth.ts`/`auth.config.ts` at the repo root.
- **`verify/route.ts`** — email verification link handler. Has real logic; see `app/api/auth/verify/README.md` for details.

Note the routing order: Next.js matches the more specific static segment (`verify`) before the catch-all (`[...nextauth]`), so `/api/auth/verify` never gets swallowed by the NextAuth handler despite living under the same parent path.
