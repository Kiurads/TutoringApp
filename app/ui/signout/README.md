# app/ui/signout

## `signout-form.tsx`

`SignOutForm` — a confirmation card ("Do you want to be signed out?") rendered by `app/signout/page.tsx`. Unlike every other auth form in this app, it's not `useActionState` + a named server action in `app/lib/auth/` — it's a **server component** whose `<form action={...}>` is an inline async function marked `"use server"` directly in the JSX:

```tsx
action={async () => {
  "use server";
  await signOut({ redirect: false });
  redirect("/login");
}}
```

`signOut` here is next-auth's own `signOut` (exported from the root `auth.ts`), called with `redirect: false` so it just clears the session cookie/JWT and returns, and the explicit `redirect("/login")` afterward drives the actual navigation — same pattern as `redirect: false` + manual navigation used in `app/lib/auth/authenticate.ts` for login, for the same underlying reason (letting NextAuth's own internal redirect fire can behave unpredictably relative to the rest of the request). Because this is a plain `redirect()` inside a Server Action rather than a client-side `window.location` navigation, it doesn't hit the same stale-router-cache concern documented in `authenticate.ts` — sign-out doesn't need to carry a *new* session cookie through middleware the way sign-in does.

No client component, no error state, no server action file — this is the simplest form in the auth surface.
