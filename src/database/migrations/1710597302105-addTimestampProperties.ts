import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestampProperties1710597302105 implements MigrationInterface {
    name = 'AddTimestampProperties1710597302105';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "validation_code"`);
        await queryRunner.query(
            `ALTER TABLE "verification_code" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "verification_code" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "validation_code" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "email" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_fefcbba81f8a328e2e2927d5411" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "verification_code" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "verification_code" DROP COLUMN "created_at"`);
    }
}
