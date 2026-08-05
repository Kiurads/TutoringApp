# app/main/admin/students

Admin student-management page: `/main/admin/students`.

## `page.tsx`

Server component (`StudentsPage`). Unusually thin: queries Prisma
**directly in the page file** via a local `getStudents()` helper
(`prisma.user.findMany({ where: { role: "student" }, ... })`) rather than
going through an `app/lib/actions/*` action — most other admin/teacher
pages reviewed in this pass (teacher earnings, teacher students) delegate
their fetch to a named action in `app/lib/actions/`. If this page's query
needs to grow more complex (filters, joins), consider whether it should be
promoted to a proper action file for consistency, though nothing here is
currently broken by the shortcut.

Selects only what the table needs: id, firstName, lastName, email,
avatarOptions, createdAt, and a `_count.classesAsStudent` relation count
(no N+1 — Prisma resolves the count in the same query). Renders a header
with a live count ("N registered students") and hands the full array
straight to `StudentsTable` (`app/ui/main/students/students-table.tsx`,
see that directory's README) as `initialStudents` — all search/filtering
happens client-side inside that table component, not here.
