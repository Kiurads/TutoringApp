# app/main/student/teachers

Route directory for the student "Find a Teacher" flow: the browse/search list at `/main/student/teachers` and the individual teacher profile at `/main/student/teachers/[id]`. Both are async Server Components that fetch data and hand it to presentational/interactive components in `app/ui/main/teachers/` and `app/ui/main/badges/`.

## Files

- **`page.tsx`** (list) — Orchestrates the personalized teacher list:
  1. Fetches `fetchTeachersExtended()` (all teachers), the current session, and `searchParams` (an optional `?subject=` preselect) in parallel.
  2. If signed in, fetches `fetchStudentClassHistory(email)` — this student's completed-class history, the input `computeFitScore` needs (empty array if not signed in).
  3. Attaches a `fitScore` to every teacher via `computeFitScore` (`@/app/lib/teachers/fit-score`) — one call per teacher, all against the same shared `history` array.
  4. Does an **initial server-side sort**: fit score desc → online-first → name — before handing off to the client. This ordering is what `TeacherBrowser`'s `"default"`/"Recommended" sort option preserves; any other sort choice in the UI discards it.
  5. Derives the `subjects: string[]` filter-chip list from the fetched teachers themselves (`Array.from(new Set(scored.flatMap(t => t.subjects)))`), not a separate subject catalog query.
  6. Renders `<TeacherBrowser>` (`@/app/ui/main/teachers/teacher-browser`) with `hasHistory={history.length > 0}` — this flag is what gates whether fit-score UI (badges, "N matches found" summary text) shows at all, since a fit score is meaningless without history.

- **`[id]/page.tsx`** (detail/profile) — A single teacher's public profile. Fetches, in parallel: `fetchUserById`, `fetchRatingById`, `fetchReviewsById`, `fetchSubjectsByTeacherId`, `fetchAvailability`, `fetchAllBadges`, `fetchEarnedBadges(id)`. Renders, top to bottom: back link, `UserDetailsHeader` (shared user-details component, not teacher-specific), a subjects + "Book a class" CTA card linking to `/main/student/classes/request?teacher={id}`, `TeacherAvailabilityView`, a "Seals & Achievements" card (only if `earnedBadges.length > 0`) using `BadgeShowcase` in **compact mode**, and a reviews grid (`RatingCard` per review, or an empty state).

  Badge filtering here is manual and easy to miss: `allBadges` is filtered to `category === "milestone" | "expertise" | "pedagogy"` before being passed to `BadgeShowcase` — this excludes `engagement` (e.g. `feedback_champion`, `streak_7`, `streak_30`) and `subject` categories from ever appearing on a teacher's public profile, even if a teacher happens to hold one. If a new badge category is added that *should* show here, this filter needs a manual update — `BadgeShowcase` itself doesn't know or enforce which categories are "teacher-appropriate."

## How it fits together

`page.tsx` → `TeacherBrowser` → `TeacherCard` (all in `app/ui/main/teachers/`) is the full list-to-card pipeline; see that directory's README for the client-side filter/sort layer. `[id]/page.tsx` is a separate, unrelated data-fetch (it does not reuse anything from `fetch TeachersExtended` or fit-score) — clicking a `TeacherCard` just navigates here by ID; no state or score is carried over from the list view. `BadgeShowcase` (`app/ui/main/badges/`) is the only shared component between this directory and the badges system.

## Gotchas

- Fit score is computed **fresh on every list-page load**, once per teacher, in a simple `.map()` — there's no caching or memoization; with a large teacher roster this is O(teachers × history length) per request via the day/subject `Set` lookups inside `computeFitScore`, which is fine at current scale but worth knowing if the teacher pool grows significantly.
- The list page silently defaults `history` to `[]` when there's no session (rather than redirecting) — meaning `/main/student/teachers` is viewable (with fit scoring disabled, `hasHistory=false`) even in a state where you'd expect an auth gate; if the route is meant to require login, that's not enforced at this layer.
- `initialSubject` is validated against the derived `subjects` list (`subject && subjects.includes(subject) ? subject : null`) before being passed down — an arbitrary/stale `?subject=` query param silently falls back to "All" rather than erroring or showing an empty filtered set.
