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
