-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('class_requested', 'class_accepted', 'class_refused', 'class_cancelled', 'class_claimed', 'class_paid', 'class_completed') NOT NULL;
