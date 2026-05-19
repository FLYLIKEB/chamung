import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSelfFollowCheckConstraint1772900000001 implements MigrationInterface {
  name = 'AddSelfFollowCheckConstraint1772900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existingConstraints = await queryRunner.query(`
      SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'follows'
        AND CONSTRAINT_NAME = 'chk_no_self_follow'
        AND CONSTRAINT_TYPE = 'CHECK'
      LIMIT 1
    `);

    if (existingConstraints.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`follows\`
          ADD CONSTRAINT \`chk_no_self_follow\` CHECK (\`followerId\` <> \`followingId\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existingConstraints = await queryRunner.query(`
      SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'follows'
        AND CONSTRAINT_NAME = 'chk_no_self_follow'
        AND CONSTRAINT_TYPE = 'CHECK'
      LIMIT 1
    `);

    if (existingConstraints.length > 0) {
      await queryRunner.query(`
        ALTER TABLE \`follows\`
          DROP CHECK \`chk_no_self_follow\`
      `);
    }
  }
}
