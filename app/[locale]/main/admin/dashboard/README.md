# app/main/admin/dashboard

Admin overview page: `/main/admin/dashboard`. Distinct from the
gamification-heavy student/teacher dashboards (widgets, streaks, gems/
sparks — documented under `app/ui/main/dashboard/**`) — this is a plain
platform-stats overview with no gamification content at all.

## `page.tsx`

Server component (`AdminDashboard`). A local `getStats()` helper runs five
Prisma queries **in parallel** via `Promise.all`: student count, teacher
count, total class count, `payment.aggregate({ _sum: { amount: true } })`
for lifetime revenue, and the 8 most recently created classes (with
student/teacher/subject names selected via relations). Like
`app/main/admin/students/page.tsx`, this queries Prisma directly in the
page rather than through an `app/lib/actions/*` action.

Renders four `stat` tiles (Students/Teachers/Classes/Revenue, each with a
Font Awesome icon and a distinct theme color: primary/secondary/accent/
success) in a `grid-cols-2 xl:grid-cols-4` layout, then a "Recent Classes"
table (student, teacher — or an italic "Unassigned" placeholder when
`teacher` is null, e.g. an unclaimed on-demand request — subject, date,
status badge) with a "View all" link to `/main/admin/classes`.

**Status badge coverage gap**: `STATUS_BADGE` maps
`completed`/`scheduled`/`requested`/`refused` to daisyUI badge color
classes, but the `Status` enum in `prisma/schema.prisma` also has a fifth
value, `cancelled`, which isn't in this map. A cancelled class's badge
falls through to the `?? "badge-ghost"` default rather than getting its
own distinct color (e.g. matching how `refused` gets `badge-error`) — not
a crash, just a visual inconsistency worth a one-line fix if a designer
notices cancelled and unstyled-default classes look the same.
