# app/main/teacher/students

Teacher-facing student roster page: `/main/teacher/students`.

## `page.tsx`

Server component (`TeacherStudentsPage`). Guards with `auth()` +
`redirect("/login")` if there's no session email, then fetches
`fetchStudentsByTeacher()` from `@/app/lib/actions/students.actions` — the
data-shaping/query lives in that action, not here.

Renders a responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) of
`card bg-base-200` tiles, one per student the teacher has taught or has
scheduled classes with. Each card shows:

- The student's avatar via `getAvatar` from `@/utils/get-avatar`, wrapped
  in a `size-16 rounded-full overflow-hidden` div that also carries a
  **frame class** — `getFrameClass(student.activeFrame)` from
  `@/app/lib/frame-utils` — so a student's purchased gem-store avatar
  frame renders here too, not just on their own dashboard. If
  `student.email` is falsy, falls back to a plain initials avatar
  (`bg-neutral text-neutral-content` circle with first-name/last-name
  initials) instead of attempting `getAvatar` with an empty seed — worth
  knowing if a student record with no email ever reaches this page.
- A frame label/color line (`getFrameLabel`/`getFrameColor`, also from
  `frame-utils`) with a small `fa-gem` icon, shown only when
  `activeFrame` is set.
- Name, email, and phone number (if present, with a `fa-phone` icon).

Empty state: a centered `fa-user-graduate` icon (muted) with "No students
yet" / explanatory subtext, shown when the fetched array is empty.

This page is the one place among the directories reviewed here that
directly renders the gamification frame system inline in a plain roster
list (rather than inside a dedicated dashboard widget) — if frame classes
or `frame-utils` exports change shape, this page's card markup needs to be
checked alongside the dashboard/profile card that also render frames.
