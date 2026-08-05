# app/

Next.js 15 App Router root. This directory is the entire routed surface of eStudyou (product-facing name in code: "The Learning Nexus" — see the `<title>` in `layout.tsx`), plus the shared root layout/shell and its supporting files.

## Root shell files

- **`layout.tsx`** — the single root `<html>`/`<body>` shell for the whole app. Sets `data-theme="light"` on `<html>` with `suppressHydrationWarning`, loads the Poppins font (`app/ui/fonts`), and mounts a blocking inline `<script>` (must stay the first child of `<body>`) that reads `localStorage.theme` and re-applies it before paint — this is what makes the dark-mode toggle (`theme-changer.tsx`, owned by `daisyui-ui-engineer`) not flash back to light on reload. Also loads Font Awesome via a `next/script` Kit URL (`kit.fontawesome.com/c0fa11f9f4.js`) — this is the actual icon system used throughout the app, not `react-icons`. Wraps everything in `<Providers>` and renders a global `<Navbar />` (`app/ui/navbar`, daisyUI-owned) above `{children}`.
- **`providers.tsx`** — thin client component wrapping children in NextAuth's `<SessionProvider>`. This is the only global context provider; nothing else (theme, query client, etc.) lives here.
- **`page.tsx`** — the public marketing homepage (`/`). Server component; fetches up to 12 real `TeacherRating` rows with a non-null `review` directly via Prisma (not through `app/lib/actions`) to populate a testimonials section. Composed of section components defined in the same file (Hero, HowItWorks, ForStudents, SubjectsSection, ForTeachers, GamificationSection, Testimonials, FinalCTA) — purely presentational marketing copy, not a candidate for reuse elsewhere.
- **`error.tsx`** — root-level error boundary (`"use client"`), catches anything not caught by a more specific nested `error.tsx`. Logs to console and offers "Try again" / "Go to login".
- **`loading.tsx`** — root-level Suspense fallback, a centered daisyUI spinner.
- **`globals.css`** — Tailwind directives plus hand-written keyframes/utility classes that aren't Tailwind-generated: fade/slide/scale-in entrance animations (`.animate-fade-in`, `.animate-slide-in-left`, `.animate-scale-in`, `.stagger-children`, `.page-enter`), and the three gamification "profile frame" glow effects (`frame-scholar`, `frame-luminary`, `frame-sage` — outline + pulsing `box-shadow`, driven by `app/lib/frame-utils.ts`, gamification-owned). Styling specifics beyond these globals belong to `daisyui-ui-engineer`.

## Route tree overview

```
app/
├── page.tsx, layout.tsx, ...        marketing homepage + root shell (this README)
├── login/, register/, register/teacher/, register/student/,
│   forgot-password/, reset-password/, signout/,
│   privacy-policy/, terms-of-service/   thin public single-page.tsx routes (see below)
├── main/                             role-based app, gated by middleware.ts — see app/main/README.md
│   ├── student/                      see app/main/student/README.md
│   ├── teacher/                      see app/main/teacher/README.md
│   └── admin/                        see app/main/admin/README.md
├── api/                              route-handler layer — see app/api/README.md
├── users/                            dead/debug scaffolding, see below — NOT a real route
├── ui/                               components — owned by daisyui-ui-engineer
├── lib/                              server actions/business logic — split across specialist agents
├── email/                            email-template.tsx (Resend is installed but not currently wired up — see project memory)
└── utils/                            build-response.ts helper
```

Route access control (which roles can reach `/main/**`, redirect rules, etc.) lives in `middleware.ts` at the repo root and `auth.config.ts` — owned by `auth-rbac-engineer`, not documented here.

### Public/marketing routes

All of the following are thin routes with a single `page.tsx` each (`register/` additionally has `register/teacher/page.tsx` and `register/student/page.tsx` as its two sub-flows). They don't get individual READMEs:

- `app/login/page.tsx`
- `app/register/page.tsx`, `app/register/teacher/page.tsx`, `app/register/student/page.tsx`
- `app/forgot-password/page.tsx`
- `app/reset-password/page.tsx`
- `app/signout/page.tsx`
- `app/privacy-policy/page.tsx`
- `app/terms-of-service/page.tsx`

### Role-based app (`app/main/`)

The three logged-in role experiences — student, teacher, admin — live under `app/main/`. See `app/main/README.md` for the split, and each subtree's own README for its layout/sidebar convention.

### API layer (`app/api/`)

Route handlers (webhooks, auth, payment intents, health check, revalidation). See `app/api/README.md`.

## `app/users/` — dead/debug code, not a real feature

`app/users/page.tsx` renders at the route `/users`. It is **not linked from anywhere** in the codebase (confirmed via repo-wide grep for `/users`, `href="/users"`, and imports of `app/users`) and is not referenced by any nav, sidebar, or redirect. Its content:

```tsx
export default async function UsersPage() {
	await fetchTeachersBySubjectsId(["biology"]);
	const users = await fetchUsers();
	...
}
```

It hardcodes a call to `fetchTeachersBySubjectsId(["biology"])`, discards the result entirely (never used in the returned JSX), and then separately renders a raw, unstyled list of all users via `fetchUsers()`. This has every hallmark of a leftover scratch page from early development (testing a server action against a hardcoded subject) rather than a real feature. It performs an unauthenticated full-user-list query with no role gating and no styling. Flagged for a human to consider deleting — not fixed here per the read-only scope of this pass.
