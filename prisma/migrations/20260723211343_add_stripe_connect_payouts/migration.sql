-- AlterTable: User — Stripe Connect account identity/status for teacher payouts
ALTER TABLE `User`
    ADD COLUMN `stripeConnectAccountId` VARCHAR(191) NULL,
    ADD COLUMN `connectStatus` ENUM('not_started', 'pending', 'restricted', 'active') NOT NULL DEFAULT 'not_started',
    ADD COLUMN `connectChargesEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `connectPayoutsEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `connectDetailsSubmitted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `connectUpdatedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `User_stripeConnectAccountId_key` ON `User`(`stripeConnectAccountId`);

-- AlterTable: Payment — commission split (computed once at charge time) and
-- payout tracking (mutated later, at class-completion time)
ALTER TABLE `Payment`
    ADD COLUMN `platformFeeAmount` DECIMAL(65, 30) NULL,
    ADD COLUMN `teacherPayoutAmount` DECIMAL(65, 30) NULL,
    ADD COLUMN `platformFeeRateBps` INTEGER NULL,
    ADD COLUMN `payoutStatus` ENUM('not_applicable', 'pending', 'transferred', 'failed') NOT NULL DEFAULT 'not_applicable',
    ADD COLUMN `transferId` VARCHAR(191) NULL,
    ADD COLUMN `payoutAttemptedAt` DATETIME(3) NULL,
    ADD COLUMN `payoutError` TEXT NULL;

CREATE INDEX `Payment_payoutStatus_idx` ON `Payment`(`payoutStatus`);

-- Backfill: existing Payment rows predate the commission split entirely — a
-- single flat 15% is applied retroactively so historical data is queryable
-- the same way going forward. payoutStatus stays 'not_applicable' (not
-- 'pending') deliberately: retroactively transferring money for classes that
-- already happened, under a rate that didn't exist when the student was
-- charged, is a business decision for a later explicit action, not something
-- this migration should trigger.
UPDATE `Payment`
SET `platformFeeAmount` = ROUND(`amount` * 0.15, 2),
    `teacherPayoutAmount` = `amount` - ROUND(`amount` * 0.15, 2),
    `platformFeeRateBps` = 1500
WHERE `platformFeeAmount` IS NULL;

-- AlterTable: Notification — new payout_sent notification type
ALTER TABLE `Notification` MODIFY COLUMN `type` ENUM(
    'class_requested', 'class_accepted', 'class_refused', 'class_cancelled',
    'class_claimed', 'class_paid', 'class_completed', 'tier_up', 'rank_up',
    'badge_earned', 'gem_received', 'sparks_received', 'streak_saved',
    'counter_offer_proposed', 'counter_offer_accepted', 'counter_offer_declined',
    'refund_requested', 'refund_decided', 'refund_escalated', 'refund_resolved',
    'regular_class_requested', 'regular_class_accepted', 'regular_class_refused',
    'regular_class_cancelled', 'payout_sent'
) NOT NULL;
