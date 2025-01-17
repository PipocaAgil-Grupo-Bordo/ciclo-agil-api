import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserUniqueConstraintOnProfile1714740471853 implements MigrationInterface {
    name = 'AddUserUniqueConstraintOnProfile1714740471853';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "profile" ADD CONSTRAINT "UQ_a24972ebd73b106250713dcddd9" UNIQUE ("userId")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "profile" DROP CONSTRAINT "UQ_a24972ebd73b106250713dcddd9"`,
        );
    }
}
