-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('class_requested', 'class_accepted', 'class_refused', 'class_cancelled', 'class_claimed', 'class_paid', 'class_completed', 'tier_up', 'rank_up', 'badge_earned', 'gem_received', 'counter_offer_proposed', 'counter_offer_accepted', 'counter_offer_declined', 'refund_requested', 'refund_decided', 'refund_escalated', 'refund_resolved') NOT NULL;

-- CreateTable
CREATE TABLE `RefundRequest` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('pending', 'accepted', 'refused', 'expired', 'admin_review', 'resolved') NOT NULL DEFAULT 'pending',
    `adminNote` TEXT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RefundRequest_classId_key`(`classId`),
    INDEX `RefundRequest_status_idx`(`status`),
    INDEX `RefundRequest_studentId_idx`(`studentId`),
    INDEX `RefundRequest_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RefundRequest` ADD CONSTRAINT `RefundRequest_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefundRequest` ADD CONSTRAINT `RefundRequest_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefundRequest` ADD CONSTRAINT `RefundRequest_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
