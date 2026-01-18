-- AlterTable
ALTER TABLE "cities" ADD COLUMN     "heroImageUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "selectedCityId" UUID;

-- CreateIndex
CREATE INDEX "users_selectedCityId_idx" ON "users"("selectedCityId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_selectedCityId_fkey" FOREIGN KEY ("selectedCityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
