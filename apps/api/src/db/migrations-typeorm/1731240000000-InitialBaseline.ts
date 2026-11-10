import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const PRISMA_MIGRATION_DIRS = [
    '20260820070528_redesign_last_mile_saas',
    '20260820080513_add_analytics_snapshot',
    '20260820094043_widen_restriction_description',
    '20260930011512_add_carrier_fee_fields',
];

export class InitialBaseline1731240000000 implements MigrationInterface {
    name = 'InitialBaseline1731240000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const existing = await queryRunner.query(
            `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'organizations'`,
        );
        if (Number(existing[0]?.c) > 0) {
            console.log('[InitialBaseline] Table organizations already exists — skipping Prisma DDL (legacy DB).');
            return;
        }

        const legacyRoot = path.join(__dirname, '..', 'migrations');
        for (const dir of PRISMA_MIGRATION_DIRS) {
            const file = path.join(legacyRoot, dir, 'migration.sql');
            if (!fs.existsSync(file)) continue;
            const sql = fs.readFileSync(file, 'utf8');
            for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
                await queryRunner.query(stmt);
            }
        }
        console.log('[InitialBaseline] Applied consolidated Prisma SQL baseline.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('[InitialBaseline] down() is a no-op — drop schema manually if needed.');
    }
}
