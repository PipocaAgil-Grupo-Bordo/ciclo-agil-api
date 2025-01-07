import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserProfile1729257910699 implements MigrationInterface {
    name = 'UpdateUserProfile1729257910699';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "initialPeriodDate" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "initialPeriodDate"`);
    }
}
