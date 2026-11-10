import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrgPartnerFlags1731500000000 implements MigrationInterface {
    name = 'OrgPartnerFlags1731500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const cols = await queryRunner.query(
            `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizations'`,
        );
        const names = new Set((cols as Array<{ name: string }>).map((c) => c.name));
        if (!names.has('is_partner')) {
            await queryRunner.query(`ALTER TABLE organizations ADD COLUMN is_partner tinyint NOT NULL DEFAULT 0`);
        }
        if (!names.has('anonymize_public')) {
            await queryRunner.query(`ALTER TABLE organizations ADD COLUMN anonymize_public tinyint NOT NULL DEFAULT 1`);
        }
        if (!names.has('fleet_size')) {
            await queryRunner.query(`ALTER TABLE organizations ADD COLUMN fleet_size int NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE organizations DROP COLUMN fleet_size`);
        await queryRunner.query(`ALTER TABLE organizations DROP COLUMN anonymize_public`);
        await queryRunner.query(`ALTER TABLE organizations DROP COLUMN is_partner`);
    }
}
