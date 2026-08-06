# app/main/student/regular-classes

The student-facing routes for the `RegularClass` (recurring series) domain.

## `page.tsx` — `/main/student/regular-classes`

Auth-gated list page. Fetches `fetchRegularClassesByStudent(email)` (`app/lib/actions/regular-classes.actions.ts`) and renders `RegularClassesTable` (`app/ui/main/regular-classes/regular-classes-table.tsx`) with `role="student"`, plus the shared `ToastNotification` for post-action banners (`?toast=created`/`accepted`/`refused`/`cancelled`, matching the redirect targets in `regular-classes.actions.ts`).

## `request/page.tsx`

Renders `RequestRegularClassForm` (`app/ui/main/regular-classes/request-regular-class-form.tsx`) with no server-side data-fetching of its own — the form component itself fetches subjects/teachers and the payment-method status client-side on mount. See that component's README (`app/ui/main/regular-classes`) for the payment-method-gate flow this form implements before a request can actually be submitted.

## How it fits together

Both pages are thin wrappers with essentially no page-level logic — all the interesting behavior (the payment-method gate, the accept/refuse/cancel confirmation modals) lives in the UI components they render. Unlike the one-off `classes` domain, there is no `[id]/page.tsx` detail route here — a `RegularClass`'s full state is already visible inline in the table row (status badge + action buttons), so there's no separate detail page to drill into. If a student wants to see a specific *occurrence* of a recurring series, that's just an ordinary `Class` row reachable through the normal `/main/student/classes/[id]` route (materialized occurrences carry a `regularClassId` but are otherwise indistinguishable from any other class in the detail page's eyes).
