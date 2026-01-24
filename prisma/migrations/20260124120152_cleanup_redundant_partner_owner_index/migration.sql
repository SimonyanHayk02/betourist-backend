-- DropIndex
-- NOTE: do NOT drop the PostGIS GiST index on cities.location.
-- We only remove the redundant btree index on partners.ownerId because the UNIQUE index already covers it.
DROP INDEX IF EXISTS "partners_ownerId_idx";
