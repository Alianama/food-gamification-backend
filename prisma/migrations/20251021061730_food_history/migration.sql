-- CreateTable
CREATE TABLE `character` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `status_name` VARCHAR(191) NOT NULL,
    `health_point` INTEGER NOT NULL DEFAULT 0,
    `xp_point` INTEGER NOT NULL DEFAULT 0,
    `xp_to_next_level` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 0,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `character_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `food_name` VARCHAR(191) NOT NULL,
    `brand_name` VARCHAR(191) NULL,
    `food_description` VARCHAR(191) NULL,
    `food_type` VARCHAR(191) NULL,
    `food_url` VARCHAR(191) NULL,
    `serving_description` VARCHAR(191) NULL,
    `calories` DOUBLE NULL,
    `carbohydrate` DOUBLE NULL,
    `fat` DOUBLE NULL,
    `fiber` DOUBLE NULL,
    `protein` DOUBLE NULL,
    `sodium` DOUBLE NULL,
    `sugar` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `character` ADD CONSTRAINT `character_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_history` ADD CONSTRAINT `food_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
