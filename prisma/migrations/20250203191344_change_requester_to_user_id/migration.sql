/*
  Warnings:

  - You are about to drop the column `requestedBy` on the `Class` table. All the data in the column will be lost.
  - Added the required column `requesterId` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Class` DROP COLUMN `requestedBy`,
    ADD COLUMN `requesterId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
