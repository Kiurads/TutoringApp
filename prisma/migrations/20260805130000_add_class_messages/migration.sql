-- AlterTable: Notification — new type for a message sent on a class's thread
-- (see app/lib/actions/messages.actions.ts)
ALTER TABLE `Notification` MODIFY COLUMN `type` ENUM(
    'class_requested', 'class_accepted', 'class_refused', 'class_cancelled',
    'class_claimed', 'class_paid', 'class_completed', 'tier_up', 'rank_up',
    'badge_earned', 'gem_received', 'sparks_received', 'streak_saved',
    'counter_offer_proposed', 'counter_offer_accepted', 'counter_offer_declined',
    'refund_requested', 'refund_decided', 'refund_escalated', 'refund_resolved',
    'regular_class_requested', 'regular_class_accepted', 'regular_class_refused',
    'regular_class_cancelled', 'regular_class_payment_failed',
    'regular_class_requires_action', 'payout_sent', 'payout_reversed',
    'connect_disconnected', 'message_received'
) NOT NULL;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_classId_createdAt_idx`(`classId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
