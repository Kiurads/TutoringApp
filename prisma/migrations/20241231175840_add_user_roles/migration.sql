-- AlterTable
ALTER TABLE `User` ADD COLUMN `role` ENUM('admin', 'student', 'teacher') NOT NULL DEFAULT 'student';
