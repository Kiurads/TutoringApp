# app/ui/main/badges

Single-component directory: the shared badge-rendering UI used everywhere badges are displayed (student dashboard, teacher dashboard, and a public teacher profile). There is no badge-awarding logic here — this directory is purely presentational and reads whatever `Badge`/`UserBadge` rows it's handed.

## Files

- **`badge-showcase.tsx`** — `BadgeShowcase({ allBadges, earnedBadges, compact })`. Two rendering modes:
  - **Full mode** (default): groups `allBadges` by `category` (`milestone` / `engagement` / `subject` / `expertise` / `pedagogy`, labeled via a local `CATEGORY_LABEL` map — categories not in that map fall back to the raw string), and renders every badge in the catalog, greyed out/desaturated (`opacity-40 grayscale`) if not yet earned, full-color with an earned date if it is. This means **unearned badges are visible** by design — it's a checklist/collection view, not just a trophy case.
  - **Compact mode** (`compact` prop): renders only `earnedBadges` as a flat row of icon tiles with tooltips — no categories, no descriptions, no unearned placeholders. This is the mode used on a teacher's public profile page (`app/main/student/teachers/[id]/page.tsx`) where showing a stranger's *unearned* badges would be noise.

## How it fits together

- **Inputs are always pre-fetched by the caller** — `allBadges` comes from `fetchAllBadges()` and `earnedBadges` from `fetchEarnedBadges(userId)` (both in `app/lib/actions/users.actions.ts`), returning `Badge[]` and `(UserBadge & { badge: Badge })[]` straight from Prisma. This component does zero data fetching itself.
- Known callers: `app/ui/main/dashboard/academic-arc-widget.tsx` and `mentor-milestones-widget.tsx` do **not** use this component directly — they render their own inline "recent badges" strip (last 3 by `earnedAt`). `BadgeShowcase` is for the full/compact catalog views, not the dashboard summary widgets.
- On the teacher profile page it's filtered to `category === "milestone" | "expertise" | "pedagogy"` before being passed in — student-only categories (e.g. `engagement`, which currently includes `feedback_champion`, `streak_7`, `streak_30`) aren't excluded by the component itself, so that filtering has to happen at the call site. If you add a new category, check every call site's filter, not just the `CATEGORY_LABEL` map.

## Gotchas

- The component keys off `badge.category` being one of the five strings in `CATEGORY_LABEL`; the underlying Prisma enum is `BadgeCategory`, but this file treats it as a plain `string[]` derived via `[...new Set(...)]` — if a category is added to the schema, this file needs no code change (`?? cat` fallback), but you may want to add it to `CATEGORY_LABEL` for a nicer label.
- Icons are Font Awesome classes stored per-row as `badge.iconKey` (e.g. `fa-graduation-cap`) and interpolated directly into `className` — there's no validation that the stored key is a real FA class; a bad seed value silently renders no icon rather than erroring.
- `earnedBadges.length === 0` in compact mode renders "No badges yet." — full mode has no equivalent empty state because it always renders the full catalog (just all greyed out).
