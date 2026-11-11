import { MigrationInterface, QueryRunner } from 'typeorm';

export class DataProvenance1731700000000 implements MigrationInterface {
    name = 'DataProvenance1731700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const col = await queryRunner.query(
            `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'zones' AND column_name = 'source'`,
        );
        if (Number(col[0]?.c) > 0) {
            console.log('[DataProvenance] Column zones.source already exists — skip.');
            return;
        }

        const zones = await queryRunner.query(
            `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'zones'`,
        );
        if (Number(zones[0]?.c) === 0) {
            throw new Error('[DataProvenance] Table zones does not exist — InitialBaseline must run first.');
        }

        await queryRunner.query(`
            ALTER TABLE \`zones\` ADD COLUMN \`source\` VARCHAR(32) NOT NULL DEFAULT 'secondary',
            ADD COLUMN \`verified\` BOOLEAN NOT NULL DEFAULT true
        `);
        await queryRunner.query(`
            ALTER TABLE \`facilities\` ADD COLUMN \`source\` VARCHAR(32) NOT NULL DEFAULT 'secondary',
            ADD COLUMN \`verified\` BOOLEAN NOT NULL DEFAULT true
        `);
        await queryRunner.query(`
            ALTER TABLE \`restrictions\` ADD COLUMN \`source\` VARCHAR(32) NOT NULL DEFAULT 'regulation',
            ADD COLUMN \`verified\` BOOLEAN NOT NULL DEFAULT true
        `);
        await queryRunner.query(`
            ALTER TABLE \`orders\` ADD COLUMN \`source\` VARCHAR(32) NOT NULL DEFAULT 'simulated',
            ADD COLUMN \`verified\` BOOLEAN NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`source\`, DROP COLUMN \`verified\``);
        await queryRunner.query(`ALTER TABLE \`restrictions\` DROP COLUMN \`source\`, DROP COLUMN \`verified\``);
        await queryRunner.query(`ALTER TABLE \`facilities\` DROP COLUMN \`source\`, DROP COLUMN \`verified\``);
        await queryRunner.query(`ALTER TABLE \`zones\` DROP COLUMN \`source\`, DROP COLUMN \`verified\``);
    }
}
