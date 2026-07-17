-- AlterTable
ALTER TABLE `Class` ADD COLUMN `counterOfferTime` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('class_requested', 'class_accepted', 'class_refused', 'class_cancelled', 'class_claimed', 'class_paid', 'class_completed', 'tier_up', 'rank_up', 'badge_earned', 'gem_received', 'counter_offer_proposed', 'counter_offer_accepted', 'counter_offer_declined') NOT NULL;
