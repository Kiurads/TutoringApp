# app/ui/main/students

Single-component directory holding the admin student roster table.

## `students-table.tsx`

`"use client"`. Renders a searchable table of all students, given the full
dataset up front via an `initialStudents` prop (fetched server-side by
`app/main/admin/students/page.tsx`). Search is a local `useState<string>`
filtered client-side with `.filter()` over the full array — matching name
(first + last, concatenated) or email, case-insensitively. This follows
the repo-wide convention of client-side search over a fully-fetched dataset
rather than server-side pagination/search; if the student list grows large
enough to need real pagination, that's a deliberate scope increase, not
something already half-built here.

Each row shows an avatar (via `getAvatar` from `@/utils/get-avatar`,
`unoptimized` `next/image`), name, email, a `classesAsStudent` count badge
(from a Prisma `_count` relation, passed straight through from the page's
query — no client-side aggregation), and a joined date formatted
`en-GB`-style (day month year).

Distinct from `teachers-table.tsx` / `classes-table.tsx` (documented
elsewhere) only in the columns shown — same overall daisyUI `table` +
`card bg-base-200` shell and the same "empty state" / "no search results"
two-message pattern (`"No students registered yet."` vs `"No students
match your search."`).
