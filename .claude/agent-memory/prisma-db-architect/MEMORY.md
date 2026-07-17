# Agent Memory Index

## Project
- [Worker prisma generate gotcha](./worker_prisma_generate_gotcha.md) — never run `prisma generate` from inside `worker/`, it corrupts the root's shared client via pnpm's content-addressable store
