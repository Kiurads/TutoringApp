# syntax=docker/dockerfile:1
# Production image for the `web` (Next.js) service. Built from the repo root
# so it can see prisma/ alongside package.json/pnpm-lock.yaml.
FROM node:20-alpine AS base
# Prisma's query engine needs OpenSSL on musl-based Alpine images.
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm prisma generate
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time by
# webpack's static replacement of process.env.NEXT_PUBLIC_*, so they must
# reach this `docker build` step specifically — not just `docker run`.
# DigitalOcean App Platform passes RUN_AND_BUILD_TIME/BUILD_TIME env vars to
# `docker build` as --build-arg; without a matching ARG here, Docker
# silently drops any build-arg with no matching declaration, so
# process.env.NEXT_PUBLIC_* would compile to `undefined` even though the
# value is correctly set on the app (this broke the Stripe Elements
# checkout in production: the publishable key baked into the bundle was
# undefined, so stripe.js never initialized and the pay button stayed
# permanently disabled).
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
# Reuse the builder's node_modules as-is rather than reinstalling
# production-only deps: pnpm writes the generated Prisma client into a
# version-hashed path inside its content-addressable store
# (node_modules/.pnpm/@prisma+client@.../node_modules/.prisma), not a
# predictable top-level node_modules/.prisma, so there's nothing stable to
# selectively re-copy. Ships devDependencies too — a size tradeoff, not a
# correctness one, at this app's scale.
COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["pnpm", "start"]
