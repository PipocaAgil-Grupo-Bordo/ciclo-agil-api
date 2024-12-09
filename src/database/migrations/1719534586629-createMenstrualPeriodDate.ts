import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMenstrualPeriodDate1719534586629 implements MigrationInterface {
    name = 'CreateMenstrualPeriodDate1719534586629';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "menstrual_period_date" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "date" date NOT NULL,
            "menstrualPeriodId" integer NOT NULL,
            CONSTRAINT "PK_996af91a3ae642dff49168f4f60" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(
            `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" ADD COLUMN IF NOT EXISTS "lastDate" date`,
        );
        await queryRunner.query(
            `ALTER TABLE "menstrual_period_date" ADD CONSTRAINT "FK_2ca120b67d8b2d36bf3f76d79e1" FOREIGN KEY ("menstrualPeriodId") REFERENCES "menstrual_period"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "menstrual_period_date" DROP CONSTRAINT "FK_2ca120b67d8b2d36bf3f76d79e1"`,
        );
        await queryRunner.query(`ALTER TABLE "menstrual_period" DROP COLUMN IF EXISTS "lastDate"`);
        await queryRunner.query(`DROP TABLE "menstrual_period_date"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "created_at"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "updated_at"`);
    }
}
