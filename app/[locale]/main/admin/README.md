# app/main/admin/

The admin panel, mounted under `/main/admin/**`. Superficially similar to `app/main/student/` and `app/main/teacher/` (a `layout.tsx` + `error.tsx` + `loading.tsx` triplet wrapping a drawer-based sidebar), but structured differently in a few ways worth knowing before assuming parity.

## How this diverges from the student/teacher convention

See `app/main/student/README.md` for the full explanation of the pattern this is *based on*. Key differences here:

- **No `_components/` subdirectory.** Unlike student and teacher, the sidebar nav is not extracted into its own component — it's inlined directly inside `layout.tsx` (the `navItems` array and the whole drawer/`<aside>` JSX live in the same file as the layout function). This is a convention inconsistency worth knowing about, not necessarily a bug: it means admin's nav-item list, active-link logic, etc. can't be reused or found the way `StudentSidebar`/`TeacherSidebar` can, and a future edit to align the pattern would mean extracting an `AdminSidebar` component the way the other two roles already have one.
- **`layout.tsx` is a client component** (`"use client"`), and gets the current user via the client-side `useSession()` hook from `next-auth/react` — not the server-side `auth()` call that both `StudentLayout` and `TeacherLayout` use. Practical effect: admin's layout can't do server-side data fetching (notifications, avatar, etc.) the way student/teacher layouts do — there is no notification dropdown or avatar footer in the admin sidebar, just the logged-in email pulled from the session hook. Whether this is deliberate (admin doesn't need those) or just an earlier/simpler implementation that was never upgraded isn't obvious from the code alone.
- Nav items here don't carry `dataTour` attributes (no onboarding-tour hooks for admin, unlike student/teacher).
- **`error.tsx`** and **`loading.tsx`** follow the exact same pattern as student/teacher (`loading.tsx` renders `<PageSkeleton />`; `error.tsx` is a client boundary linking back to `/main/admin/dashboard`) — no divergence there.

## Nav sections (inlined in `layout.tsx`)

Dashboard, Teachers, Students, Classes, Payments, Subjects, Refund Requests, Settings — flat list, no sectioning/grouping unlike the student/teacher sidebars' Overview/Learning/Account-style headings.

## Feature directories documented elsewhere

These have their own, separately-authored READMEs (other specialist agents) — not duplicated here:

- `app/main/admin/dashboard/`
- `app/main/admin/settings/`
- `app/main/admin/students/`
- `app/main/admin/subjects/`
- `app/main/admin/classes/`
- `app/main/admin/payments/`
- `app/main/admin/teachers/`
- `app/main/admin/refund-requests/`
