import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateValidationCodeTable1710469276726 implements MigrationInterface {
    name = 'CreateValidationCodeTable1710469276726';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "validation_code" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "email" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_fefcbba81f8a328e2e2927d5411" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "validation_code"`);
    }
}
