-- CreateEnum
CREATE TYPE "places_status_enum" AS ENUM ('draft', 'pending_review', 'published', 'unpublished');

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "partnerId" UUID,
ADD COLUMN     "publishedAt" TIMESTAMPTZ(6),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "places_status_enum" NOT NULL DEFAULT 'draft';

-- Backfill MVP lifecycle state from legacy boolean.
-- This preserves existing production content visibility after deploy.
UPDATE "places"
SET
  "status" = CASE
    WHEN "isPublished" = TRUE THEN 'published'::"places_status_enum"
    ELSE 'draft'::"places_status_enum"
  END,
  "publishedAt" = CASE
    WHEN "isPublished" = TRUE AND "publishedAt" IS NULL THEN now()
    ELSE "publishedAt"
  END;

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_ownerId_key" ON "partners"("ownerId");

-- CreateIndex
CREATE INDEX "partners_ownerId_idx" ON "partners"("ownerId");

-- CreateIndex
CREATE INDEX "places_status_idx" ON "places"("status");

-- CreateIndex
CREATE INDEX "places_partnerId_idx" ON "places"("partnerId");

-- CreateIndex
CREATE INDEX "users_partnerId_idx" ON "users"("partnerId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
