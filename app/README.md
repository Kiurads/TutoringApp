# app/

Next.js 15 App Router root. This directory is the entire routed surface of eStudyou (product-facing name in code: "Ponte" as of 2026-08 — previously "The Learning Nexus," see the `title.default` in `[locale]/layout.tsx`), plus the shared root layout/shell and its supporting files.

## Internationalization (i18n) — `app/[locale]/`

As of 2026-08, every actual page route lives one level deeper than it looks from the URL: under `app/[locale]/` (see #157/#162). This is `next-intl` with `localePrefix: "as-needed"` (config in `i18n/routing.ts` at the repo root, not under `app/`):

- **English** (`en`, the default locale) keeps today's URLs completely unprefixed — `/login`, `/main/student/dashboard`, etc. — via an invisible internal rewrite, not a redirect.
- **Portuguese** (`pt`) is reachable under an explicit `/pt` prefix — `/pt/login`, `/pt/main/student/dashboard`.

This means `auth.config.ts`'s `authorized()` callback (path-based role/route gating) has to recognize both forms — it strips a leading `/pt` before doing its normal path checks, then re-adds it when building redirect targets, so the pre-i18n logic and its existing tests keep working untouched for English. `middleware.ts` composes NextAuth and next-intl in one file: NextAuth's `auth()` wrapper must be the **outer** layer (so `authorized()` sees the raw, pre-locale-rewrite pathname), and — important gotcha — the *wrapped-handler* form of `auth()` does **not** auto-enforce `callbacks.authorized` the way the bare `export default auth` form does, so the gating is invoked explicitly inside the wrapper before handing off to next-intl's middleware.

Translated strings live in `messages/en.json` / `messages/pt.json` (currently just a placeholder key — full extraction of the app's hardcoded UI/notification/email strings is tracked separately, #163/#164, not done as part of the routing foundation). Existing `next/link`/`redirect()` calls with hardcoded absolute paths (e.g. `redirect("/main/teacher/dashboard")`) still work for English but will drop a Portuguese user back to the unprefixed English URL, since they don't know about the current locale — swapping these for `i18n/navigation.ts`'s locale-aware `Link`/`redirect` wrappers is also deferred to #163.

## Root shell files

- **`[locale]/layout.tsx`** — the single root `<html>`/`<body>` shell for the whole app (see the i18n section above for why it's nested under `[locale]/`). Validates the `locale` route param via `hasLocale()`, calls `setRequestLocale()`, and wraps children in `NextIntlClientProvider`. Sets `data-theme="light"` on `<html>` with `suppressHydrationWarning`, loads the Poppins font (`app/ui/fonts`), and mounts a blocking inline `<script>` (must stay the first child of `<body>`) that reads `localStorage.theme` and re-applies it before paint — this is what makes the dark-mode toggle (`theme-changer.tsx`, owned by `daisyui-ui-engineer`) not flash back to light on reload. Also loads Font Awesome via a `next/script` Kit URL (`kit.fontawesome.com/c0fa11f9f4.js`) — this is the actual icon system used throughout the app, not `react-icons`. Wraps everything in `<Providers>` and renders a global `<Navbar />` (`app/ui/navbar`, daisyUI-owned) above `{children}`. Its `metadata` export sets `metadataBase` (from `NEXT_PUBLIC_APP_URL`, needed for Next to resolve absolute OG/Twitter image URLs) plus default `openGraph`/`twitter` blocks and the site-wide title template (`"%s — Ponte"`); child routes should set only a short `title` string (or none, to inherit the `default`) and let the template append the brand suffix rather than hand-appending it.
- **`icon.tsx`**, **`apple-icon.tsx`**, **`opengraph-image.tsx`** — Next.js file-convention metadata routes, generated at request time via `next/og`'s `ImageResponse` (no static image assets exist in the repo to work from). Deliberately stay at `app/` root, *outside* `[locale]/` — there's one favicon/OG-image set for the whole site, not one per locale. All three reuse the same 🎓-on-`#0052cc` motif as the in-app navbar wordmark (`app/ui/logo.tsx`) — `#0052cc` is daisyUI's `primary` color from the light theme in `tailwind.config.ts` (the app's default `data-theme`), hardcoded here since generated images can't be theme-reactive.
- **`providers.tsx`** — thin client component wrapping children in NextAuth's `<SessionProvider>`. This is the only global context provider; nothing else (theme, query client, etc.) lives here.
- **`page.tsx`** — the public marketing homepage (`/`). Server component; fetches up to 12 real `TeacherRating` rows with a non-null `review` directly via Prisma (not through `app/lib/actions`) to populate a testimonials section. Composed of section components defined in the same file (Hero, HowItWorks, ForStudents, SubjectsSection, ForTeachers, GamificationSection, Testimonials, FinalCTA) — purely presentational marketing copy, not a candidate for reuse elsewhere.
- **`error.tsx`** — root-level error boundary (`"use client"`), catches anything not caught by a more specific nested `error.tsx`. Logs to console and offers "Try again" / "Go to login".
- **`loading.tsx`** — root-level Suspense fallback, a centered daisyUI spinner.
- **`globals.css`** — Tailwind directives plus hand-written keyframes/utility classes that aren't Tailwind-generated: fade/slide/scale-in entrance animations (`.animate-fade-in`, `.animate-slide-in-left`, `.animate-scale-in`, `.stagger-children`, `.page-enter`), and the three gamification "profile frame" glow effects (`frame-scholar`, `frame-luminary`, `frame-sage` — outline + pulsing `box-shadow`, driven by `app/lib/frame-utils.ts`, gamification-owned). Styling specifics beyond these globals belong to `daisyui-ui-engineer`.

## Route tree overview

```
app/
├── [locale]/                         every real page route lives here — see the i18n section above
│   ├── page.tsx, layout.tsx, ...     marketing homepage + root shell (this README)
│   ├── login/, register/, register/teacher/, register/student/,
│   │   forgot-password/, reset-password/, signout/,
│   │   privacy-policy/, terms-of-service/   thin public single-page.tsx routes (see below)
│   └── main/                         role-based app, gated by middleware.ts — see app/main/README.md
│       ├── student/                  see app/main/student/README.md
│       ├── teacher/                  see app/main/teacher/README.md
│       └── admin/                    see app/main/admin/README.md
├── icon.tsx, apple-icon.tsx,
│   opengraph-image.tsx, robots.ts,
│   sitemap.ts                        site-wide metadata routes — deliberately NOT under [locale]/
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

- `app/[locale]/login/page.tsx`
- `app/[locale]/register/page.tsx`, `app/[locale]/register/teacher/page.tsx`, `app/[locale]/register/student/page.tsx`
- `app/[locale]/forgot-password/page.tsx`
- `app/[locale]/reset-password/page.tsx`
- `app/[locale]/signout/page.tsx`
- `app/[locale]/privacy-policy/page.tsx`
- `app/[locale]/terms-of-service/page.tsx`

### Role-based app (`app/main/`)

The three logged-in role experiences — student, teacher, admin — live under `app/main/`. See `app/main/README.md` for the split, and each subtree's own README for its layout/sidebar convention.

### API layer (`app/api/`)

Route handlers (webhooks, auth, payment intents, health check, revalidation). See `app/api/README.md`.

## `app/users/` — removed (2026-08-05)

Used to exist at the route `/users`: a leftover scratch page from early development that rendered every user's name and role via an unauthenticated `fetchUsers()` call, unlinked from anywhere in the app but still reachable by direct URL — a live PII leak, not just dead code. Found during an SEO audit (which flagged it as crawlable/indexable, worse than merely unused) and deleted outright along with the now-unused `fetchUsers()` export in `app/lib/actions/users.actions.ts`. `fetchTeachersBySubjectsId`, which this page also called (discarding the result), is unaffected — it's a real, tested, in-use function elsewhere (`app/ui/main/regular-classes/request-regular-class-form.tsx`).
