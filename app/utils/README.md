# app/utils

A single small helper for building consistent JSON API responses.

## Key files

- **`build-response.ts`** — `buildResponse(message, status)`, a one-line wrapper around `NextResponse.json({ message }, { status })`. Standardizes the `{ message: string }` shape for route handler error/success responses instead of every route hand-rolling `NextResponse.json(...)` with slightly different shapes.

## How it fits together

Intended for use inside `app/api/**` route handlers. Note this is distinct from the top-level `/utils` directory at the repo root (`get-avatar.ts`, `decimal-to-time.ts`, `status.ts`) — that one holds general-purpose helpers used across both UI and server code, while `app/utils` is scoped specifically to API response shaping.

## Gotcha

`buildResponse` currently has **zero imports anywhere in the codebase** — every route handler under `app/api/**` builds its `NextResponse.json(...)` calls inline instead. This looks like dead code left over from an earlier convention; nothing currently depends on it.
