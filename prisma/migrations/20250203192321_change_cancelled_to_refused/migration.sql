/*
  Warnings:

  - The values [cancelled] on the enum `Class_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Class` MODIFY `status` ENUM('requested', 'scheduled', 'completed', 'refused') NOT NULL DEFAULT 'requested';
