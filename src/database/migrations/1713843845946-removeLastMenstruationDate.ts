import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLastMenstruationDate1713843845946 implements MigrationInterface {
    name = 'RemoveLastMenstruationDate1713843845946';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" DROP COLUMN "lastMenstruationDate"`,
        );
        await queryRunner.query(`ALTER TABLE "profile" ADD "userId" integer NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" DROP CONSTRAINT "FK_a75ff939cd6d5cccb5c68ddf321"`,
        );
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" ALTER COLUMN "userId" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" ADD CONSTRAINT "FK_a75ff939cd6d5cccb5c68ddf321" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" DROP CONSTRAINT "FK_a75ff939cd6d5cccb5c68ddf321"`,
        );
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" ALTER COLUMN "userId" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "menstrual_period" ADD CONSTRAINT "FK_a75ff939cd6d5cccb5c68ddf321" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "menstrual_period" ADD "lastMenstruationDate" date`);
    }
}
