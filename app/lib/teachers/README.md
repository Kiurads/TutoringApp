# app/lib/teachers

Pure, server/client-agnostic helper logic for ranking and ordering teachers in the student-facing "Find a Teacher" flow. Nothing here touches Prisma directly — both files take already-fetched data and return derived values, which is what makes them easy to unit test (see `sort-teachers.test.ts`) and safe to import from either a Server Component or a `"use client"` component.

## Files

- **`fit-score.ts`** — `computeFitScore(teacher, completedClasses)`: a rule-based (no AI/ML) 0–100 relevance score for how well a teacher matches a *specific student's* history. Returns `null` when the student has no completed classes yet, since a score would be meaningless (and the UI/callers treat `null` as "don't show a fit badge" rather than "0% match"). Scoring is additive out of 100: +30 subject overlap, +20 teacher rating ≥ 4.5, +20 availability-day overlap with the days the student has historically studied, +30 if the student has already completed a class with this exact teacher. This is a *personalized ranking signal*, computed server-side per request in `app/main/student/teachers/page.tsx` against `fetchStudentClassHistory`.
- **`sort-teachers.ts`** — `sortTeachers(teachers, sortBy)`: a client-side, non-personalized re-sort of an already-rendered teacher list by `price-asc` / `price-desc` / `rating-desc` / `name-asc`, plus a `"default"` no-op that preserves whatever order it was given. Exports `SortOption` and `SORT_LABELS` (the `<select>` dropdown copy) alongside the function. Used by `TeacherBrowser` (`app/ui/main/teachers/teacher-browser.tsx`) to let the student re-order the grid interactively without a server round-trip.
- **`sort-teachers.test.ts`** — Vitest coverage for all four sort options, the unrated-teacher edge case, and a non-mutation check (`sortTeachers` always returns a new array via `[...teachers]`, never sorts in place).

## How fit-score and sort-teachers relate (and differ)

They are **not** alternative implementations of the same concept — they compose. `fit-score.ts` runs once server-side per page load and *personalizes* the list (attaches a `fitScore` field per teacher, then the page does an initial sort: fit score desc → online first → name). `sort-teachers.ts` then runs client-side on top of that already-scored, already-ordered array whenever the student picks a different sort from the dropdown — and picking any option other than `"default"` throws away the fit-score ordering in favor of the chosen field. `"default"` is the only option that preserves the server's fit-score-driven order.

Note the two files intentionally disagree on how to treat an unrated teacher's `"No Reviews"` string:
- `fit-score.ts` treats `"No Reviews"` as *disqualifying* for the rating bonus (`teacher.rating !== "No Reviews" && parseFloat(rating) >= 4.5` — an unrated teacher simply doesn't get the +20).
- `sort-teachers.ts`'s `ratingValue()` treats `"No Reviews"` (and anything else `parseFloat` can't parse) as `-1`, so unrated teachers sort to the *bottom* of `rating-desc` rather than crashing on `NaN` comparisons or sorting unpredictably.

Both approaches are correct for their own purpose (score contribution vs. total ordering) — don't try to unify them into one "rating as number" helper without preserving both behaviors.

## Gotchas

- `computeFitScore`'s day-overlap check works off `Date.getDay()` (0=Sun..6=Sat) applied to `completedClasses[].startTime`, matched against `teacher.availabilityDays` — both need to already be plain `number[]` by the time they reach this function; there's no timezone normalization here, so the caller's data shape matters.
- `TeacherExtended` (imported from `@/app/lib/types/teachers.types`) is the shared contract between both files — `fitScore` is optional/nullable on that type specifically because `fit-score.ts` can return `null`.
- `sortTeachers` is a pure function with no server action / `"use server"` directive, unlike most of the surrounding gamification code — it's meant to run in the browser on every dropdown change, so keep it cheap and side-effect-free.
