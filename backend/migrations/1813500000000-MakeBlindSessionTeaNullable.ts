import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeBlindSessionTeaNullable1813500000000 implements MigrationInterface {
  name = 'MakeBlindSessionTeaNullable1813500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`blind_tasting_sessions\`
        MODIFY COLUMN \`teaId\` INT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`blind_tasting_sessions\`
        MODIFY COLUMN \`teaId\` INT NOT NULL
    `);
  }
}
