import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameBirthdate1710950218258 implements MigrationInterface {
    name = 'RenameBirthdate1710950218258';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "birthday" TO "birthdate"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "birthdate" TO "birthday"`);
    }
}
