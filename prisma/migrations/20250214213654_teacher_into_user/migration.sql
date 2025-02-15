/*
  Warnings:

  - You are about to drop the `Teacher` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Class` DROP FOREIGN KEY `Class_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `RegularClass` DROP FOREIGN KEY `RegularClass_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `Teacher` DROP FOREIGN KEY `Teacher_userId_fkey`;

-- DropForeignKey
ALTER TABLE `TeacherRating` DROP FOREIGN KEY `TeacherRating_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `TeacherSubject` DROP FOREIGN KEY `TeacherSubject_teacherId_fkey`;

-- DropIndex
DROP INDEX `Class_teacherId_fkey` ON `Class`;

-- DropIndex
DROP INDEX `RegularClass_teacherId_fkey` ON `RegularClass`;

-- DropIndex
DROP INDEX `TeacherRating_teacherId_fkey` ON `TeacherRating`;

-- DropIndex
DROP INDEX `TeacherSubject_teacherId_fkey` ON `TeacherSubject`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `pricePerHour` DECIMAL(65, 30) NULL;

-- DropTable
DROP TABLE `Teacher`;

-- AddForeignKey
ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegularClass` ADD CONSTRAINT `RegularClass_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherRating` ADD CONSTRAINT `TeacherRating_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
