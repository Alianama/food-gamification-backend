-- AlterTable
ALTER TABLE `food_history` ADD COLUMN `consumed_at` DATETIME(3) NULL,
    ADD COLUMN `is_consumed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `xp_gained` INTEGER NULL;
