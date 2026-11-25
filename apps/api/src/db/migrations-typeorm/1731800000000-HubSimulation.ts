import { MigrationInterface, QueryRunner } from 'typeorm';

async function addColumn(qr: QueryRunner, table: string, column: string, ddl: string) {
    const rows = await qr.query(
        `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
        [table, column],
    );
    if (Number(rows[0]?.c) === 0) {
        await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
    }
}

export class HubSimulation1731800000000 implements MigrationInterface {
    name = 'HubSimulation1731800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await addColumn(queryRunner, 'facilities', 'hub_tier', '`hub_tier` VARCHAR(16) NULL');
        await addColumn(queryRunner, 'facilities', 'parent_hub_id', '`parent_hub_id` INT NULL');
        await addColumn(queryRunner, 'facilities', 'ward_id', '`ward_id` INT NULL');
        await addColumn(queryRunner, 'facilities', 'capacity_m3', '`capacity_m3` DOUBLE NULL');
        await addColumn(queryRunner, 'facilities', 'capacity_kg', '`capacity_kg` DOUBLE NULL');
        await addColumn(queryRunner, 'facilities', 'data_source', "`data_source` VARCHAR(32) NOT NULL DEFAULT 'SIMULATED'");
        await addColumn(queryRunner, 'facilities', 'source_name', '`source_name` VARCHAR(255) NULL');
        await addColumn(queryRunner, 'facilities', 'source_date', '`source_date` DATE NULL');

        await addColumn(queryRunner, 'vehicles', 'payload_kg', '`payload_kg` DOUBLE NULL');
        await addColumn(queryRunner, 'vehicles', 'cargo_m3', '`cargo_m3` DOUBLE NULL');
        await addColumn(queryRunner, 'vehicles', 'lez_allowed', '`lez_allowed` TINYINT NOT NULL DEFAULT 0');
        await addColumn(queryRunner, 'vehicles', 'co2_g_per_km', '`co2_g_per_km` DOUBLE NULL');
        await addColumn(queryRunner, 'vehicles', 'data_source', "`data_source` VARCHAR(32) NOT NULL DEFAULT 'SIMULATED'");
        await addColumn(queryRunner, 'vehicles', 'source_name', '`source_name` VARCHAR(255) NULL');
        await addColumn(queryRunner, 'vehicles', 'source_date', '`source_date` DATE NULL');

        await addColumn(queryRunner, 'restrictions', 'effective_year', '`effective_year` INT NULL');
        await addColumn(queryRunner, 'restrictions', 'data_source', "`data_source` VARCHAR(32) NOT NULL DEFAULT 'SURVEY'");
        await addColumn(queryRunner, 'restrictions', 'source_name', '`source_name` VARCHAR(255) NULL');
        await addColumn(queryRunner, 'restrictions', 'source_date', '`source_date` DATE NULL');

        await addColumn(queryRunner, 'zones', 'data_source', "`data_source` VARCHAR(32) NOT NULL DEFAULT 'OPEN'");
        await addColumn(queryRunner, 'zones', 'source_name', '`source_name` VARCHAR(255) NULL');
        await addColumn(queryRunner, 'zones', 'source_date', '`source_date` DATE NULL');

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS sim_scenarios (
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                order_count INT NOT NULL DEFAULT 1000,
                seed INT NOT NULL DEFAULT 20251125,
                lez_mode VARCHAR(16) NOT NULL DEFAULT 'none',
                status VARCHAR(16) NOT NULL DEFAULT 'draft',
                published_at DATETIME(3) NULL,
                kpis JSON NULL,
                data_source VARCHAR(32) NOT NULL DEFAULT 'SIMULATED',
                source_name VARCHAR(255) NULL,
                source_date DATE NULL,
                created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS sim_orders (
                id INT NOT NULL AUTO_INCREMENT,
                scenario_id INT NOT NULL,
                organization_id INT NOT NULL,
                pickup_hub_id INT NOT NULL,
                dest_hub_id INT NULL,
                ward_id INT NULL,
                dest_lat DOUBLE NOT NULL,
                dest_lon DOUBLE NOT NULL,
                weight_kg DOUBLE NOT NULL,
                volume_m3 DOUBLE NOT NULL,
                cargo_type VARCHAR(64) NOT NULL DEFAULT 'parcel',
                package_count INT NOT NULL DEFAULT 1,
                created_at_sim DATETIME(3) NOT NULL,
                data_source VARCHAR(32) NOT NULL DEFAULT 'SIMULATED',
                PRIMARY KEY (id),
                KEY idx_sim_order_scenario (scenario_id),
                KEY idx_sim_order_org (organization_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS shipment_legs (
                id INT NOT NULL AUTO_INCREMENT,
                order_id INT NOT NULL,
                leg_no INT NOT NULL,
                from_hub_id INT NULL,
                to_hub_id INT NULL,
                vehicle_id INT NULL,
                vehicle_type VARCHAR(32) NULL,
                route_geom TEXT NULL,
                distance_km DOUBLE NOT NULL DEFAULT 0,
                duration_min DOUBLE NOT NULL DEFAULT 0,
                co2_g DOUBLE NOT NULL DEFAULT 0,
                hour_bucket TINYINT NULL,
                PRIMARY KEY (id),
                KEY idx_leg_order (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS delivery_events (
                id INT NOT NULL AUTO_INCREMENT,
                order_id INT NOT NULL,
                leg_id INT NULL,
                event_type VARCHAR(32) NOT NULL,
                hub_id INT NULL,
                occurred_at DATETIME(3) NOT NULL,
                fail_reason TEXT NULL,
                share_level VARCHAR(16) NOT NULL DEFAULT 'industry',
                PRIMARY KEY (id),
                KEY idx_event_order (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS hub_capacity_snapshots (
                id INT NOT NULL AUTO_INCREMENT,
                hub_id INT NOT NULL,
                used_m3 DOUBLE NOT NULL DEFAULT 0,
                used_kg DOUBLE NOT NULL DEFAULT 0,
                share_level VARCHAR(16) NOT NULL DEFAULT 'industry',
                recorded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                PRIMARY KEY (id),
                KEY idx_hub_cap (hub_id, recorded_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS ward_weights (
                id INT NOT NULL AUTO_INCREMENT,
                scenario_id INT NULL,
                ward_id INT NOT NULL,
                weight DOUBLE NOT NULL DEFAULT 1,
                density_class VARCHAR(16) NOT NULL DEFAULT 'normal',
                PRIMARY KEY (id),
                KEY idx_ward_weight_scenario (scenario_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS segment_delivery_flows (
                id INT NOT NULL AUTO_INCREMENT,
                scenario_id INT NOT NULL,
                segment_id VARCHAR(64) NOT NULL,
                hour TINYINT NOT NULL,
                vehicle_count INT NOT NULL DEFAULT 0,
                geometry TEXT NULL,
                PRIMARY KEY (id),
                KEY idx_flow_scenario_hour (scenario_id, hour)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS traffic_flow_snapshots (
                id INT NOT NULL AUTO_INCREMENT,
                segment_id VARCHAR(64) NOT NULL,
                speed_kmh DOUBLE NULL,
                free_flow_kmh DOUBLE NULL,
                captured_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                data_source VARCHAR(32) NOT NULL DEFAULT 'OPEN',
                PRIMARY KEY (id),
                KEY idx_tfs_seg (segment_id, captured_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS scenario_feedback (
                id INT NOT NULL AUTO_INCREMENT,
                scenario_id INT NOT NULL,
                user_id INT NULL,
                stance VARCHAR(16) NOT NULL DEFAULT 'neutral',
                content TEXT NULL,
                latitude DOUBLE NULL,
                longitude DOUBLE NULL,
                reply TEXT NULL,
                status VARCHAR(16) NOT NULL DEFAULT 'new',
                created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                PRIMARY KEY (id),
                KEY idx_fb_scenario (scenario_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS scenario_feedback');
        await queryRunner.query('DROP TABLE IF EXISTS traffic_flow_snapshots');
        await queryRunner.query('DROP TABLE IF EXISTS segment_delivery_flows');
        await queryRunner.query('DROP TABLE IF EXISTS ward_weights');
        await queryRunner.query('DROP TABLE IF EXISTS hub_capacity_snapshots');
        await queryRunner.query('DROP TABLE IF EXISTS delivery_events');
        await queryRunner.query('DROP TABLE IF EXISTS shipment_legs');
        await queryRunner.query('DROP TABLE IF EXISTS sim_orders');
        await queryRunner.query('DROP TABLE IF EXISTS sim_scenarios');
    }
}
