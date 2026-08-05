# app/ui — shared/global UI layer

Components in this top-level directory are used app-wide, regardless of role
(student/teacher/admin) or even auth state (some render on the public
marketing pages). They are the "chrome" around every page — fonts, the top
navbar, the theme toggle, and a global toast. Role-specific dashboard UI
(sidebars, widgets, tables, gamification, classes, payments, etc.) lives one
level down in `app/ui/main/**`, which has its own READMEs per subdirectory —
this file only covers what's directly in `app/ui/`.

Sibling directories (`login/`, `onboarding/`, `payment/`, `register/`,
`signout/`, `subject/`) are feature-scoped and documented separately (see
their own READMEs where present).

## Key files

- **`fonts.ts`** — loads `Poppins` (weights 500/600/700/900) via
  `next/font/google` as the app's single typeface. Imported once in
  `app/layout.tsx` and applied to `<body className={poppins.className}>`.
  Nothing else in the app should import a different font.

- **`navbar.tsx`** — the sticky top bar (`navbar bg-base-300 shadow-sm
  sticky top-0 z-50 print:hidden`) rendered unconditionally from
  `app/layout.tsx`, so it appears on every route including public marketing
  pages. Composes `Logo`, `NavbarButtons`, and `ThemeChanger`. Server
  component (`async function`, though it doesn't currently await anything
  itself).

- **`logo.tsx`** — the "Ponte" wordmark + graduation-cap icon
  badge, used in the navbar and in `signout-form.tsx`'s confirmation card.
  Pure presentational, no props.

- **`navbar-buttons.tsx`** — server component that calls `auth()` directly
  (from `@/auth`) to decide what to render: a "Sign out" link (→
  `/signout`, which hosts `signout-form.tsx`) if there's a session with an
  email, otherwise "Register"/"Login" links. Note the logged-out branch is
  wrapped in `hidden md:flex` — those buttons don't show on mobile navbar
  widths at all (no mobile menu fallback here), which is worth knowing if a
  bug report says "can't find login on my phone."

- **`go-back-button.tsx`** — trivial client component, a `btn btn-neutral`
  that calls `redirect(props.url)` from `next/navigation` on click. Note:
  `redirect()` is meant for use during render/server actions; calling it
  from a client-side `onClick` handler works in practice (it throws a
  special Next.js redirect signal) but is a slightly unusual use of the
  API — most navigation-on-click elsewhere in the app uses `useRouter()`
  or a plain `<Link>`. If this button starts behaving oddly after a Next.js
  upgrade, this is the first thing to check.

- **`theme-changer.tsx`** — `"use client"`. A daisyUI `swap swap-rotate`
  sun/moon toggle bound to a **manually controlled** checkbox (`checked`/
  `onChange`), not daisyUI's automatic `theme-controller` JS binding. On
  change it sets `document.documentElement.setAttribute("data-theme", ...)`
  and writes `localStorage.setItem("theme", ...)` itself. On mount it reads
  `localStorage` back into `isDark` state. This pairs with a **blocking
  inline `<script>`** in `app/layout.tsx` (runs before hydration, before
  paint) that reads `localStorage.getItem('theme')` and sets `data-theme`
  on `<html>` immediately — so even though `<html>` has `data-theme="light"`
  hardcoded in the JSX as a fallback/no-JS default, the inline script
  overrides it pre-paint and this component keeps it in sync afterward.
  Dark mode persistence across reloads does work end-to-end via this
  script + localStorage pair — don't assume it's broken without checking
  both pieces together.

- **`toast-notification.tsx`** — `"use client"`. Reads a `toast` query-param
  value (e.g. `?toast=created`), looks it up in a local `TOASTS` map
  (message + daisyUI `alert-*` class + Font Awesome icon), shows a
  bottom-right fixed `alert` for ~4s with a fade-out, then dismisses.
  Immediately strips `?toast=` from the URL via `router.replace(...,
  { scroll: false })` so a refresh doesn't re-trigger it, while keeping the
  toast visible by capturing the initial value in `useState` before the
  strip happens. Positioned bottom-right specifically to avoid colliding
  with the mobile drawer-toggle button (fixed bottom-4 left-4) — see the
  code comment. To add a new toast variant, add a key to the `TOASTS`
  record and pass `?toast=<key>` from wherever the triggering action
  redirects.

## Conventions/gotchas to carry forward

- Icons throughout this directory are Font Awesome via `<i
  className="fa-solid fa-...">` (loaded globally via the CDN `<Script>` tag
  in `app/layout.tsx`) — not `react-icons`. `theme-changer.tsx` is the one
  exception, using hand-written inline SVGs for the sun/moon glyphs instead
  of Font Awesome, presumably for the `swap-off`/`swap-on` crossfade effect
  daisyUI's `swap` component expects.
- No Zod or other schema-validation library appears anywhere in this
  directory (or the app) — validation, where present, is manual.
