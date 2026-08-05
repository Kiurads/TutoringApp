# app/main/teacher/earnings

Teacher earnings dashboard: `/main/teacher/earnings`. Pairs directly with
the Chart.js widgets documented in `app/ui/main/earnings/README.md`
(`MonthlyEarningsChart`, `StudentBreakdownChart`) — this page is their only
current consumer.

## `page.tsx`

Server component (`TeacherEarningsPage`). Guards with `auth()` +
`redirect("/login")`, then fetches `fetchPaymentsByTeacherId(userEmail)`
from `@/app/lib/actions/paymets.actions` (note the source file's own
typo — "paymets" not "payments" — that's the real import path, not a typo
introduced here).

**Decimal-to-number conversion happens on this page, not in the action or
the chart components**: `payments` come back with `payment.amount` still
as a Prisma `Decimal` (used directly in the table via
`payment.amount.toNumber().toFixed(2)`), while a separate
`paymentsForCharts` array is derived via `.map()` specifically to hand the
chart components plain numbers (`p.teacherPayoutAmount`, already a plain
number per the action's return shape) — so the Decimal boundary crossing
for the *table* happens inline in JSX (`.toNumber()`), while the *charts*
get pre-shaped data. Keep this asymmetry in mind if adding a new
Decimal-bearing field to either the table or the charts.

**"Earnings" means net payout, not gross**: the code comment is explicit —
`paymentsForCharts` and the `totalEarnings` stat use
`payment.teacherPayoutAmount` (net of platform commission), while a
separate `totalPlatformFee` stat sums `payment.platformFeeAmount`
independently and is only surfaced as a `stat-desc` caption under "Total
Earned," not its own stat tile. Don't swap in `payment.amount` (gross) for
these without checking which figure a given UI spot is supposed to show.

Layout: three `stats shadow bg-base-200` tiles (Total Earned, This Month,
Students — the "This Month" figure is computed client-render-time from
`now.getMonth()`/`now.getFullYear()`, not a separate query), then the two
charts side-by-side (`lg:col-span-2` bar chart + doughnut chart, only
rendered when `payments.length > 0`), then a full payment-history table
with columns for student, amount received (with gross paid as a caption),
payout status (badge, `PAYOUT_STATUS_BADGE`/`_LABEL` maps covering
`transferred`/`pending`/`failed`/`not_applicable`), date, a truncated
transaction ID, and a link to `/main/teacher/payments/[id]/receipt`.

A `Link` to `/main/teacher/payouts` (Stripe Connect payout setup, owned
elsewhere) sits in the page header.
