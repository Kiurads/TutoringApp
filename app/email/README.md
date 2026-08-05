# app/email

Contains `email-template.tsx`, an unused React Email component — a byte-for-byte duplicate of the top-level `/email/email-template.tsx` directory at the repo root. See that directory's README for the full explanation (it's the stock Resend/React-Email quickstart boilerplate, not wired into `app/lib/email.ts`'s actual send functions, which build raw HTML strings instead).

It's unclear why this file exists in two places (`/email/` and `/app/email/`) with identical content — most likely a leftover from moving/copying scaffolding during setup rather than an intentional split. Neither copy is imported anywhere in the codebase.
