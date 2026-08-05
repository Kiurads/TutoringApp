# app/ui/main

This directory is the parent for all role-specific dashboard UI (see the
many subdirectories — `classes/`, `dashboard/`, `earnings/`, `store/`,
`teachers/`, `users/`, etc. — each documented in its own README). The only
file that lives directly here is `page-skeleton.tsx`.

## `page-skeleton.tsx`

A generic loading skeleton, shared across all three role areas. Rendered by
`app/main/student/loading.tsx`, `app/main/teacher/loading.tsx`, and
`app/main/admin/loading.tsx` — Next.js App Router's automatic
`loading.tsx` convention shows this while a server-fetched page under that
route segment is still resolving.

It renders a daisyUI `skeleton` block for a page title, a row of three
`skeleton` stat-tile placeholders, and one large `skeleton` block for a
table/chart area — deliberately generic so it looks plausible under any of
the three role dashboards rather than mimicking one specific page's exact
layout. Per its own comment, it assumes it's being dropped inside the
sidebar layout's existing `p-6` content wrapper and adds no padding/margin
of its own — don't reuse it somewhere without that ancestor padding without
checking spacing first.
