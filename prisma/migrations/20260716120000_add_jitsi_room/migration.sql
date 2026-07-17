-- AlterTable
ALTER TABLE `Class` ADD COLUMN `jitsiRoom` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Class_jitsiRoom_key` ON `Class`(`jitsiRoom`);
