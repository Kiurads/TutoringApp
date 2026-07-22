-- AlterTable: StudentGameProfile — repurpose the never-used streakDays
-- column (weekly, not daily, streak — see schema.prisma) and add supporting
-- fields.
ALTER TABLE `StudentGameProfile` RENAME COLUMN `streakDays` TO `currentStreakWeeks`;
ALTER TABLE `StudentGameProfile` ADD COLUMN `longestStreakWeeks` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `streakFreezes` INTEGER NOT NULL DEFAULT 0;

-- AlterTable: TeacherGameProfile — same weekly-streak mechanic, net new here.
ALTER TABLE `TeacherGameProfile` ADD COLUMN `currentStreakWeeks` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `longestStreakWeeks` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `streakFreezes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastActivityAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `QuestClaim` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questKey` VARCHAR(191) NOT NULL,
    `weekStart` DATETIME(3) NOT NULL,
    `claimedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuestClaim_userId_idx`(`userId`),
    UNIQUE INDEX `QuestClaim_userId_questKey_weekStart_key`(`userId`, `questKey`, `weekStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuestClaim` ADD CONSTRAINT `QuestClaim_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add 2 new NotificationType values (gem_received already existed
-- but was never actually used anywhere — repurposed here for the new
-- variable-reward "Lucky Bonus" event instead of adding yet another value).
ALTER TABLE `Notification` MODIFY COLUMN `type` ENUM(
    'class_requested', 'class_accepted', 'class_refused', 'class_cancelled',
    'class_claimed', 'class_paid', 'class_completed', 'tier_up', 'rank_up',
    'badge_earned', 'gem_received', 'sparks_received', 'streak_saved',
    'counter_offer_proposed', 'counter_offer_accepted', 'counter_offer_declined',
    'refund_requested', 'refund_decided', 'refund_escalated', 'refund_resolved',
    'regular_class_requested', 'regular_class_accepted', 'regular_class_refused',
    'regular_class_cancelled'
) NOT NULL;
