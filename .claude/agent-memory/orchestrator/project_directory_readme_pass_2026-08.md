---
name: project_directory_readme_pass_2026-08
description: A full-repo directory-README documentation pass was completed 2026-08-05, on branch docs/directory-readmes; the squad roster's landmine notes were corrected during it and should be treated as current going forward.
metadata:
  type: project
---

On 2026-08-05, every meaningful directory in the repo got a thorough README.md (88 files total), dispatched across the full specialist squad in parallel plus some cross-cutting/leftover directories handled directly by the orchestrator. Branch: `docs/directory-readmes`, off `master`. Not yet committed/pushed as of the pass completing — the user said they'd handle git/PR/deploy themselves.

**Why this matters going forward:** several "landmine" notes in the squad roster (this file, `.claude/agents/orchestrator.md`) were stale by the time of this pass and were corrected as part of it — see that file's current roster table rather than trusting an older mental model of it. Highlights: the Nextcloud teacher-provisioning integration and the `/dashboard` login-redirect bug (both formerly `auth-rbac-engineer` landmines) are resolved; `priority` on `Class` is no longer inert; `RefundRequest` has a full application layer including a dedicated worker sweep, not a schema-only gap; the gamification streak system was rebuilt as weekly (not daily) with a quest system added; email sending via Resend is now partially wired up, not fully dormant.

**How to apply:** If a future task references a "known gap" or landmine from before 2026-08-05, treat it as possibly stale and re-verify against the code or against the new `app/lib/README.md` / `app/lib/actions/README.md` / `prisma/README.md` (all written during this pass and cross-verified against source) before acting on it.

Also surfaced during this pass, not yet fixed (flagged to the user, out of scope for the docs task itself): a plaintext production database credential sitting in `.claude/settings.local.json`'s permission allowlist (tracked by git, not gitignored, currently only in the uncommitted working-tree diff — see [[feedback_check_settings_local_for_leaked_secrets]]) — likely recorded automatically when a manual `prisma migrate deploy` command with an inline `DATABASE_URL` was run and allowlisted.
