import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBirthday1710938298282 implements MigrationInterface {
    name = 'AddUserBirthday1710938298282';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "birthday" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "birthday"`);
    }
}
