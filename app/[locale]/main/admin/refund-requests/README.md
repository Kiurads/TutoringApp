# app/main/admin/refund-requests

The admin-facing side of the no-show/refund dispute flow — a single page, no `[id]` detail subroute of its own.

## `page.tsx`

Auth-gated, fetches `fetchRefundRequestsForAdmin()` (`app/lib/actions/refund-requests.actions.ts` — every request in the system, no per-admin filtering). Splits the results into two groups client-side-in-the-Server-Component (`needsReview` = `status === "admin_review"`, `others` = everything else) and renders them very differently:
- **`needsReview`** — rendered as expanded cards (not a table row), each showing the student→teacher pair, session details, the full no-show reason text, and `RefundRequestActions` with `role="admin"` inline — this is the actionable queue, front and center.
- **`others`** — a compact read-only reference table (student, teacher, subject, date, amount, status, submitted date, a "view" link) covering every non-escalated request (pending/accepted/refused/expired/resolved) purely for visibility/audit, no actions.
- Own `STATUS_BADGE`/`STATUS_LABEL` maps (third independent copy of the status vocabulary in this domain — see `app/main/teacher/refund-requests`'s README for the other two), with `admin_review` colored `badge-error` here (vs. `badge-info` on the teacher list) reflecting the "this needs you" urgency framing specific to the admin audience.

## Gotchas — a likely bug worth flagging

The **"view" link in the `others` table points at `/main/teacher/refund-requests/${r.id}`** — the teacher-only detail route, not an admin-specific one (there is no `app/main/admin/refund-requests/[id]/page.tsx` in this directory). `fetchRefundRequestByIdForTeacher` (the fetcher behind that route) explicitly checks `req.teacherId !== user.id` and returns `null` otherwise — so an admin clicking this link to view a request that isn't their own (which, for an admin, is every request, since admins don't have refund requests filed against them as a teacher) will land on that page's "Request not found" state instead of an actual detail view. This looks like a copy-paste artifact from the teacher page rather than an intentional admin-viewing-as-teacher affordance. Flagging only, per instructions not fixing it here — worth a fix (either a real `app/main/admin/refund-requests/[id]/page.tsx` backed by a new admin-scoped fetcher, or simply removing the dead link) the next time this area is touched.
