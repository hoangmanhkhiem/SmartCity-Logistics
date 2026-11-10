import { MigrationInterface, QueryRunner } from 'typeorm';

export class SurveyCenter1731300000000 implements MigrationInterface {
    name = 'SurveyCenter1731300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`survey_forms\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`code\` varchar(64) NOT NULL,
                \`version\` int NOT NULL DEFAULT 1,
                \`question_map\` json NULL,
                \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                UNIQUE INDEX \`survey_forms_code\` (\`code\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`survey_assignments\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`zone_id\` int NULL,
                \`form_id\` int NULL,
                \`quota\` int NOT NULL DEFAULT 0,
                \`due_date\` datetime(3) NULL,
                \`status\` varchar(16) NOT NULL DEFAULT 'open',
                \`assigned_by\` int NULL,
                \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                INDEX \`survey_assignments_user\` (\`user_id\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`survey_responses\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`form_id\` int NOT NULL,
                \`site_code\` varchar(32) NULL,
                \`organization_id\` int NULL,
                \`zone_id\` int NULL,
                \`latitude\` double NULL,
                \`longitude\` double NULL,
                \`answers_raw\` json NOT NULL,
                \`status\` varchar(16) NOT NULL DEFAULT 'submitted',
                \`reject_reason\` text NULL,
                \`source\` varchar(32) NOT NULL DEFAULT 'survey',
                \`verified\` tinyint NOT NULL DEFAULT 0,
                \`submitted_by\` int NULL,
                \`approved_by\` int NULL,
                \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                INDEX \`survey_responses_form_status\` (\`form_id\`, \`status\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS `survey_responses`');
        await queryRunner.query('DROP TABLE IF EXISTS `survey_assignments`');
        await queryRunner.query('DROP TABLE IF EXISTS `survey_forms`');
    }
}
