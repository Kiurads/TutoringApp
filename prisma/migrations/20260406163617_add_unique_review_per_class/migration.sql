/*
  Warnings:

  - A unique constraint covering the columns `[studentId,classId]` on the table `TeacherRating` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `TeacherRating_studentId_classId_key` ON `TeacherRating`(`studentId`, `classId`);
