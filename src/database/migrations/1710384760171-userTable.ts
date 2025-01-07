import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTable1710384760171 implements MigrationInterface {
    name = 'UserTable1710384760171';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE TABLE "user" (
          "id" SERIAL PRIMARY KEY,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "name" VARCHAR NOT NULL,
          "email" VARCHAR NOT NULL,
          "password" VARCHAR NOT NULL
        )
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        DROP TABLE "user"
      `);
    }
}
