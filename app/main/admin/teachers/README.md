# app/main/admin/teachers

Admin-only teacher account management: list, create, and delete. Gated by `middleware.ts`'s `authorized()` callback (role must be `admin` to reach anything under `/main/admin/*`), but note `create/page.tsx`'s form action re-checks the role itself anyway (see below) — middleware protects the *route*, not the server action.

## `page.tsx` (route: `/main/admin/teachers`)

Lists all teachers via `fetchTeachersExtended()` (`app/lib/actions/teachers.actions.ts`) and renders `TeachersTable` (`app/ui/main/teachers/teachers-table.tsx` — see that directory's own README for UI details). Also renders `ToastNotification` driven by a `toast` query param, used by the create/delete flows below to report success back to this page after they redirect here.

## `create/page.tsx` (route: `/main/admin/teachers/create`)

**This is the trigger point for real teacher account provisioning.** Fetches the subject list via `fetchSubjects()` and renders `RegisterTeacherForm` (`app/ui/register/teacher/register-teacher-form.tsx`), which submits to `registerTeacher()` in `app/lib/auth/register-teacher.ts` — see that file's own documentation for exactly what happens on submit (validation, `User` row creation with `role: "teacher"`, bulk `TeacherSubject` assignment, best-effort verification email). This is the **only** way a teacher account gets created in this app; there is no self-service teacher signup (`/register/teacher` is an informational dead-end pointing back here — see `app/register/README.md`).

Worth knowing if you're touching either side of this: `registerTeacher()` independently checks `auth()` and `role === "admin"` inside the action itself, not just relying on this page living under the admin route tree — so calling it from anywhere else (or via a crafted request) still fails closed.

## `[id]/delete/page.tsx` (route: `/main/admin/teachers/[id]/delete`)

Client-component confirmation page reached from a "Delete" link in `TeachersTable`. Fetches the target teacher's details client-side via `fetchTeacherById(id)` (loading/error states handled locally with `useState`/`useEffect`), shows "Are you sure you want to delete **{name}**?", and renders `DeleteTeacherButton` (`app/ui/main/teachers/delete-button.tsx`), which calls `deleteTeacherById` (`app/lib/actions/teachers/delete-teacher.ts`) on confirm. That action deletes `TeacherSubject` and `TeacherRating` rows first (FK constraints), then the `User` row, then `revalidatePath("/main/admin/teachers")`.

**Note there is no `[id]/page.tsx`** — only the `delete/` child route exists under `[id]/`; there's no teacher detail/edit page at `/main/admin/teachers/[id]` itself.

## Gotcha

`deleteTeacherById` has **no `auth()`/role check inside the action itself** — it trusts that only this admin-only page tree ever calls it. That's the same standing gap the codebase has elsewhere for row-scoped mutations (server actions relying solely on the page/middleware having gated access, rather than re-checking "am I allowed to touch *this* row" inside the action) — `registerTeacher()` above is the counter-example that *does* check. If you touch `delete-teacher.ts` for another reason, consider adding the `auth()` check while you're in there.
