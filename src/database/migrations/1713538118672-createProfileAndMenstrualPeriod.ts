import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfileAndMenstrualPeriod1713538118672 implements MigrationInterface {
    name = 'CreateProfileAndMenstrualPeriod1713538118672';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "menstrual_period" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" date, "lastMenstruationDate" date, "userId" integer, CONSTRAINT "PK_b32bd6e517cc4aa6fece0497ae3" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "profile" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "height" integer, "weight" double precision, "isMenstrualCycleRegular" boolean NOT NULL DEFAULT true, "menstrualCycleDuration" integer, CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" ADD CONSTRAINT "FK_a75ff939cd6d5cccb5c68ddf321" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" DROP CONSTRAINT "FK_a75ff939cd6d5cccb5c68ddf321"`,
        );
        await queryRunner.query(`DROP TABLE "profile"`);
        await queryRunner.query(`DROP TABLE "menstrual_period"`);
    }
}
