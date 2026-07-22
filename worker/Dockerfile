# syntax=docker/dockerfile:1
# Production image for the standalone `worker` service. MUST be built with
# the repo root as build context (not worker/), because this worker
# deliberately has no @prisma/client dependency of its own — at runtime it
# resolves the already-generated client from the root project's
# node_modules via upward Node module resolution (worker/node_modules ->
# ../node_modules). See worker/package.json's description for the rationale.
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Root install: this is what actually provides @prisma/client at runtime.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY prisma ./prisma
RUN pnpm prisma generate
# worker/tsconfig.json maps `@/*` to the repo root (see its `baseUrl: ".."`),
# and the worker imports shared logic straight out of app/lib/** (e.g.
# notifications, gamification) rather than duplicating it — so the image
# needs the whole app/ tree, not just prisma/.
COPY app ./app

# Worker's own (much smaller) dependency set, installed from its own lockfile.
COPY worker/package.json worker/pnpm-lock.yaml ./worker/
RUN pnpm --dir worker install --frozen-lockfile

COPY worker/src ./worker/src
COPY worker/tsconfig.json ./worker/tsconfig.json

ENV NODE_ENV=production
WORKDIR /app/worker
EXPOSE 8081
CMD ["pnpm", "start"]
