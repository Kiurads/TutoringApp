-- AlterTable: User — tracks when the password last changed, so a session
-- token issued before that moment can be detected as stale and invalidated
-- (see app/lib/auth/session-staleness.ts and auth.ts's jwt callback).
-- Left NULL for existing users: nothing to invalidate retroactively, their
-- current sessions stay valid until they next change/reset their password.
ALTER TABLE `User` ADD COLUMN `passwordChangedAt` DATETIME(3) NULL;
