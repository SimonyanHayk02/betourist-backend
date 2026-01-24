-- CreateIndex
CREATE INDEX "place_media_placeId_sortOrder_idx" ON "place_media"("placeId", "sortOrder");

-- CreateIndex
CREATE INDEX "places_status_isFeatured_updatedAt_idx" ON "places"("status", "isFeatured", "updatedAt");

-- CreateIndex
CREATE INDEX "places_status_cityId_isFeatured_updatedAt_idx" ON "places"("status", "cityId", "isFeatured", "updatedAt");

-- CreateIndex
CREATE INDEX "places_partnerId_status_updatedAt_idx" ON "places"("partnerId", "status", "updatedAt");

-- Ensure geo index exists for nearby city searches (older migration dropped it).
-- Safe to run repeatedly.
CREATE INDEX IF NOT EXISTS "cities_location_gist_idx" ON "cities" USING GIST ("location");
