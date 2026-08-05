---
name: feedback_verify_specialist_claims_that_conflict
description: Specialists working in parallel on adjacent/overlapping topics can produce directly contradictory factual claims about the same code — catch these by diffing their outputs, not just spot-checking each in isolation.
metadata:
  type: feedback
---

During the 2026-08 directory-README pass, two specialists working in parallel produced **directly contradictory claims about the same code path**: `class-lifecycle-engineer`'s `app/lib/actions/README.md` said class cancellation soft-cancels (`status: "cancelled"` via `prisma.class.update`), while `prisma-db-architect`'s `prisma/README.md` said cancellation hard-deletes the `Class` row. A third contradiction: `prisma-db-architect` described the `priority` field as "written but never read" (inert), while `class-lifecycle-engineer` said it actively drives `fetchOpenRequestsForTeacher`'s ordering.

Both times, reading the actual source (`grep` for `prisma.class.update`/`delete` in `classes.actions.ts`, `orderBy` in the same file) resolved it in favor of `class-lifecycle-engineer` — the specialist who owns the file being described got it right; the specialist describing it as a secondary/cross-referenced fact had stale or inferred information.

**Why:** Each specialist agent starts cold with only the context I relay — if two specialists both touch on the same fact from different angles (one owns the file, one owns the schema it maps to), nothing stops them from drifting to different conclusions, especially if one is working from older background assumptions and the other actually read the current file.

**How to apply:** During the integration/verification pass, don't just spot-check each specialist's output in isolation — actively look for places where two outputs describe the *same underlying behavior* (a field's usage, a delete-vs-update semantic, a call sequence) and diff them against each other. When they conflict, verify against source directly (grep/read the actual function) rather than picking whichever sounds more authoritative, then fix the wrong file(s) yourself as part of "resolve the seam" duty — don't leave it for the user to notice.
