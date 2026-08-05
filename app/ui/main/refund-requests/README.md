# app/ui/main/refund-requests

A single component covering both the teacher and admin sides of resolving a no-show/refund dispute (the student-side submission UI lives instead in `app/ui/main/classes/no-show-report-section.tsx`, since that's shown inline on the class detail page rather than in a dedicated refund-requests area).

## Key file

- **`refund-request-actions.tsx`** — `RefundRequestActions`, role-parameterized (`role: "teacher" | "admin"`) similarly to `class-action-modals.tsx`/`regular-class-action-modals.tsx`, though implemented with an inline confirm step (`confirmAction` state) rather than a `<dialog>` — clicking an action button swaps the button row for a "Yes, confirm / Cancel" pair in place, rather than opening a modal.
  - **Teacher view**: "Accept & Refund" (calls `acceptRefundRequest`) or "Refuse" (calls `refuseRefundRequest`), both from `refund-requests.actions.ts`. Framed to the teacher as "did you attend this session?" — accepting issues an immediate refund, refusing leaves the door open for the student to escalate.
  - **Admin view**: only reachable for requests already in `admin_review` (an escalated, teacher-refused request). Includes an optional `adminNote` textarea (persisted via `adminResolveRefundRequest`'s `adminNote` param and later shown to both sides — see `no-show-report-section.tsx`'s rendering of `refundRequest.adminNote`). "Force Refund" / "Dismiss" map to `adminResolveRefundRequest(requestId, "refund" | "dismiss", adminNote)`.
  - Both roles share the same `run()` dispatcher and error-surfacing (`error` state shown as an alert, and confirm state is reset back to `null` on error so the user can retry rather than being stuck on a failed confirm).

## How it fits together

This component only ever renders for requests already in an actionable state (`pending` for teachers, `admin_review` for admins) — the calling page is responsible for that gating (fetching via `fetchRefundRequestsForTeacher`/`fetchRefundRequestsForAdmin` in `refund-requests.actions.ts`, which already filter/expire appropriately). The full status vocabulary and its cross-role visualization (including the states this component doesn't itself render for, like `expired` or `resolved`) lives in `no-show-report-section.tsx`'s `STATUS_CONFIG` map on the student side — the two files together cover the full lifecycle's UI, split by which side of the dispute is looking at it.

## Gotchas

- There's no dedicated admin- or teacher-side status-history view analogous to the student's `STATUS_CONFIG` alert — once a teacher/admin has acted, the page presumably just stops rendering this component (re-fetches into a non-actionable state) rather than showing a "you already resolved this" confirmation state inline.
