/*
  Warnings:

  - You are about to drop the column `clientSecret` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `clientSecret`;
