# `app/main/teacher/payments`

Teacher-facing payments route. Like its student counterpart, contains exactly one page — a single-payment receipt view — and **no list/index page** (no `app/main/teacher/payments/page.tsx`). Teacher payment/payout history as a list lives in `app/main/teacher/payouts/page.tsx` instead (which shows payout amounts and status, not full receipts); this directory is only the per-receipt drill-down.

## `[id]/receipt/page.tsx`

Server component, structurally identical to the student version: auth-gates, calls `fetchPaymentReceipt(id, session.user.email)` (`app/lib/actions/paymets.actions.ts`, viewer-scoped — returns `null` for both a missing payment and a payment that isn't this teacher's, treated identically as `notFound()`), and renders `<Receipt receipt={receipt} />` + `<PrintButton />` from `app/ui/main/payments/`, with the header row `print:hidden`.

Only difference from the student page: the back link goes to `/main/teacher/earnings` instead of `/main/student/dashboard`.

## How it fits together

- Reached from `/main/teacher/payouts` or `/main/teacher/earnings` linking to a specific payment's receipt.
- Same `Receipt`/`PrintButton` components as the student version — see `app/ui/main/payments/README.md` for the print-stylesheet convention (`print:hidden` on page chrome, `print:*` overrides inside `Receipt` itself).
- The receipt shown here includes the platform fee and teacher payout breakdown (`platformFeeAmount`, `teacherPayoutAmount`) — i.e. a teacher can see exactly what was deducted as commission on a given class, not just the gross amount.
