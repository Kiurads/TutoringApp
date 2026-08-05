# .do

DigitalOcean App Platform deployment spec.

## Key files

- **`app.yaml`** — the full App Platform spec, applied with `doctl apps create --spec .do/app.yaml`. Defines:
  - A `web` service (autoscaled, `basic-xs`, built from the root `Dockerfile`) running the Next.js app, with a health check hitting `/api/health` (20s initial delay, 30s period).
  - A `worker` service (built from `worker/Dockerfile`, `basic-xxs`) running the standalone background-job process from `worker/`. **`instance_count` is pinned to `1` and must never be raised** — see `worker/README.md` for why (it's a polling loop with no distributed lock; two instances would double-process jobs).
  - A `databases` block referencing a **pre-existing** `estudyou-mysql` cluster by `cluster_name` (created out-of-band via `doctl databases create`) rather than provisioning one inline — production databases on App Platform must point at an existing cluster. `DATABASE_URL` is injected automatically via `${estudyou-db.DATABASE_URL}` binding syntax, which also gives the app automatic trust of DO's database CA for free, rather than the URL being hand-copied into a secret.
  - `envs` blocks on both services listing required secrets (`AUTH_SECRET`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`) — this file intentionally carries **no secret values**; those are filled in through the DO dashboard after `doctl apps create`. See `.env.example` at the repo root for what each one is for.

## Gotcha — migrations are a manual step

App Platform does not automatically run Prisma migrations on deploy. There's no `migrate deploy` build/release command wired into `app.yaml`. In practice this means a schema-touching PR requires manually applying its migration(s) against the production database right after merging — deploying the new code without also applying the migration will leave the app running against a stale schema. See `prisma/README.md` and `prisma/migrations/README.md` for the migration workflow itself.

## How it fits together

`deploy_on_push: true` on both services means pushing to `master` (the configured `github.branch`) triggers a redeploy automatically — there's no separate CD pipeline step. `.woodpecker.yml` at the repo root (CI, not deployment) is a separate concern from this file.
