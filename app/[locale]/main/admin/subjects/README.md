# app/main/admin/subjects

Admin subject-management area: list page plus a trivial "create" child
route, folded into this single README since `create/page.tsx` is a
5-line wrapper with nothing else to document on its own.

## `page.tsx` — `/main/admin/subjects`

Server component (`SubjectsPage`). Fetches `fetchSubjects()` from
`@/app/lib/actions/subjects.actions` and renders a header (live count,
"N subjects available on the platform") with an "Add Subject" button
linking to `/main/admin/subjects/create`, plus a `card bg-base-200` table
of subject name + a `teacherCount` badge (already aggregated by the
action, not computed here). Empty state: centered `fa-book-open` icon with
"No subjects yet." and a second "Add the first subject" CTA.

## `create/page.tsx` — `/main/admin/subjects/create`

`"use client"` (the only reason it needs to be a client component is that
it's a thin wrapper — it doesn't itself use any client-only API, but
marking it lets it sit in the same tree without issue; the actual
interactivity lives entirely in the child). Renders a page title and
`CreateSubjectForm` from `@/app/ui/subject/subject-create-form.tsx` (see
that directory's README for the form's `useActionState` details) inside a
`max-w-md mx-auto` wrapper. No other logic — all validation/persistence is
in the form component and its bound server action.
