import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameVerificationCodeTable1710472225538 implements MigrationInterface {
    name = 'RenameVerificationCodeTable1710472225538';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "verification_code" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "email" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_d702c086da466e5d25974512d46" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "verification_code"`);
    }
}
