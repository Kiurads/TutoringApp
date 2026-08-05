# prisma/migrations/

Sequential migration history for the MySQL database, one subfolder per migration, each containing a single `migration.sql`. `migration_lock.toml` pins the provider (`mysql`) and must never be edited by hand. This directory is the append-only record `prisma migrate deploy` replays against production and `prisma migrate dev` diffs against locally — see `prisma/README.md` for how the two environments actually apply these.

## Naming convention

`YYYYMMDDHHMMSS_description` (e.g. `20260727142440_add_password_changed_at`) — a UTC timestamp prefix (the standard `prisma migrate dev --name <description>` folder-naming scheme) followed by a short snake_case description of the change. Sort order is chronological by construction; don't rename an existing folder or Prisma will lose track of what's already been applied (the applied set is tracked by folder name + checksum in the database's own `_prisma_migrations` table, not derived from file contents at runtime).

Note the timestamp gap between `20250307144931_remove_client_secret` and `20250401181741_rating_int_to_decimal`, and again a much larger gap before `20260316184834_add_is_online_to_user` — these are real gaps in when schema work happened, not evidence of missing/deleted migrations.

## Two authoring styles — the history has a visible seam

Migrations from the initial project setup through roughly `20260420122204_avatar_options_text` read like **stock `prisma migrate dev` output**: terse `-- CreateTable` / `-- AlterTable` / `-- AddForeignKey` section markers only, no prose, straight DDL. Compare `20250302173526_initial_database` or `20260405172936_add_notifications`.

Starting around `20260722205907_add_class_points_tracking` and consistently from `20260722214813_add_streaks_and_quests` onward, migrations carry **hand-written explanatory comment blocks** above the DDL — something Prisma's own diff engine never generates on its own. For example, `20260727142440_add_password_changed_at`:
```sql
-- AlterTable: User — tracks when the password last changed, so a session
-- token issued before that moment can be detected as stale and invalidated
-- (see app/lib/auth/session-staleness.ts and auth.ts's jwt callback).
-- Left NULL for existing users: nothing to invalidate retroactively, their
-- current sessions stay valid until they next change/reset their password.
ALTER TABLE `User` ADD COLUMN `passwordChangedAt` DATETIME(3) NULL;
```
This later style is **hand-authored SQL written to match Prisma's DDL conventions** (backtick-quoted identifiers, `DECIMAL(65, 30)` for `Decimal` fields, the same `-- CreateTable`/`-- AlterTable` markers, `utf8mb4`/`utf8mb4_unicode_ci` on new tables), not raw tool output — `prisma migrate dev` needs an interactive terminal to confirm the diff it proposes (and to resolve any drift), which isn't available in this headless/agent shell, so migrations are written by hand instead and applied directly. A few of these hand-authored migrations also carry real data changes alongside DDL, e.g.:
- `20260723211343_add_stripe_connect_payouts` backfills `Payment.platformFeeAmount`/`teacherPayoutAmount` for pre-existing rows with a flat 15% rate, explicitly leaving `payoutStatus` at `not_applicable` rather than `pending` because retroactively transferring money for already-completed classes is called out as "a business decision for a later explicit action."
- `20260727122107_add_verification_token_purpose` runs `DELETE FROM VerificationToken` before adding a required `purpose` column, since existing rows had no way to backfill which kind of token they were.

When you touch a migration, match the era's style: if you're extending recent work, keep writing the explanatory `-- AlterTable: Model — why` comment block; don't drop back to bare DDL.

## Adding a new migration

1. Edit `prisma/schema.prisma` first.
2. Write `prisma/migrations/<timestamp>_<description>/migration.sql` by hand, matching the DDL Prisma itself would generate for that schema diff (correct MySQL types — `DECIMAL(65, 30)` for `Decimal`, `DATETIME(3)` for `DateTime`, backtick-quoted identifiers — and the standard section-comment markers). If you're actually somewhere `prisma migrate dev` *can* run interactively (e.g. a real local terminal), prefer letting it generate the file and then add explanatory comments on top, rather than transcribing DDL from scratch.
3. **Never hand-edit an existing migration's `migration.sql` after it has been applied anywhere** (local, prod, or a teammate's machine) — once applied, a migration's checksum is tracked in `_prisma_migrations`; editing it after the fact causes drift errors on any environment that already ran the old version. Add a new migration instead, even for one-line fixes.
4. Apply locally, then to production per the manual step documented in `prisma/README.md` (`prisma migrate deploy` against the DO cluster's `DATABASE_URL` — DigitalOcean App Platform does not run this automatically on deploy).
5. Grep every `prisma.<model>.` call site for the changed model, and check `app/lib/types/*.types.ts` for hand-written types that assume the old shape — neither is derived from the schema automatically.

Do not write a separate README into any individual timestamped migration subfolder — this file is the only one for the whole directory.
