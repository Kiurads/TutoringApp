---
name: seo-public-surface
description: SEO/public-route audit findings (2026-08-05) — what's actually public, and the footguns found there. Read before any future SEO or public-route work.
type: project
---

Full SEO audit performed 2026-08-05 (research-only, no code changed). Key durable facts for future work in this area:

## Public route inventory (confirmed via middleware.ts matcher + auth.config.ts + reading each page)
`middleware.ts` matcher is `["/", "/login", "/register/:path*", "/main/:path*"]` — only these paths ever run the `authorized()` callback. That means `/forgot-password`, `/reset-password`, `/signout`, `/users`, `/privacy-policy`, `/terms-of-service` receive **zero** middleware treatment (not protected, but also not redirect-looped for logged-in users). All confirmed genuinely public/unauthenticated by reading each `page.tsx` — none of them call `auth()`/`getServerSession()` themselves either.

## Footgun: `/users` is a live, unauthenticated PII leak (`app/users/page.tsx`)
Renders every user's first name, last name, and role via `fetchUsers()` with zero auth check, zero styling, and a discarded `fetchTeachersBySubjectsId(["biology"])` call — every hallmark of an abandoned dev scratch page (confirmed abandoned/unlinked by `app/README.md`'s own audit). Not in the middleware matcher, so nothing blocks a crawler or a curious visitor from hitting it directly. This is a security/privacy issue as much as an SEO one — flag prominently, don't undersell it as "just" a thin-content page. See `[[seo_audit_report]]` if it still exists, otherwise this is the source of truth.

## Footgun: `/register` and `/register/student` are byte-identical (confirmed via `app/register/README.md`)
Two indexable URLs serving the exact same `RegisterStudentForm` content — classic duplicate-content SEO problem, and separately just messy routing. `app/register/page.tsx`'s component is even still named `SignIn` (copy-paste leftover, unstyled bare `<form>` — no daisyUI classes at all, visually broken compared to every other route). Fix suggested by that README: make `/register` a thin `redirect("/register/student")`.

## `metadataBase` groundwork already exists
`NEXT_PUBLIC_APP_URL` env var is already set in prod (per `plan.md:313`) even though no custom domain exists yet (still on `estudyou-g7mfy.ondigitalocean.app`, tracked as an open item at `plan.md:315`). That env var is the natural value to wire into `metadataBase` in `app/layout.tsx` once per-page metadata work happens — don't invent a new env var for it.

## Other confirmed-absent SEO infra (as of 2026-08-05)
No `robots.txt`/`robots.ts`, no `sitemap.xml`/`sitemap.ts`, no `next-sitemap`/`next-seo` in `package.json`, no structured data/JSON-LD anywhere, no `app/opengraph-image.*`, no `app/icon.*` beyond the untouched default `app/favicon.ico` (still the stock Next.js multi-res icon, unbranded), no analytics/GA/Search-Console verification tag anywhere, `public/` still has the five unused default `create-next-app` SVGs (never cleaned up). `next.config.ts` only configures `images.domains` (deprecated key name — should be `remotePatterns` under Next 15) for `api.dicebear.com`/`img.daisyui.com`/`images.unsplash.com`; no redirects/headers/robots-adjacent config.

## Home page (`app/page.tsx`) content is solid
Server component, real Prisma-fetched testimonials, clean single-`h1`-then-`h2`s heading hierarchy, decent marketing copy across 8 composed sections (Hero/HowItWorks/ForStudents/Subjects/ForTeachers/Gamification/Testimonials/FinalCTA). No `<img>` tags at all (Font Awesome icon font only), so no alt-text problem, but also no real imagery to build a natural OG image from — an OG image will need to be purpose-built, not derived from existing assets. Page has no `export const revalidate`/`dynamic` — it's dynamically rendered per-request (hits Prisma every load), worth flagging as a minor perf/Core Web Vitals item alongside the SEO work, not just an SEO one.
