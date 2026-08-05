# app/ui/subject

Single-component directory: the admin "create a subject" form.

## `subject-create-form.tsx`

Default export `CreateSubjectForm`. `"use client"`. This is the canonical
example in the codebase of the **`useActionState`-bound server action**
form pattern (as opposed to the `useTransition` + manually-invoked async
function pattern used by the forms in `app/ui/main/users/`): it binds
`useActionState(createSubject, undefined)` directly, where `createSubject`
is imported from `@/app/lib/subjects/create-subject` and used as the
`<form action={formAction}>` prop. The hook's error slot renders as a
daisyUI `alert alert-error`; `isPending` swaps the submit button's label
for a `loading loading-spinner`. A single `name` text input, `required`,
no client-side format validation beyond that — matches the app-wide "no
Zod, manual/minimal validation" convention, here pushed almost entirely
onto the server action.

Rendered from `app/main/admin/subjects/create/page.tsx` (see that
directory's README) as the only content on that route.
