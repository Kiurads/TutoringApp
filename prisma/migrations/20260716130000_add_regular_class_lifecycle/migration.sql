-- AlterTable
ALTER TABLE `Class` ADD COLUMN `regularClassId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Class_regularClassId_startTime_key` ON `Class`(`regularClassId`, `startTime`);

-- CreateIndex
CREATE INDEX `Class_regularClassId_idx` ON `Class`(`regularClassId`);

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_regularClassId_fkey` FOREIGN KEY (`regularClassId`) REFERENCES `RegularClass`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `RegularClass` ADD COLUMN `lastMaterializedThrough` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `RegularClass` MODIFY `status` ENUM('requested', 'active', 'inactive') NOT NULL DEFAULT 'requested';

-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('class_requested', 'class_accepted', 'class_refused', 'class_cancelled', 'class_claimed', 'class_paid', 'class_completed', 'tier_up', 'rank_up', 'badge_earned', 'gem_received', 'counter_offer_proposed', 'counter_offer_accepted', 'counter_offer_declined', 'refund_requested', 'refund_decided', 'refund_escalated', 'refund_resolved', 'regular_class_requested', 'regular_class_accepted', 'regular_class_refused', 'regular_class_cancelled') NOT NULL;
