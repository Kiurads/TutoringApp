# `app/main/admin/payments`

Admin-only view over every payment in the system. Single file: `page.tsx`.

## `page.tsx`

Server component with no auth check of its own in this file — relies on route-level protection (middleware/layout under `app/main/admin/**`) rather than an inline `auth()`/role check like the student/teacher payment pages have. If you're auditing auth coverage, verify the admin-area layout actually enforces `role === "admin"` before trusting this page is protected; it doesn't defend itself.

Fetches **every** `Payment` row via `prisma.payment.findMany` (no pagination, no filters — `orderBy: { createdAt: "desc" }` only) with student/teacher names and subject name selected. Computes three aggregate stats client-side-in-the-server-component from the full result set: gross volume (`sum(amount)`), platform revenue (`sum(platformFeeAmount)`), and teacher payouts (`sum(teacherPayoutAmount ?? amount)` — falls back to the gross amount if `teacherPayoutAmount` is null, which the comment implies can happen for older/incomplete payment rows).

**Decimal-to-number conversion happens here, explicitly, with a comment explaining why**: "Prisma Decimal instances don't survive the server→client props boundary (their methods are stripped during serialization) — convert to plain numbers before handing off to the client PaymentsTable." This is the canonical example of that pattern in the payments code — if adding a new server→client payments prop, follow the same explicit `.toNumber()` conversion rather than assuming the boundary handles it.

Renders three `stats` cards (gross volume, platform revenue, teacher payouts) followed by `<PaymentsTable initialPayments={payments} />` (`app/ui/main/payments/payments-table.tsx`).

## How it fits together

- Sole consumer of `payments-table.tsx` in the whole app — the student/teacher-scoped payment views (`app/main/student/payments`, `app/main/teacher/payments`, `app/main/teacher/payouts`) each use different, narrower components/queries instead of this table.
- Since there's no pagination, this page's query cost grows unbounded with total payment volume — worth flagging if the payments table ever gets large; nothing here limits the `findMany` result set.

## Non-obvious conventions / gotchas

- No search/filter/date-range on the server side — `payments-table.tsx`'s search box filters the already-fetched, already-rendered `initialPayments` array client-side only. All payments are downloaded to the client on every page load.
- "Teacher payouts" stat card total mixes `teacherPayoutAmount` (post-commission) with a raw `amount` fallback for rows missing it — worth double-checking against `computeCommissionSplit` (`app/lib/payouts-utils.ts`) if these numbers ever look inconsistent with the commission rate elsewhere.
