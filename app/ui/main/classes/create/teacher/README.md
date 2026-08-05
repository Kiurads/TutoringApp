# app/ui/main/classes/create/teacher

The teacher-side "book a class with a specific student" flow, backing `app/main/teacher/classes/request/page.tsx`. Much simpler than its student-side counterpart (`create/student/`) — a single-phase form with no payment/pre-auth step, since a teacher-initiated booking is paid by the student later through the normal accept → pay flow, not at request time.

## Key files

- **`create-class-form.tsx`** — a single `"use client"` form using `useActionState(createClassAsTeacher, undefined)` (`app/lib/classes/create-class-as-teacher.ts`) — the classic Next.js form-action pattern (unlike the student form, which drives its server calls manually via `useTransition`/`fetch` because it needs multi-phase branching logic the simpler `useActionState` pattern doesn't fit). Loads subjects (`fetchSubjectsWithTeachers`) and the full student list (`fetchStudents`, `app/lib/actions/students.actions.ts` — every student in the system, not filtered to ones this teacher has taught before) in a single `useEffect` on mount. Contains a leftover `console.log("Students received in component:", students)` — harmless but worth cleaning up if this file is touched again.
- **`subject-select.tsx`** — identical in shape to the student directory's version: a button-grid, hidden `name="subject"` input. A separate copy, not shared.
- **`start-time-input.tsx`** — same `datetime-local` input pattern as the student version, but without the `onChange` callback prop (this form doesn't need to mirror the value into other local state the way the student wizard does for its price estimate).
- **`duration-select.tsx`** — same quarter-hour duration list and formatting as the student version, again without the `onChange` callback.
- **`student-select.tsx`** — a plain HTML `<select>` (not a card list, unlike the student form's teacher picker) listing every student by name. No search/filter for a large student roster.
- **`add-class-button.tsx`** — links to `/main/teacher/classes/request`. This is the button actually rendered by `teacher-booked-classes.tsx` (imported from this `create/teacher` path specifically, not the top-level `app/ui/main/classes/add-class-button.tsx` which points at the student route instead) — the two `add-class-button.tsx` files across the codebase are separate, role-specific links, not a shared component.

## How it fits together

See `create/student`'s README for the fuller comparison. In short: both directories duplicate near-identical field components (`subject-select.tsx`, `duration-select.tsx`, `start-time-input.tsx`) rather than sharing them — a deliberate-looking parallel structure (student form needs richer client-side state/callbacks for its multi-phase wizard; teacher form doesn't), but it does mean any shared bug (e.g. the `datetime-local` min/defaultValue interaction) has to be fixed in both places.

## Gotchas

- No availability or scheduling-conflict check is surfaced in this form's UI before submit — `createClassAsTeacher` itself doesn't call `isWithinAvailability` or `teacherHasSchedulingConflict` either (see `app/lib/classes/README.md`), so a teacher can request a class at a time they're not actually free; there's no client- or server-side guard against it in this specific flow.
- `student-select.tsx` lists every student in the system with no pagination or search — could become unwieldy on a large user base.
