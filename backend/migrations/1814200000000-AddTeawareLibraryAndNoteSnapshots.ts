import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeawareLibraryAndNoteSnapshots1814200000000 implements MigrationInterface {
    name = 'AddTeawareLibraryAndNoteSnapshots1814200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`teaware\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`name\` varchar(60) NOT NULL, \`kind\` varchar(20) NOT NULL, \`imageUrl\` varchar(2048) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, INDEX \`IDX_50230f2d728cf8f504982ad70f\` (\`userId\`, \`deletedAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`notes\` ADD \`teaware\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`teaware\` ADD CONSTRAINT \`FK_f82a7d989772b4d239e6c30bc00\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`teaware\` DROP FOREIGN KEY \`FK_f82a7d989772b4d239e6c30bc00\``);
        await queryRunner.query(`ALTER TABLE \`notes\` DROP COLUMN \`teaware\``);
        await queryRunner.query(`DROP INDEX \`IDX_50230f2d728cf8f504982ad70f\` ON \`teaware\``);
        await queryRunner.query(`DROP TABLE \`teaware\``);
    }

}
