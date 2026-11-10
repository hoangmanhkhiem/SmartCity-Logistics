import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformModules1731400000000 implements MigrationInterface {
    name = 'PlatformModules1731400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS emission_factors (
            id int NOT NULL AUTO_INCREMENT,
            vehicle_type varchar(64) NOT NULL,
            fuel_type varchar(64) NOT NULL,
            g_co2e_per_km decimal(8,2) NOT NULL,
            source_ref varchar(255) NULL,
            created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS issue_reports (
            id int NOT NULL AUTO_INCREMENT,
            reporter_hash char(64) NOT NULL,
            issue_type varchar(32) NOT NULL,
            latitude double NOT NULL,
            longitude double NOT NULL,
            zone_id int NULL,
            note text NULL,
            status varchar(16) NOT NULL DEFAULT 'new',
            created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS plans (
            id int NOT NULL AUTO_INCREMENT,
            organization_id int NULL,
            solver_params json NULL,
            status varchar(16) NOT NULL DEFAULT 'done',
            objective_value double NULL,
            runtime_ms int NULL,
            result json NULL,
            created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS scenarios (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            kind varchar(16) NOT NULL DEFAULT 'policy',
            changes json NULL,
            kpis json NULL,
            created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS jobs (
            id int NOT NULL AUTO_INCREMENT,
            type varchar(64) NOT NULL,
            status varchar(16) NOT NULL DEFAULT 'done',
            result json NULL,
            created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS demand_agg (
            id int NOT NULL AUTO_INCREMENT,
            organization_id int NULL,
            zone_id int NOT NULL,
            hour_bucket datetime(3) NOT NULL,
            order_type varchar(32) NOT NULL,
            order_count int NOT NULL DEFAULT 0,
            updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            UNIQUE KEY demand_agg_key (organization_id, zone_id, hour_bucket, order_type),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const t of ['demand_agg', 'jobs', 'scenarios', 'plans', 'issue_reports', 'emission_factors']) {
            await queryRunner.query(`DROP TABLE IF EXISTS \`${t}\``);
        }
    }
}
