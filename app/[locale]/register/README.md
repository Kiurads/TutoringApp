# app/register, app/register/student, app/register/teacher

Registration routes. Covers all three directories together since they're one asymmetric flow — see `app/lib/auth/README.md` for why student self-registration and teacher registration are fundamentally different (self-service vs admin-provisioned).

## `page.tsx` (route: `/register`)

A thin `redirect("/register/student")` (as of 2026-08-05). **If you've read older docs/context claiming this file rendered `RegisterStudentForm` directly and was "byte-identical to `app/register/student/page.tsx`"** — that description was itself stale/inaccurate even before this fix: the actual prior content was a leftover, unstyled `<form>` named `SignIn` (copy-paste debris, not a real registration form, not byte-identical to anything), confirmed via a SEO audit that flagged it as duplicate-content-plus-visually-broken. Re-verify against the file before assuming otherwise. Fixed by replacing it with a redirect rather than reconciling it with the real form, since there was never a good reason for two URLs serving the same student-registration intent.

## `student/page.tsx` (route: `/register/student`)

Same as above — renders `RegisterStudentForm`. This is the actual, working, self-service student signup entry point, backed by `registerStudent()` in `app/lib/auth/register-student.ts`.

## `teacher/page.tsx` (route: `/register/teacher`)

**Not a form.** This is an informational dead-end: "Teacher accounts are created by administrators. If you are a teacher and need an account, please contact your administrator," with buttons to `/login` and `/register/student`. There is no self-service teacher signup in this app — the real (and only) teacher-creation path is admin-only, at `/main/admin/teachers/create` (see `app/main/admin/teachers/README.md`), backed by `registerTeacher()` in `app/lib/auth/register-teacher.ts`.

**If you've read older docs/context claiming this page "historically posted to a nonexistent `/api/auth/register-teacher` route"** — that's not the current state. As read today, this page renders no form at all and makes no request anywhere; it's a static redirect-to-admin notice. Re-verify against the file before assuming otherwise.

Note `RegisterTeacherForm` (`app/ui/register/teacher/register-teacher-form.tsx`) still exists and is very much live — it's just mounted from `/main/admin/teachers/create/page.tsx`, not from anywhere under `app/register/`.
