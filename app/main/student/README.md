# app/main/student/

The student-facing app, mounted under `/main/student/**`. This README is the canonical explanation of the layout/sidebar/error/loading convention shared by both `app/main/student/` and `app/main/teacher/` — `app/main/teacher/README.md` just points back here instead of repeating it.

## The layout/sidebar/error/loading convention

- **`layout.tsx`** (server component) — runs once per request for any nested route. Calls `auth()` to get the session email, then in a single `Promise.all` fetches: (1) unread/recent notifications via `fetchNotificationsForUser`, and (2) `firstName` + `avatarOptions` directly via `prisma.user.findUnique` (not through an action — one of the few places in `app/main/**` that queries Prisma inline rather than going through `app/lib/actions`). Builds the avatar image as a data URI (`buildAvatarDataUri` + `parseAvatarOptions`, from `app/lib/avatar-utils.ts`) so the sidebar can render an avatar with zero extra round-trips. All of this is handed down as props into `<StudentSidebar>`, which wraps `{children}`.
- **`_components/StudentSidebar.tsx`** (client component) — the actual persistent chrome: a daisyUI `drawer` (`lg:drawer-open` so it's pinned open on desktop, collapsible on mobile) containing the nav sections (Overview / Learning / Rewards / Account) and a `NotificationDropdown`. Nav items are a plain array of `{ href, icon, label, dataTour }` — `dataTour` attributes are onboarding-tour hooks (see `WelcomeTourModal`, gamification-owned), not styling. Active-link highlighting is `pathname.startsWith(link.href)`. The `_components` folder name's leading underscore is Next.js's ["private folder"](https://nextjs.org/docs/app/api-reference/file-conventions/colocation#private-folders) convention — it opts the folder out of routing entirely, so `_components/StudentSidebar.tsx` can never itself become a route segment; it's purely a colocation mechanism for a component used only within this subtree.
- **`error.tsx`** (client component, `"use client"`) — nested error boundary scoped to everything under `/main/student/**`. Catches errors before they'd bubble to the root `app/error.tsx`, so a broken student page doesn't take out the whole shell/navbar. Reassures the user their data is fine, offers "Try again" (`reset()`) or a link back to `/main/student/dashboard`.
- **`loading.tsx`** — trivial, just renders `<PageSkeleton />` (`app/ui/main/page-skeleton`, daisyUI-owned) as the Suspense fallback for this subtree.

This four-file pattern (`layout.tsx` fetching shared chrome data server-side → client sidebar component in `_components/` → scoped `error.tsx` → scoped `loading.tsx`) repeats identically in `app/main/teacher/`. `app/main/admin/` follows only part of it — see that README for the differences.

## Trivial leaf routes (single `page.tsx`, no README of their own)

- **`dashboard/`** — the student home page. Redirects to `/login` if unauthenticated. Notably: if the user hasn't completed onboarding (`!user.hasCompletedOnboarding`) and the URL has no `?tour=1`, it redirects to `/main/student/onboarding` instead of rendering — onboarding hands control back here with `?tour=1` afterward (whether skipped or finished) specifically to avoid an infinite redirect loop back into onboarding. Composes several dashboard widgets (`UpcomingClasses`, `StudentPayments`, `NextUpCard`, `AcademicArcWidget`, `WeeklyQuestsWidget`) plus a `WelcomeTourModal` for first-time visitors.
- **`onboarding/`** — a client-side multi-step form (`useState`/`useTransition`) collecting `learningStyle` and `learningGoal` preferences via `updateProfile`. Purely a preference-collection wizard, not account creation (that's `app/register/student`).
- **`profile/`** — profile editing, password change, avatar customization, and badge showcase, plus tier/gem display (`calcTier`, `getTierProgress` from `app/lib/gamification-utils.ts` — gamification-owned).
- **`subjects/`** — a static-ish browse grid of subjects (icons hardcoded in a local `SUBJECT_ICONS` map) linking through to teachers per subject.

## Feature directories documented elsewhere

These have their own, separately-authored READMEs (other specialist agents) — not duplicated here:

- `app/main/student/classes/`
- `app/main/student/regular-classes/`
- `app/main/student/calendar/`
- `app/main/student/payments/`
- `app/main/student/store/`
- `app/main/student/teachers/`
