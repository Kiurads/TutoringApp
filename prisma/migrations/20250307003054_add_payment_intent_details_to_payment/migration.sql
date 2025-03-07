/*
  Warnings:

  - Added the required column `clientSecret` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intentId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `clientSecret` VARCHAR(191) NOT NULL,
    ADD COLUMN `intentId` VARCHAR(191) NOT NULL;
