# app/ui/main/earnings

Two Chart.js widgets used together on the teacher earnings page
(`app/main/teacher/earnings/page.tsx` — see that directory's README for how
they're wired up with real data). Both are `"use client"` and follow the
repo convention of registering only the Chart.js elements each component
actually needs, rather than one global registration call somewhere central.

## `monthly-earnings-chart.tsx` — `MonthlyEarningsChart`

A bar chart (`react-chartjs-2`'s `Bar`) of earnings for the trailing 12
calendar months, always anchored to "now" (not the data's date range).

- **Data shaping**: `getLast12Months()` builds an ordered `{ label, key }[]`
  from `now.getMonth() - 11` through the current month (label:
  `"Jan '24"`-style via `toLocaleDateString("en-US", { month: "short",
  year: "2-digit" })`; key: `"${year}-${month}"`). Incoming `payments:
  {amount, date}[]` are reduced into a `Record<key, number>` total inside a
  `useMemo`, then mapped back onto the fixed 12-month axis — months with no
  payments render as `0`, not omitted, so the x-axis is always a full,
  contiguous 12-month span regardless of data sparsity.
- **Registered elements**: `CategoryScale, LinearScale, BarElement, Title,
  Tooltip, Legend`.
- **Config specifics worth knowing before tweaking**: legend is hidden
  (`plugins.legend.display: false`, single-series chart), tooltip callback
  formats as `"€X.XX"` via `ctx.parsed.y.toFixed(2)`, bars use
  `borderRadius: 6` + `borderSkipped: false` for a rounded-top look, y-axis
  ticks are formatted with a trailing `€` via the `callback`, grid lines
  use a translucent slate (`rgba(148, 163, 184, ...)`) tuned to read on
  both daisyUI themes rather than pulling the *current* theme's CSS
  variables — if the brand palette changes, these hardcoded rgba values
  won't follow it automatically.
- **Empty state**: if every bucket is `0` (`hasData` check), renders a
  centered "No earnings data yet." message instead of an empty chart.

## `student-breakdown-chart.tsx` — `StudentBreakdownChart`

A doughnut chart (`Doughnut`, `cutout: "65%"`) of all-time earnings grouped
by student name, sorted descending by amount.

- **Data shaping**: `payments: {amount, studentName}[]` reduced into a
  `Record<studentName, number>` inside `useMemo`, then
  `Object.entries(...).sort((a, b) => b[1] - a[1])` for a highest-earner-
  first ordering, split into parallel `labels`/`values` arrays.
- **Registered elements**: `ArcElement, Tooltip, Legend` only (no scales —
  doughnut charts don't use them).
- **Color assignment**: a fixed 6-color palette (`COLORS`, indigo → violet
  → cyan → emerald → amber → red), sliced to the number of distinct
  students (`COLORS.slice(0, breakdown.labels.length)`). **This does not
  cycle** — a 7th+ student silently gets `undefined` as their slice color
  (Chart.js will fall back to its own default palette for those indices).
  If a teacher acquires more than 6 distinct students, worth checking this
  doesn't look broken.
- **Empty state**: returns `null` outright (no card, no placeholder text)
  when there are zero distinct students — different behavior from the bar
  chart's explicit "no data" message, so don't assume the two widgets
  degrade the same way.
- Tooltip callback formats as `" {label}: €X.XX"`.

## Shared visual shell

Both wrap their canvas in the same `rounded-lg border border-base-300
bg-base-100` card with a `px-4 py-3 border-b` header (title + subtitle),
matching the plain-bordered-panel look used for the payment history table
on the same earnings page (as opposed to the `card bg-base-200 shadow`
treatment used elsewhere in the app) — if adding a third earnings widget,
match this specific shell rather than the more common `card` pattern, for
visual consistency on that page.
