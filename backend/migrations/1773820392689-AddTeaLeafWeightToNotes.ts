import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeaLeafWeightToNotes1773820392689 implements MigrationInterface {
    name = 'AddTeaLeafWeightToNotes1773820392689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notes\` ADD \`teaLeafWeight\` decimal(5,1) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notes\` DROP COLUMN \`teaLeafWeight\``);
    }
}
