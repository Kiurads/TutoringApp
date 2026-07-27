-- AlterTable: User — saved card for off-session charging of recurring class
-- occurrences (see app/lib/regular-classes/materialize-occurrences.ts)
ALTER TABLE `User`
    ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL,
    ADD COLUMN `defaultPaymentMethodId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `User_stripeCustomerId_key` ON `User`(`stripeCustomerId`);

-- AlterTable: Notification — new type for a failed/missing recurring-class charge
ALTER TABLE `Notification` MODIFY COLUMN `type` ENUM(
    'class_requested', 'class_accepted', 'class_refused', 'class_cancelled',
    'class_claimed', 'class_paid', 'class_completed', 'tier_up', 'rank_up',
    'badge_earned', 'gem_received', 'sparks_received', 'streak_saved',
    'counter_offer_proposed', 'counter_offer_accepted', 'counter_offer_declined',
    'refund_requested', 'refund_decided', 'refund_escalated', 'refund_resolved',
    'regular_class_requested', 'regular_class_accepted', 'regular_class_refused',
    'regular_class_cancelled', 'regular_class_payment_failed', 'payout_sent'
) NOT NULL;
