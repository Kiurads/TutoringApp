# app/main/student/classes

The student-facing routes for the class-lifecycle domain: the list page, a single class's detail page, the pre-auth payment success page, and the booking-request form page. All are thin Server Components that fetch via `app/lib/actions/classes.actions.ts` (and related domain actions) and compose UI from `app/ui/main/classes/**` — essentially no logic of its own beyond auth gating and shaping props.

## `page.tsx` — `/main/student/classes`

Redirects to `/login` if unauthenticated. Fetches `fetchBookedClassesByUser(email)` and renders `FirstVisitWarning` (the localStorage-dismissible "unpaid classes get auto-cancelled" banner) + `BookedClasses` (`app/ui/main/classes/student-booked-classes.tsx`). Reads a `?toast=` search param into the shared `ToastNotification` component (`app/ui/toast-notification.tsx`, not under `app/ui/main/classes` despite what some documentation of this area may say — verify the actual import path before trusting a description of where it lives) for post-action confirmation banners (e.g. `?toast=created`, `?toast=accepted`, `?toast=cancelled` from the various redirecting server actions).

## `[id]/page.tsx` — a single class's detail page

The richest page in this directory. Fetches `fetchClassById(id)` and the current user in parallel, then does its own **authorization gate** (must be the class's student, its teacher, or an admin — mirroring the `isParticipant` checks inside `classes.actions.ts` itself, but this is a separate, page-level check since the page needs to decide whether to render "Class not found" at all, not just refuse a mutation). Computes all the same `canAccept`/`canRefuse`/`canCancel`/`canPay` booleans the table-buttons components compute (duplicated logic, not shared — see the `app/ui/main/classes` README for the general pattern of near-duplicated derivation across this domain) plus two things unique to this page:
- `canReport`: gates the no-show report section — only `completed`, `paid`, and past the session's actual end time (`startTime + durationInHours` has elapsed), not just `status === "completed"` — a defensive extra check beyond the status flag alone.
- `existingReview`: fetched via `fetchReviewByClassId` (`ratings.actions.ts`) only when `completed` and a teacher exists, to decide whether `LeaveReviewForm` renders in its read-only or fresh-submission mode.

Composes, top to bottom: `ClassInfoCard`, `JoinClassCard` (video call), a pre-auth informational banner (shown when `hasPreAuth && !paid`, explaining the hold will auto-capture on acceptance), the `ClassActionModals` action panel (only rendered at all if `hasActions` is true), `LeaveReviewForm` (completed classes with a teacher), and `NoShowReportSection` (gated by `canReport || refundRequest` — so a student can still see a past dispute's status even after the report window's specific `canReport` condition would no longer hold true, e.g. it's already resolved).

## `[id]/pay/success/page.tsx`

The return-URL landing page after a Stripe Checkout/Elements redirect for the plain immediate-capture "Pay Now" flow — requires `payment_intent`, `payment_intent_client_secret`, and `redirect_status` search params (all supplied by Stripe's redirect), calling `notFound()` if any are missing or the class doesn't exist. Purely a confirmation screen (subject/teacher/student/date/status summary + a link back to the classes list) — it does not itself finalize the payment; that already happened via the `/api/payment-intent` route and its webhook/confirmation flow (cross-reference the stripe-payments-engineer domain for that side) before the browser ever lands here.

## `request/page.tsx`

Renders `RequestClassForm` (`app/ui/main/classes/create/student/create-class-form.tsx`). If a `?teacher=` query param is present (arriving from a teacher profile's "Book" button or `TeacherAvailabilityView`'s slot-click deep link — see `app/ui/main/availability`'s README), pre-fetches that teacher's name and subject list to pre-seed the wizard's first phase; a failed lookup (bad/stale id) is swallowed and falls back to the open form rather than erroring the page. Also fetches `fetchStudentStoreState()` to pass `studyBoostActive`/`priorityBooking` flags down into the form for its UI copy/discount preview — this is a *read* of the student's current perk state, not a mutation; the perks themselves are actually consumed server-side inside `createClassAsStudent`/`createClassWithPreAuth` when the request is finally submitted.

## Gotchas

- The `[id]/page.tsx` authorization/derived-state block is hand-duplicated from the equivalent logic in `classes.actions.ts` and in the table-button components — a change to who's allowed to do what needs to be applied in all these places, not just the server action.
- `request/page.tsx`'s teacher pre-fetch swallows any lookup error silently — a deep link with a stale/deleted teacher id degrades gracefully to the open form rather than showing an error, which is easy to mistake for "the pre-fill feature is broken" during testing if you don't realize the fallback is intentional.
