-- AlterTable
ALTER TABLE `Class` MODIFY `status` ENUM('requested', 'scheduled', 'completed', 'refused', 'cancelled') NOT NULL DEFAULT 'requested';
