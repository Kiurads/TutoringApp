-- AlterTable
ALTER TABLE `Class` ADD COLUMN `priority` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `StudentGameProfile` ADD COLUMN `ownedFrames` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `priorityBooking` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `studyBoostActive` BOOLEAN NOT NULL DEFAULT false;
