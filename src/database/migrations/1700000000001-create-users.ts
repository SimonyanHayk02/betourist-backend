import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000000001 implements MigrationInterface {
  name = 'CreateUsers1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          CREATE TYPE "users_role_enum" AS ENUM (
            'guest',
            'tourist',
            'verified_tourist',
            'partner',
            'partner_manager',
            'city_moderator',
            'country_moderator',
            'platform_admin',
            'super_admin'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_verificationstatus_enum') THEN
          CREATE TYPE "users_verificationstatus_enum" AS ENUM (
            'unverified',
            'email_verified',
            'phone_verified',
            'identity_verified',
            'business_verified'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_managerroletype_enum') THEN
          CREATE TYPE "users_managerroletype_enum" AS ENUM (
            'manager',
            'analyst',
            'manager_analyst'
          );
        END IF;
      END $$;
    `);

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

        "role" "users_role_enum" NOT NULL DEFAULT 'tourist',
        "verificationStatus" "users_verificationstatus_enum" NOT NULL DEFAULT 'unverified',
        "isActive" boolean NOT NULL DEFAULT true,
        "isSuspended" boolean NOT NULL DEFAULT false,
        "suspendedUntil" timestamptz,

        "cityAssignments" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "countryAssignments" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "partnerId" uuid,
        "managerRoleType" "users_managerroletype_enum",

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
    await queryRunner.query(`DROP TYPE IF EXISTS "users_managerroletype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_verificationstatus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}


