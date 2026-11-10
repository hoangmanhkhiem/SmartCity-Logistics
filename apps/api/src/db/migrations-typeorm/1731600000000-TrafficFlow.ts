import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrafficFlow1731600000000 implements MigrationInterface {
    name = 'TrafficFlow1731600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS traffic_probes (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(120) NOT NULL,
                ward varchar(64) NOT NULL,
                latitude double NOT NULL,
                longitude double NOT NULL,
                is_active tinyint NOT NULL DEFAULT 1,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS traffic_samples (
                id int NOT NULL AUTO_INCREMENT,
                probe_id int NOT NULL,
                current_speed double NOT NULL,
                free_flow_speed double NOT NULL,
                travel_time_sec int NOT NULL,
                confidence double NOT NULL DEFAULT 1,
                road_closure tinyint NOT NULL DEFAULT 0,
                source varchar(32) NOT NULL DEFAULT 'survey_fallback',
                sampled_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                PRIMARY KEY (id),
                KEY idx_traffic_sample_probe (probe_id, sampled_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS speed_profiles (
                id int NOT NULL AUTO_INCREMENT,
                probe_id int NOT NULL,
                day_type varchar(16) NOT NULL,
                hour_bucket tinyint NOT NULL,
                median_speed double NOT NULL,
                congestion_factor double NOT NULL,
                sample_count int NOT NULL DEFAULT 0,
                PRIMARY KEY (id),
                UNIQUE KEY uq_speed_profile (probe_id, day_type, hour_bucket)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS traffic_quota (
                id int NOT NULL AUTO_INCREMENT,
                month_key varchar(7) NOT NULL,
                used int NOT NULL DEFAULT 0,
                monthly_limit int NOT NULL DEFAULT 20000,
                PRIMARY KEY (id),
                UNIQUE KEY uq_traffic_quota_month (month_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS traffic_quota`);
        await queryRunner.query(`DROP TABLE IF EXISTS speed_profiles`);
        await queryRunner.query(`DROP TABLE IF EXISTS traffic_samples`);
        await queryRunner.query(`DROP TABLE IF EXISTS traffic_probes`);
    }
}
