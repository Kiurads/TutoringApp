---
name: eStudyou Project Overview
description: Core purpose and current architecture of the tutoring platform app, and this agent's narrowed scope within the specialist squad
type: project
---

eStudyou is a tutoring marketplace platform (Next.js 15 app) connecting students with teachers for private tutoring sessions.

**Why:** This is the primary project. Understanding its structure is foundational, but as of the specialist squad's formation, most subsystem depth now lives in dedicated agents rather than here.

**How to apply:** Use this as a high-level map only. For anything beyond App Router mechanics/layout/build config, delegate rather than answering from memory — the detailed, currently-accurate domain knowledge lives with the specialists listed below.

## The specialist squad (formed 2026-07-16)

- `prisma-db-architect` — schema, migrations, Decimal/enum modeling.
- `auth-rbac-engineer` — NextAuth v5, middleware, role routing, registration.
- `stripe-payments-engineer` — PaymentIntents, pre-auth/capture/refund, webhook.
- `class-lifecycle-engineer` — the `Class` state machine, claiming, counter-offers, availability, notifications.
- `gamification-economy-engineer` — gems/sparks, tiers/ranks, badges, gem store.
- `daisyui-ui-engineer` — Tailwind/daisyUI components, forms/tables/modals.
- `vitest-qa-engineer` — test suite + dead-code/broken-link/mock-data audits.
- `orchestrator` — coordinates multi-domain work across the above.

This agent (`nextjs-expert`) keeps only what's left over: App Router structure, `app/layout.tsx`, `next.config.ts`, build/deploy, general Node/TS questions.

## Tech Stack
- **Framework:** Next.js 15.1.3, App Router, Turbopack (dev)
- **Language:** TypeScript 5
- **Database:** MySQL via Prisma ORM — see `prisma-db-architect` for schema depth
- **Auth:** NextAuth v5 (beta), Credentials provider, PrismaAdapter, JWT sessions — see `auth-rbac-engineer`
- **Payments:** Stripe — two coexisting flows (immediate-capture and pre-auth) — see `stripe-payments-engineer`
- **Email:** Resend is a dependency but is not currently wired to send anything anywhere in the app
- **UI:** Tailwind + daisyUI 5 (beta), Font Awesome via CDN script (the icon system actually used, not `react-icons`), Chart.js/`react-chartjs-2` — see `daisyui-ui-engineer`
- **Testing:** Vitest — see `vitest-qa-engineer`

## User Roles
- `student` — books/pays for classes, rates teachers, has a full app under `/main/student/**` (dashboard, classes, teachers, calendar, profile, onboarding, gem store)
- `teacher` — has a full app under `/main/teacher/**` (dashboard, classes, availability, calendar, earnings, students, profile) — this did **not exist** on `master` and was built out entirely on a feature branch
- `admin` — manages teachers/students/subjects/classes/payments under `/main/admin/**`, largely wired to real data (not mock, as an older snapshot of this memory used to claim)

## Known platform-wide gap (relevant across nearly every domain)
Nothing in the app ever sets `Class.status = "completed"` — no worker, cron, or admin action does it. This silently breaks the review/rating flow, several gamification badges, and the teacher-student "fit score" feature. If asked about any of these appearing broken, this is very likely why — see `class-lifecycle-engineer` and `gamification-economy-engineer` for the full blast radius before attempting a fix yourself.

## Notes specific to this agent's narrowed scope
- `next.config.ts` whitelists `api.dicebear.com`, `img.daisyui.com`, `images.unsplash.com` as remote image domains, with `dangerouslyAllowSVG` for DiceBear's SVG avatars.
- `app/layout.tsx` loads Font Awesome via a CDN `<Script>` and sets `data-theme` on `<html>` — check current hardcoding before assuming the dark-mode toggle (`theme-changer.tsx`) works end-to-end.
- Do not re-derive or re-document Prisma schema, Stripe flow, or auth details here — those now belong to their specialist agents and this file should stay a thin pointer, not a competing source of truth.
