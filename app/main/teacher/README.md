# app/main/teacher/

The teacher-facing app, mounted under `/main/teacher/**`. Mirrors `app/main/student/`'s layout/sidebar/error/loading convention exactly — see **`app/main/student/README.md`** for the full explanation of how that pattern works (server `layout.tsx` fetching shared chrome data → client sidebar in `_components/` → scoped `error.tsx` → scoped `loading.tsx`, including what the `_components` leading-underscore "private folder" convention means). This README only covers what's teacher-specific.

## What differs from the student subtree

- **`layout.tsx`** fetches one extra piece of state the student layout doesn't need: `getTeacherOnlineStatus(userEmail)`, run in the same `Promise.all` as notifications and user data, and passed to the sidebar as `initialIsOnline`.
- **`_components/TeacherSidebar.tsx`** has everything `StudentSidebar` has (drawer, nav sections, notification dropdown, avatar footer), plus an online/offline toggle button above the nav (`toggleTeacherOnline` server action, called from a client `useTransition` so the UI updates optimistically-ish while the request is in flight). Nav sections are Overview / Teaching / People & Money / Account — the "People & Money" section (Students, Earnings, Payouts, Refund Requests) has no equivalent on the student side.
- **`error.tsx`** and **`loading.tsx`** are otherwise line-for-line the same pattern as the student versions, just pointing links back at `/main/teacher/dashboard` instead.

Notable: this entire `app/main/teacher/` subtree did not exist on `master` — it was built out entirely on a feature branch (per project memory). Worth double-checking parity with the student side if something looks half-finished.

## Trivial leaf routes (single `page.tsx`, no README of their own)

- **`dashboard/`** — teacher home page. Redirects to `/login` if unauthenticated. Shows a `WelcomeTourModal` for first-timers (no onboarding-redirect gate like the student dashboard has — teacher onboarding is not forced before reaching the dashboard). Composes `UpcomingClasses`, `TeacherEarnings`, `NextUpCard`, `MentorMilestonesWidget`, `WeeklyQuestsWidget`.
- **`onboarding/`** — client-side multi-step preference wizard (teaching style, etc.), same `updateProfile` mechanism as the student version, different question set (`TEACHING_STYLES` vs `LEARNING_STYLES`).
- **`profile/`** — profile editing, password change, avatar customization, badge showcase, subject selection (`TeacherSubjectsForm` — teachers pick which subjects they teach here, students don't have an equivalent), and rank/progress display (`calcRank`/`getRankProgress` — teachers have "ranks", students have "tiers", both from `app/lib/gamification-utils.ts`).

## Feature directories documented elsewhere

These have their own, separately-authored READMEs (other specialist agents) — not duplicated here:

- `app/main/teacher/classes/`
- `app/main/teacher/regular-classes/`
- `app/main/teacher/calendar/`
- `app/main/teacher/availability/`
- `app/main/teacher/payments/`
- `app/main/teacher/payouts/`
- `app/main/teacher/students/`
- `app/main/teacher/earnings/`
- `app/main/teacher/refund-requests/`
