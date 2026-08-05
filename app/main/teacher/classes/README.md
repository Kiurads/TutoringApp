# app/main/teacher/classes

The teacher-facing routes for the class-lifecycle domain: list page (with the open-broadcast-requests panel), detail page, and the teacher-initiated booking form.

## `page.tsx` — `/main/teacher/classes`

Auth-gated. Fetches `fetchBookedClassesByUser(email)` **and** `fetchOpenRequestsForTeacher(email)` in parallel, rendering `OpenRequests` (the claimable broadcast-request panel, priority-ordered — see `app/ui/main/classes`'s README) above `BookedClasses` (`teacher-booked-classes.tsx`). This is the one list page in the whole domain that combines two structurally different data sources (a teacher's own booked classes vs. unclaimed broadcast requests matching their subjects) into a single view.

## `[id]/page.tsx` — a single class's detail page

Structurally parallel to the student version (`app/main/student/classes/[id]/page.tsx`) but teacher-specific in what it computes and renders:
- Adds **`canCounterOffer`** (`status === "requested" && !requestedBySelf`) — this is the only detail page in the app that passes `canCounterOffer`/`counterOfferTime` into `ClassActionModals`, meaning **"Suggest Alternative Time" is only ever surfaced to a teacher in this UI**, even though the underlying server action (`proposeCounterOffer`) has no role restriction beyond "is a participant and not the requester" — a student who is the non-requesting participant (i.e. a teacher-initiated request the student didn't create) could theoretically call it too, but no student-facing page currently exposes that control. Worth knowing if you're asked to add counter-offer support to the student side — the server already supports it, only the UI doesn't surface it there.
- Adds **`canComplete`** (`status === "scheduled"` and the session's end time has passed) and renders `CompleteClassButton` when true — this is the manual "mark as complete" trigger described in `app/lib/actions/classes.actions.ts`'s `completeClass`. The student-side detail page has no equivalent button; only a teacher (or admin viewing as this page) can manually complete a class from the UI, though the background worker (`worker/src/complete-classes.ts`) will eventually complete it regardless if nobody does.
- Does **not** render `NoShowReportSection` or `LeaveReviewForm` — those are student-only surfaces (a teacher isn't the one filing a no-show report against themself, and doesn't review themself).

## `request/page.tsx`

Renders `RequestClassForm` (`app/ui/main/classes/create/teacher/create-class-form.tsx`) with optional `startTime`/`duration` query-param pre-fill (from the calendar's drag-to-schedule deep link) — no teacher pre-fetch step the way the student version has, since this form is the teacher requesting a class *with* a student, there's no "specific teacher" concept to pre-select here.

## Gotchas

- The counter-offer/complete asymmetry between the student and teacher detail pages (above) is a UI-layer decision, not a server-side restriction — don't assume the corresponding server actions are teacher-only just because only this page exposes their buttons.
