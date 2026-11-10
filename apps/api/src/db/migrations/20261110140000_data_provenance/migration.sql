-- FR / NFR4.4: source + verified (GĐ1)
ALTER TABLE `zones` ADD COLUMN `source` VARCHAR(32) NOT NULL DEFAULT 'secondary',
ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `facilities` ADD COLUMN `source` VARCHAR(32) NOT NULL DEFAULT 'secondary',
ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `restrictions` ADD COLUMN `source` VARCHAR(32) NOT NULL DEFAULT 'regulation',
ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `orders` ADD COLUMN `source` VARCHAR(32) NOT NULL DEFAULT 'simulated',
ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT true;
