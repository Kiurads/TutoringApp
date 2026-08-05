# `app/main/student/payments`

Student-facing payments route. Contains exactly one page — a single-payment receipt view — and **no list/index page**: there is no `app/main/student/payments/page.tsx`. If you're looking for "where does a student see all their past payments," it isn't here; check the student dashboard for any embedded payment history instead (this directory only has the receipt drill-down).

## `[id]/receipt/page.tsx`

Server component. Auth-gates (`redirect("/login")` if no session), then calls `fetchPaymentReceipt(id, session.user.email)` (`app/lib/actions/paymets.actions.ts`) and `notFound()`s if it returns `null` — which happens both for a genuinely missing payment id **and** for a payment that exists but doesn't belong to this viewer (the function is viewer-scoped and deliberately returns `null` rather than throwing/403ing for the mismatch case, so both look identical from here — a student can't distinguish "wrong id" from "someone else's receipt" by response shape).

Renders `<Receipt receipt={receipt} />` and `<PrintButton />` (both from `app/ui/main/payments/`), plus a back link to `/main/student/dashboard`. The header row (back link + print button) is wrapped in `print:hidden` so only the receipt itself appears when the student prints/saves as PDF.

## How it fits together

- Reached from wherever a student's payment history is surfaced (dashboard/class detail) linking to `/main/student/payments/[id]/receipt`.
- Mirrors `app/main/teacher/payments/[id]/receipt/page.tsx` almost exactly — same `fetchPaymentReceipt` call, same `<Receipt>`/`<PrintButton>` composition — the only differences are the back-link destination (`/main/student/dashboard` here vs. `/main/teacher/earnings` there) and which side of the `student`/`teacher` email match in `fetchPaymentReceipt` resolves this viewer.
