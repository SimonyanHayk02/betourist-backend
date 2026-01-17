-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Extensions (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "users_role_enum" AS ENUM ('guest', 'tourist', 'verified_tourist', 'partner', 'partner_manager', 'city_moderator', 'country_moderator', 'platform_admin', 'super_admin');

-- CreateEnum
CREATE TYPE "users_verificationstatus_enum" AS ENUM ('unverified', 'email_verified', 'phone_verified', 'identity_verified', 'business_verified');

-- CreateEnum
CREATE TYPE "users_managerroletype_enum" AS ENUM ('manager', 'analyst', 'manager_analyst');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "role" "users_role_enum" NOT NULL DEFAULT 'tourist',
    "verificationStatus" "users_verificationstatus_enum" NOT NULL DEFAULT 'unverified',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedUntil" TIMESTAMPTZ(6),
    "cityAssignments" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "countryAssignments" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "partnerId" UUID,
    "managerRoleType" "users_managerroletype_enum",

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
