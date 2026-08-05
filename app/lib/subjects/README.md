# app/lib/subjects

Server Actions for managing the `Subject` catalog (e.g. "Biology", "Calculus") — the list of subjects teachers can be qualified in and students can browse/request classes for.

## Key files

- **`create-subject.ts`** — `createSubject(prevState, formData)`, a `useActionState`-compatible Server Action that creates a new `Subject` row. Admin-only: it re-checks `session.user.role === "admin"` server-side (never trust the client), rejects duplicate subject names via a `prisma.subject.findUnique` pre-check, and redirects to `/main/admin/subjects` on success. Returns a plain error string on failure rather than throwing, matching the codebase's manual-validation/`useActionState` form convention (no Zod anywhere in this app).

## How it fits together

- Called from the admin "create subject" form at `app/main/admin/subjects/create/page.tsx` via `app/ui/subject/subject-create-form.tsx`.
- Once created, a `Subject` becomes selectable in the class-booking subject pickers (`app/ui/main/classes/create/**/subject-select.tsx`) and in teacher registration's subject multi-select (`app/ui/register/teacher/subject-select.tsx`).
- This is a much smaller sibling to `app/lib/actions/subjects.actions.ts` (which holds the read/list/fetch actions for subjects) — subject *creation* was split out into its own directory rather than folded into that actions file.

## Gotchas

- The permission check happens after `auth()`, not in middleware — if you add more subject-management actions here, remember to repeat the `role === "admin"` check per-action rather than assuming route-level protection is enough.
