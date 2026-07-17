---
name: worker-prisma-generate-gotcha
description: Never run `prisma generate` from within worker/ — it corrupts the root project's shared Prisma client via pnpm's content-addressable store
metadata:
  type: project
---

Running `prisma generate --schema ../prisma/schema.prisma` from inside `worker/` (a nested project with its own `package.json`, sharing the root's `node_modules` for `@prisma/client`) broke the ROOT project's Prisma client — `pnpm test` at the root started failing with `PrismaClientInitializationError: @prisma/client did not initialize yet`.

**Why:** pnpm's content-addressable store deduplicates identical dependency installations into one physical location on disk (`node_modules/.pnpm/@prisma+client@<version>_prisma@<version>_typescript@<version>/...`), symlinked into every consuming project. `worker/`'s own `pnpm install` + a `postinstall` script calling `prisma generate` resolved to the *same* store path the root project uses (since the version/peer-dep hash matched), and generating a second time into it left the client in a broken/partial state — this is the literal same file on disk, not an isolated copy, even though `worker/` has its own `package.json`.

**How to apply:** The `worker/` project (built for the class-completion + recurring-class-occurrence background jobs) deliberately does **not** declare `@prisma/client` or `prisma` as its own dependency at all, and has no `postinstall`/generate step. It relies purely on Node's upward `node_modules` resolution finding the root project's already-generated client (confirmed working: `tsx` and `tsc` both resolve `@/prisma` → root's `prisma/index.ts` → root's `@prisma/client` correctly this way). If the client ever needs regenerating, always run `pnpm prisma generate` from the **repo root**, never from inside `worker/`. If you ever add a second nested project with its own `package.json` in this repo, apply the same rule — don't let it declare or generate its own `@prisma/client`.
