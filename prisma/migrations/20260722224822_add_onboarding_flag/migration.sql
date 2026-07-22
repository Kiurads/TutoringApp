-- AlterTable
ALTER TABLE `User` ADD COLUMN `hasCompletedOnboarding` BOOLEAN NOT NULL DEFAULT false;

-- Backfill: this app already has real users before this column existed —
-- without this, every existing account would suddenly see a "first login"
-- tour next time they sign in. Only genuinely new registrations after this
-- migration should start at false.
UPDATE `User` SET `hasCompletedOnboarding` = true;
