-- Existing VerificationToken rows have no reliable way to backfill purpose:
-- both email-verification and password-reset tokens were created in this
-- same table with no distinguishing field, which is exactly the bug this
-- migration fixes. These are short-lived (1-24h TTL), so clearing pending
-- rows just means any in-flight link needs to be re-requested.
DELETE FROM `VerificationToken`;

-- AlterTable
ALTER TABLE `VerificationToken` ADD COLUMN `purpose` ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET') NOT NULL;
