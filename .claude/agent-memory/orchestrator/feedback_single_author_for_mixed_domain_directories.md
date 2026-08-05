---
name: feedback_single_author_for_mixed_domain_directories
description: When one filesystem directory spans many specialists' domains but needs exactly one README/output file, assign a single primary author rather than merging multiple agents' edits.
metadata:
  type: feedback
---

When a single flat directory contains files from many different specialists' domains (e.g. `app/lib/actions/` — ~25 Server Action files spanning class-lifecycle, Stripe, gamification, and general CRUD; or `app/lib/`'s top-level files spanning gamification, Stripe/payouts, notifications, and email), and the deliverable is one file per directory (one README, one refactor, etc.), assign **one specialist as primary author** who reads every file — including ones outside their own domain — rather than trying to have multiple specialists sequentially or concurrently edit the same shared file.

**Why:** Sequential edits to one file by multiple cold-started agents risk overwriting each other's work or producing an incoherent patchwork; concurrent edits risk a literal write conflict. During the 2026-08 directory-README pass, `class-lifecycle-engineer` was assigned the full `app/lib/actions/README.md` (their largest domain share) and asked to accurately describe the Stripe/gamification files too, using landmine context I relayed from those specialists' known domains. The result was accurate (spot-checked against source, e.g. the `paymets.actions.ts` typo note, the pre-auth-capture-in-`acceptClassById` cross-file relationship) and coherent in one voice, with no merge conflict.

For content specific to *files with no directory of their own* (e.g. `app/lib/gamification.ts` sitting directly in `app/lib/` alongside unrelated top-level files), have each relevant specialist return a description in their **final report text**, not as a file edit, and compile the shared file yourself as the orchestrator afterward. This was done for `app/lib/README.md`, pulling descriptions from `stripe-payments-engineer` (stripe.ts/payouts.ts/payouts-utils.ts), `gamification-economy-engineer` (six gamification files), and `class-lifecycle-engineer` (notifications.ts) into one compiled file.

**How to apply:** When splitting a cross-cutting task by domain, check whether the deliverable unit is per-directory or per-file. If per-directory and the directory is mixed-domain, pick the specialist with the largest share (or the most central domain) as sole author and give them the other domains' landmine context to write accurately about the rest — don't split one target file across multiple dispatches.
