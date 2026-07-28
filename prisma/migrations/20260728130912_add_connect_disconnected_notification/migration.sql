-- AlterTable: Notification — new type for a teacher disconnecting their
-- Stripe Connect account (see app/api/webhooks/stripe/route.ts's
-- account.application.deauthorized handler)
ALTER TABLE `Notification` MODIFY COLUMN `type` ENUM(
    'class_requested', 'class_accepted', 'class_refused', 'class_cancelled',
    'class_claimed', 'class_paid', 'class_completed', 'tier_up', 'rank_up',
    'badge_earned', 'gem_received', 'sparks_received', 'streak_saved',
    'counter_offer_proposed', 'counter_offer_accepted', 'counter_offer_declined',
    'refund_requested', 'refund_decided', 'refund_escalated', 'refund_resolved',
    'regular_class_requested', 'regular_class_accepted', 'regular_class_refused',
    'regular_class_cancelled', 'regular_class_payment_failed', 'payout_sent',
    'payout_reversed', 'connect_disconnected'
) NOT NULL;
