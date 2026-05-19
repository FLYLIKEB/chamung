import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlindRoundTables1805000000001 implements MigrationInterface {
  name = 'CreateBlindRoundTables1805000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`blind_session_rounds\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`sessionId\` INT NOT NULL,
        \`teaId\` INT NOT NULL,
        \`roundOrder\` INT NOT NULL,
        \`status\` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`startedAt\` DATETIME NULL,
        \`completedAt\` DATETIME NULL,
        INDEX \`IDX_blind_session_rounds_sessionId\` (\`sessionId\`),
        INDEX \`IDX_blind_session_rounds_teaId\` (\`teaId\`),
        CONSTRAINT \`FK_blind_session_rounds_sessionId\`
          FOREIGN KEY (\`sessionId\`) REFERENCES \`blind_tasting_sessions\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_blind_session_rounds_teaId\`
          FOREIGN KEY (\`teaId\`) REFERENCES \`teas\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`blind_session_participant_notes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`participantId\` INT NOT NULL,
        \`roundId\` INT NOT NULL,
        \`noteId\` INT NULL,
        \`submittedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`IDX_blind_session_participant_notes_participantId\` (\`participantId\`),
        INDEX \`IDX_blind_session_participant_notes_roundId\` (\`roundId\`),
        INDEX \`IDX_blind_session_participant_notes_noteId\` (\`noteId\`),
        CONSTRAINT \`FK_blind_session_participant_notes_participantId\`
          FOREIGN KEY (\`participantId\`) REFERENCES \`blind_session_participants\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_blind_session_participant_notes_roundId\`
          FOREIGN KEY (\`roundId\`) REFERENCES \`blind_session_rounds\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_blind_session_participant_notes_noteId\`
          FOREIGN KEY (\`noteId\`) REFERENCES \`notes\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`blind_session_participant_notes\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`blind_session_rounds\``);
  }
}
