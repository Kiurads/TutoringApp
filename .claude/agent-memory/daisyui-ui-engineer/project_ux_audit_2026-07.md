---
name: project_ux_audit_2026-07
description: Findings from a read-only cross-app UX/UI audit conducted 2026-07-24 (one of five parallel domain audits)
metadata:
  type: project
---

A full read-only UX/UI/interaction audit of eStudyou was done on 2026-07-24 (part of a 5-domain parallel audit). Findings were reported back to the orchestrating agent, not saved as a file in-repo.

**Why:** requested ahead of Phase 10 ("polish") work per plan.md — team is scoping what polish covers before starting it.

**How to apply:** if asked to pick up Phase 10 polish work, these are confirmed-real gaps as of this date (re-verify before acting, code moves fast):
- No timezone field/handling anywhere (schema, `app/lib/actions/classes.actions.ts`, `weekly-schedule.tsx`) — all dates rendered in server-local time. Biggest functional risk for cross-timezone student/teacher pairs.
- `app/ui/footer.tsx` is still dead code — confirmed zero imports anywhere in `app/`.
- No `loading.tsx` exists anywhere in the app (only `error.tsx` boundaries at root/admin/student/teacher). Confirmed absent, not just undiscovered.
- Admin tables (`app/main/admin/students/page.tsx`, `app/main/admin/payments/page.tsx`) have no client-side search, unlike `app/ui/main/teachers/teachers-table.tsx` which does (`useState` + `.filter()` pattern) — easy win to make consistent.
- Teacher discovery (`app/ui/main/teachers/teacher-browser.tsx`) only filters by subject chips — no name search, no price/rating sort. Real gap for a marketplace at scale.
- `NotificationDropdown` (`app/ui/main/notifications/notification-dropdown.tsx`) has correct read-state handling and optimistic UI, but never polls/refreshes — new notifications only appear after a navigation.
- No in-app messaging/chat/inquiry feature exists at all between students and teachers pre-booking.
- Toasts (`app/ui/main/classes/toast-notification.tsx`) are only wired into class/regular-class/refund-request pages; everything else uses inline `alert-error` or nothing — confirms the inconsistent-feedback-pattern issue was real, not assumed.
- Dark-mode persistence is actually solid: `app/layout.tsx` has a blocking inline script reading `localStorage` before paint to set `data-theme`, so the historical "hardcoded light theme" concern does NOT currently apply — don't flag this again without re-checking.
