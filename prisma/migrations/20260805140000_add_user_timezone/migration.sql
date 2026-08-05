-- AlterTable: User — IANA timezone a teacher's TeacherAvailability slots are
-- stored in (see app/lib/availability/check-availability.ts). Defaults every
-- existing row to the app's primary market rather than leaving it unset.
ALTER TABLE `User` ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'Europe/Lisbon';
