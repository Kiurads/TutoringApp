# app/main/

Pure route-grouping folder — it has no files of its own (no `layout.tsx`, `page.tsx`, etc. at this level), only three subdirectories. It exists purely to namespace the three role-based experiences under a common `/main/` URL prefix, which is also what `middleware.ts`'s route matcher (`/main/:path*`) uses as a single pattern to gate all logged-in-only routes at once (auth/redirect specifics are owned by `auth-rbac-engineer`).

The three-way split:

- **`app/main/student/`** — the student-facing app (dashboard, classes, calendar, teachers, gem store, profile, onboarding). See `app/main/student/README.md`.
- **`app/main/teacher/`** — the teacher-facing app (dashboard, classes, availability, earnings, payouts, students, profile, onboarding). See `app/main/teacher/README.md`. Mirrors the student subtree's layout/sidebar convention exactly.
- **`app/main/admin/`** — the admin panel (teachers/students/subjects/classes/payments/refund-requests management, settings). See `app/main/admin/README.md`. Diverges from the student/teacher convention in a couple of notable ways — see that README.

Each subtree is otherwise independent: separate `layout.tsx`, separate sidebar, separate `error.tsx`/`loading.tsx`. There's no shared layout or component between them at the `app/main/` level itself.
