-- CreateTable
CREATE TABLE `analytics_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `snapshot_date` DATE NOT NULL,
    `carrier_id` INTEGER NULL,
    `orders_total` INTEGER NOT NULL DEFAULT 0,
    `orders_delivered` INTEGER NOT NULL DEFAULT 0,
    `orders_failed` INTEGER NOT NULL DEFAULT 0,
    `routes_completed` INTEGER NOT NULL DEFAULT 0,
    `total_distance_km` DOUBLE NULL,
    `estimated_co2_grams` DOUBLE NULL,
    `cod_collected_total` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `analytics_snapshots_snapshot_date_carrier_id_key`(`snapshot_date`, `carrier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
