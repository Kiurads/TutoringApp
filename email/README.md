# email

A single unused React Email component template, kept from early scaffolding.

## Key files

- **`email-template.tsx`** — a `React.FC<{ firstName: string }>` rendering a bare `<h1>Welcome, {firstName}!</h1>`. This is the stock boilerplate component generated when adding the [Resend](https://resend.com) SDK to a Next.js project (via `npx create-email` / the Resend quickstart), meant to be passed as the `react:` option to `resend.emails.send()` so Resend can render it to HTML server-side.

## Gotcha — not wired up, and duplicated

This component is **not used anywhere**. Actual transactional email in this app is sent from `app/lib/email.ts`, which builds emails as raw HTML template strings (`sendVerificationEmail`, `sendPasswordResetEmail`, `sendDisputeAlertEmail`, `sendPaymentIssueAlertEmail`) rather than via a React Email component — `app/lib/email.ts`'s own header comment notes Resend was a dependency long before anything actually called it, and when something finally did, it didn't reach for this file.

There is also an **identical byte-for-byte copy** of this same file at `app/email/email-template.tsx` (see that directory's README). Neither copy is imported by anything. If email templates are ever migrated to React Email components, this is presumably where that would start — but as of now, treat both copies as inert scaffolding, not a documented feature to build on top of without first confirming it's still what's wanted.
