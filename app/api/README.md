# app/api/

Route-handler layer — everything here is a `route.ts` exporting HTTP method handlers (`GET`/`POST`/etc.), as opposed to the Server Actions used throughout `app/lib/actions/**` for most other server-side work. Subdirectories:

```
app/api/
├── auth/            NextAuth catch-all route + email verification — auth-rbac-engineer
├── payment-intent/  Stripe PaymentIntents, incl. payment-intent/pre-auth — stripe-payments-engineer
├── setup-intent/    Stripe SetupIntents — stripe-payments-engineer
├── webhooks/stripe/  Stripe webhook handler — stripe-payments-engineer
├── health/          DO health-check endpoint — documented below
└── revalidate/       on-demand ISR revalidation — documented below
```

`auth/`, `payment-intent/`, `setup-intent/`, and `webhooks/` each have their own README written by the owning specialist agent (`auth-rbac-engineer` for auth, `stripe-payments-engineer` for the other three) — not duplicated here.

## `health/route.ts`

Liveness/readiness probe. This is exactly the endpoint `.do/app.yaml` points its DigitalOcean App Platform `health_check.http_path` at (`/api/health`, `initial_delay_seconds: 20`, `period_seconds: 30`) for the `web` service — if this starts failing, DO will consider the web service unhealthy.

`GET` runs `prisma.$queryRaw\`SELECT 1\`` and returns `{ status: "ok" }` (200) on success or `{ status: "error", message }` (503) on failure. Deliberately checks actual DB connectivity rather than just "the process responds" — a health check that only confirmed the Next.js process was up wouldn't catch a broken `DATABASE_URL` after a deploy, which is exactly the kind of failure a health check exists to catch.

## `revalidate/route.ts`

`POST` handler that reads `{ path }` from the JSON body and calls `revalidatePath(path)` — this is on-demand ISR/cache revalidation, letting some external trigger force Next.js to regenerate a cached page.

Two things worth flagging here (not fixed, per this pass's read-only scope):

- **No auth/secret check whatsoever.** The handler does not verify any token, header, or shared secret before calling `revalidatePath` with a caller-supplied path — anyone who can reach this endpoint can trigger revalidation of any path they name. The usual pattern for this kind of endpoint is a bearer-token or secret query-param check before acting.
- **No callers found anywhere in the repo.** A repo-wide grep for `api/revalidate` (including href strings, fetch calls, and imports) turned up nothing outside the route file itself — nothing in this codebase currently calls it. It may be intended for an external trigger (e.g. a CMS webhook, a manual curl from an admin) that doesn't live in this repo, or it may simply be unused/leftover. Worth confirming with whoever added it before assuming it's load-bearing.

## Route handlers vs. Server Actions

Most mutations/reads elsewhere in the app go through `"use server"` Server Actions in `app/lib/actions/**`, called directly from Server/Client Components. `app/api/**` is reserved for the cases that specifically need an HTTP endpoint: webhook receivers (Stripe needs a real URL to POST to), the OAuth/credentials machinery NextAuth itself expects at a conventional path, and infra-facing endpoints like `health` that a hosting platform polls over plain HTTP rather than through React.
