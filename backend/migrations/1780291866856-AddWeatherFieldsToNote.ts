import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWeatherFieldsToNote1780291866856 implements MigrationInterface {
    name = 'AddWeatherFieldsToNote1780291866856'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notes\` ADD \`weatherTemp\` decimal(4,1) NULL`);
        await queryRunner.query(`ALTER TABLE \`notes\` ADD \`weatherHumidity\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notes\` DROP COLUMN \`weatherHumidity\``);
        await queryRunner.query(`ALTER TABLE \`notes\` DROP COLUMN \`weatherTemp\``);
    }
}
