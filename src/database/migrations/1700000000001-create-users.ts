import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000000001 implements MigrationInterface {
  name = 'CreateUsers1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,

        "email" text,
        "phone" text,
        "passwordHash" text NOT NULL,
        "refreshTokenHash" text,

        "role" text NOT NULL DEFAULT 'tourist',
        "verificationStatus" text NOT NULL DEFAULT 'unverified',
        "isActive" boolean NOT NULL DEFAULT true,
        "isSuspended" boolean NOT NULL DEFAULT false,
        "suspendedUntil" timestamptz,

        "cityAssignments" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "countryAssignments" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "partnerId" uuid,
        "managerRoleType" text,

        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_phone" ON "users" ("phone")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query('DROP EXTENSION IF EXISTS "pgcrypto"');
  }
}


