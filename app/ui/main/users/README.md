# app/ui/main/users

Account-management UI shared by students and teachers (and, via `user-card`,
admin listing pages). This directory is intentionally mixed-domain — it
sits at the intersection of the auth system, the gamification/avatar
system, and plain profile CRUD — each file below touches a different one
of those, so read the per-file notes rather than assuming a single
ownership story for the whole directory.

Its `details/` subdirectory (own README) renders a *read-only* view of a
user (used on public-facing teacher/student detail pages), whereas the
files here are the *editable* self-service forms a logged-in user sees on
their own profile/settings page.

## Key files

- **`avatar-customizer.tsx`** — `"use client"`, ~525 lines, by far the
  largest/most stateful file in this directory. Renders the pencil-badge
  edit button overlaid on a user's avatar, and a tabbed (Hair/Face/Outfit/
  Background) modal for customizing the DiceBear `toon-head` avatar. Key
  details:
  - Uses a real `<dialog>` element with `showModal()`/`close()` (not a
    CSS-only `modal-open` class toggle) for a free focus trap and
    Escape-to-close, portalled to `document.body` via `createPortal` to
    escape any `overflow:hidden` ancestors — same pattern called out in
    `class-action-modals.tsx`.
  - The live preview (`buildAvatarDataUri`) is generated **entirely
    client-side as a data URI** — no network round-trip to DiceBear while
    the user is picking options, only on save.
  - Local color palettes (`HAIR_COLOR_GROUPS`, `CLOTHES_COLOR_GROUPS`,
    `BG_SWATCHES`) are deliberately *wider* than the small fixed set
    `avatar-utils.ts` exposes as `VALID_*` — the comments explain that
    local SVG generation accepts any 6-digit hex, unlike some upstream
    constraint, so the swatch UI offers more choices than the "valid enum"
    lists suggest.
  - Saving calls the `saveAvatarOptions` server action (from
    `app/lib/actions/avatar.actions`) with a JSON-stringified
    `AvatarOptions`, inside a `useTransition`. This is the write side of
    the avatar/frame system that `app/lib/avatar-utils.ts` and
    `app/lib/frame-utils.ts` define the shapes for — coordinate with
    whoever owns gamification/store before changing option shapes, since
    purchased frames render on top of whatever this component saves.

- **`change-password-form.tsx`** — `"use client"`, manual `useState` form
  (current/new/confirm password) with hand-rolled validation (min length
  8, confirm-match) — no `useActionState`/server-action binding here,
  unlike most other forms in the app; it calls `changePassword(...)` from
  `@/app/lib/auth/change-password` directly inside a `useTransition`. On
  success it hard-navigates to `/login?passwordChanged=true` via
  `window.location.href` (not `next/navigation`'s `redirect`) — the code
  comment explains this is deliberate: changing the password invalidates
  every session token issued before that moment (including the current
  one), so it avoids serving a stale page from the client Router Cache.

- **`profile-form.tsx`** — `"use client"`, role-branching (`student` |
  `teacher`) form for name/bio plus role-specific fields (learning
  style/goal for students; teaching style/hourly price for teachers).
  Manual validation (first/last name required), calls `updateProfile`
  from `@/app/lib/actions/users.actions` inside a `useTransition`. Note
  the student "Learning style" field is a native `<select>` (single-select,
  fine per convention — the checkbox-dropdown multi-select pattern is only
  required for *multi*-select inputs like subjects).

- **`teacher-subjects-form.tsx`** — `"use client"`, lets a teacher toggle
  which subjects they teach. Uses the **checkbox-as-pill-button** pattern
  (a `<label className="btn btn-sm rounded-full">` wrapping a visually
  hidden `<input type="checkbox">`) rather than the dropdown-with-checkbox
  pattern from `subject-select.tsx` — a simpler variant of the same
  "checkbox-driven multi-select, not native `<select multiple>`"
  convention, appropriate here since all subjects are shown as inline pills
  rather than a long dropdown list. Calls `updateTeacherSubjects(selected)`
  from `@/app/lib/actions/teachers/update-teacher-subjects`.

- **`user-card.tsx`** — server component, a clickable card (links to
  `/main/users/${user.id}`) showing name/email/role badge and an avatar,
  used in admin-facing user listing/browse UI. Pulls the avatar via
  `getAvatar` from `@/utils/get-avatar` (see gotcha below) rather than
  importing `buildAvatarDataUri`/`parseAvatarOptions` from
  `app/lib/avatar-utils.ts` directly.

## Non-obvious conventions/gotchas

- **Two avatar entry points exist.** `app/lib/avatar-utils.ts` holds the
  actual option types/constants/builders (`buildAvatarDataUri`,
  `parseAvatarOptions`, `VALID_*`), but most *consumers* in this app
  (`user-card.tsx` here, `details/header.tsx`, `students-table.tsx`,
  teacher's student roster page, etc.) go through a thin wrapper at
  `utils/get-avatar.ts` (repo-root `utils/`, **not** `app/lib/`) that just
  composes `buildAvatarDataUri(parseAvatarOptions(...))` into one call.
  `avatar-customizer.tsx` is the one place that imports the lower-level
  `avatar-utils.ts` functions directly, since it needs `parseAvatarOptions`
  and `buildAvatarDataUri` separately for its edit/preview flow. If you're
  looking for "where do I get an avatar URL for a user," `@/utils/get-avatar`
  is the answer 95% of the time.
- None of these forms use `useActionState` + a plain server `action`
  prop — they all use `useTransition` + a manually-called async function
  from `onSubmit`, which is a slightly different flavor of the same
  no-Zod, manual-validation convention documented at the app level.
  `subject-create-form.tsx` (elsewhere) is the `useActionState` variant for
  comparison.
