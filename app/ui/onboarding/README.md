# app/ui/onboarding

Single-component directory: the guided product tour shown to new users
right after they finish (or skip) the preferences form.

## `welcome-tour-modal.tsx`

`"use client"`. Renders `null` itself — all its UI comes from
[`driver.js`](https://driverjs.com) (`driver`/`DriveStep` from the
`driver.js` package, plus its stylesheet `driver.js/dist/driver.css`
imported directly in this file), which spotlights DOM elements by
`data-tour="..."` attribute and shows a popover next to each. This is the
one place in the reviewed UI tree that renders tour/spotlight chrome
outside of Font Awesome + daisyUI — driver.js supplies its own button/
overlay styling, not daisyUI classes.

- **Sequencing context** (per the file's own comments): by the time this
  runs, onboarding *preferences* are already handled — teachers are forced
  through `/main/teacher/onboarding` first (enforced in `auth.config.ts`),
  students are routed there first too via the `?tour=1` handoff from
  `app/main/student/dashboard/page.tsx`. So every step's copy describes
  actual app mechanics, not generic feature marketing, and nothing in the
  tour links back to the preferences form.
- **Role-branching content**: `buildSteps(role, firstName)` returns a
  different, much longer step list per role — it walks every item in that
  role's sidebar top-to-bottom (dashboard → classes → recurring classes →
  calendar → subjects/availability → teachers/students → store/payouts →
  refund-requests → profile → preferences → a final "Weekly Quests" step
  targeting `[data-tour="weekly-quests-widget"]`), each with a one-line
  explanation. If a nav item is added to `StudentSidebar.tsx` or
  `TeacherSidebar.tsx`, this is the file to update in parallel — it has no
  mechanism for staying in sync automatically, and a missing
  `data-tour="..."` target on the sidebar will just cause driver.js to
  skip/misplace that step.
- **Dismissal behavior differs by role**: `allowClose: role === "student"`
  — students can bail out early (X button, overlay click, Escape);
  teachers cannot, the tour is mandatory and the only way through is the
  "Done" button on the final step. Both paths funnel into the same
  `finish()` (calls the `completeOnboardingTour` server action from
  `@/app/lib/actions/onboarding.actions`, then `router.refresh()`).
- **StrictMode-safe cleanup**: the effect's cleanup also calls
  `driverObj.destroy()`, which would normally re-fire `onDestroyed` (and
  thus double-call `finish()`/the server action) on React StrictMode's
  dev-mode double-invoke or a route-change unmount. An `isCleanupDestroy`
  flag set just before the effect's `return` is checked inside
  `onDestroyed` to swallow that case — don't remove this without
  double-checking dev-mode behavior, since it guards against silently
  double-firing the "mark onboarding complete" action.
