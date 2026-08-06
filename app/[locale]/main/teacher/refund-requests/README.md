# app/main/teacher/refund-requests

The teacher-facing side of the no-show/refund dispute flow: a list page and a per-request detail/action page.

## `page.tsx` — list

Auth-gated, fetches `fetchRefundRequestsForTeacher()` (`app/lib/actions/refund-requests.actions.ts` — note this call also lazily expires any overdue `pending` requests before returning, per that file's dual-invocation expiry pattern). Renders a plain table (student, subject, session date, amount, status, submitted date, a "Review" link into the detail page) with its own local `STATUS_BADGE`/`STATUS_LABEL` maps covering all six `RefundRequestStatus` values — a presentation-layer duplicate of the status vocabulary also mapped independently in `no-show-report-section.tsx`'s `STATUS_CONFIG` (student side) and again in the admin page below; there is no shared status-label component across these three call sites. Reads `?toast=accepted`/`?toast=refused` into inline alert banners (not the shared `ToastNotification` component — these are hand-rolled `role="alert"` divs directly in the page).

## `[id]/page.tsx` — detail / action page

Fetches `fetchRefundRequestByIdForTeacher(id)` (also lazily expires on read). Shows session details, the student's written report (`whitespace-pre-wrap` to preserve the student's line breaks), a countdown ("You have N days to respond") computed from `expiresAt` when `status === "pending"`, any existing `adminNote` (visible here too, not just to the student — an admin's resolution note is shown to both sides), and renders `RefundRequestActions` (`app/ui/main/refund-requests/refund-request-actions.tsx`) with `role="teacher"` only when `isPending` — once the teacher has acted (or it's expired/escalated/resolved), the action component simply isn't rendered at all, so there's no "you already responded" confirmation state, just an absence of the action panel.

## Gotchas

- The `STATUS_BADGE`/`STATUS_LABEL` maps here, in `admin/refund-requests/page.tsx`, and in `no-show-report-section.tsx`'s `STATUS_CONFIG` are three independent copies of the same status vocabulary with slightly different color choices per status in places (e.g. `admin_review` is `badge-info` here but `badge-error` on the admin page, reflecting each audience's different urgency framing) — don't assume updating one keeps the others in sync.
