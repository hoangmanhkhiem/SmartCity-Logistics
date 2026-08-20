-- CreateTable
CREATE TABLE `organizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `business` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `logo_url` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carriers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `operating_zone_ids` JSON NOT NULL,
    `service_type` VARCHAR(191) NOT NULL DEFAULT 'last_mile',
    `contact_name` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(191) NULL,
    `contact_email` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `carrier_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `capacity` DOUBLE NULL,
    `volume` DOUBLE NULL,
    `fuel_type` VARCHAR(191) NULL,
    `is_electric` BOOLEAN NOT NULL DEFAULT false,
    `emission_standard` VARCHAR(191) NULL,
    `emission_factor` DOUBLE NULL,
    `range` DOUBLE NULL,
    `current_battery_level` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehicles_plate_key`(`plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facilities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `zone_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `address` VARCHAR(191) NULL,
    `capacity` INTEGER NULL,
    `opening_time` VARCHAR(191) NULL,
    `closing_time` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chargers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facility_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `connector_type` VARCHAR(191) NULL,
    `power_kw` DOUBLE NOT NULL,
    `slots` INTEGER NOT NULL DEFAULT 1,
    `price_per_kwh` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_pumps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facility_id` INTEGER NOT NULL,
    `fuel_type` VARCHAR(191) NOT NULL,
    `price_per_liter` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `docks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facility_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,
    `capacity` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `boundary` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `road_segments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `zone_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `osm_id` VARCHAR(191) NULL,
    `geometry` TEXT NULL,
    `one_way` BOOLEAN NOT NULL DEFAULT false,
    `speed_limit` DOUBLE NULL,
    `lanes` INTEGER NULL,
    `road_type` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restrictions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `road_segment_id` INTEGER NULL,
    `zone_id` INTEGER NULL,
    `vehicle_type` VARCHAR(191) NULL,
    `vehicle_types` JSON NOT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'restricted',
    `max_weight` DOUBLE NULL,
    `max_height` DOUBLE NULL,
    `time_from` VARCHAR(191) NULL,
    `time_to` VARCHAR(191) NULL,
    `days_of_week` JSON NOT NULL,
    `allowed` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_api_clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `carrier_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `key_prefix` VARCHAR(191) NOT NULL,
    `key_hash` VARCHAR(191) NOT NULL,
    `scopes` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `platform_api_clients_key_hash_key`(`key_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `carrier_id` INTEGER NOT NULL,
    `customer_id` INTEGER NULL,
    `zone_id` INTEGER NULL,
    `order_number` VARCHAR(191) NOT NULL,
    `tracking_no` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `pickup_address` VARCHAR(191) NULL,
    `pickup_lat` DOUBLE NULL,
    `pickup_lon` DOUBLE NULL,
    `pickup_phone` VARCHAR(191) NULL,
    `delivery_address` VARCHAR(191) NULL,
    `delivery_lat` DOUBLE NULL,
    `delivery_lon` DOUBLE NULL,
    `delivery_phone` VARCHAR(191) NULL,
    `weight_kg` DOUBLE NULL,
    `item_count` INTEGER NULL,
    `cod_amount` DOUBLE NULL DEFAULT 0,
    `source_url` VARCHAR(191) NULL,
    `external_ref` VARCHAR(191) NULL,
    `fulfillment_channel` VARCHAR(191) NULL,
    `platform_api_client_id` INTEGER NULL,
    `time_window_start` DATETIME(3) NULL,
    `time_window_end` DATETIME(3) NULL,
    `priority` INTEGER NOT NULL DEFAULT 1,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    UNIQUE INDEX `orders_tracking_no_key`(`tracking_no`),
    INDEX `orders_platform_api_client_id_external_ref_idx`(`platform_api_client_id`, `external_ref`),
    INDEX `orders_carrier_id_status_idx`(`carrier_id`, `status`),
    INDEX `orders_zone_id_status_idx`(`zone_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `carrier_id` INTEGER NOT NULL,
    `vehicle_id` INTEGER NOT NULL,
    `shipper_id` INTEGER NOT NULL,
    `zone_id` INTEGER NULL,
    `code` VARCHAR(191) NOT NULL,
    `shift_date` DATE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'planned',
    `planned_start_at` DATETIME(3) NULL,
    `planned_end_at` DATETIME(3) NULL,
    `actual_start_at` DATETIME(3) NULL,
    `actual_end_at` DATETIME(3) NULL,
    `total_distance_km` DOUBLE NULL,
    `total_duration_min` INTEGER NULL,
    `estimated_co2_grams` DOUBLE NULL,
    `geometry` TEXT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `routes_code_key`(`code`),
    INDEX `routes_carrier_id_shift_date_idx`(`carrier_id`, `shift_date`),
    INDEX `routes_vehicle_id_shift_date_idx`(`vehicle_id`, `shift_date`),
    INDEX `routes_shipper_id_shift_date_idx`(`shipper_id`, `shift_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `route_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `sequence` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `contact_name` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(191) NULL,
    `time_window_start` DATETIME(3) NULL,
    `time_window_end` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `arrived_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `failed_reason` VARCHAR(191) NULL,
    `pod_photo_url` VARCHAR(191) NULL,
    `pod_signature_url` VARCHAR(191) NULL,
    `pod_note` VARCHAR(191) NULL,
    `cod_amount_due` DOUBLE NULL DEFAULT 0,
    `cod_amount_collected` DOUBLE NULL DEFAULT 0,
    `cod_collected` BOOLEAN NOT NULL DEFAULT false,
    `cod_collected_at` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stops_route_id_sequence_idx`(`route_id`, `sequence`),
    INDEX `stops_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `telemetry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_id` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `speed` DOUBLE NULL,
    `heading` DOUBLE NULL,
    `altitude` DOUBLE NULL,
    `battery_level` DOUBLE NULL,
    `fuel_level` DOUBLE NULL,
    `engine_status` VARCHAR(191) NULL,
    `odometer` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `telemetry_vehicle_id_timestamp_idx`(`vehicle_id`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatar_url` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipper_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `carrier_id` INTEGER NOT NULL,
    `license_number` VARCHAR(191) NULL,
    `license_class` VARCHAR(191) NULL,
    `default_zone_id` INTEGER NULL,
    `current_vehicle_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'off_duty',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shipper_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memberships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `memberships_user_id_organization_id_key`(`user_id`, `organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `role_permissions_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `carriers` ADD CONSTRAINT `carriers_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facilities` ADD CONSTRAINT `facilities_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facilities` ADD CONSTRAINT `facilities_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chargers` ADD CONSTRAINT `chargers_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_pumps` ADD CONSTRAINT `fuel_pumps_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `docks` ADD CONSTRAINT `docks_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `road_segments` ADD CONSTRAINT `road_segments_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restrictions` ADD CONSTRAINT `restrictions_road_segment_id_fkey` FOREIGN KEY (`road_segment_id`) REFERENCES `road_segments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restrictions` ADD CONSTRAINT `restrictions_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `platform_api_clients` ADD CONSTRAINT `platform_api_clients_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_platform_api_client_id_fkey` FOREIGN KEY (`platform_api_client_id`) REFERENCES `platform_api_clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_shipper_id_fkey` FOREIGN KEY (`shipper_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stops` ADD CONSTRAINT `stops_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stops` ADD CONSTRAINT `stops_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telemetry` ADD CONSTRAINT `telemetry_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipper_profiles` ADD CONSTRAINT `shipper_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipper_profiles` ADD CONSTRAINT `shipper_profiles_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipper_profiles` ADD CONSTRAINT `shipper_profiles_default_zone_id_fkey` FOREIGN KEY (`default_zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipper_profiles` ADD CONSTRAINT `shipper_profiles_current_vehicle_id_fkey` FOREIGN KEY (`current_vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
