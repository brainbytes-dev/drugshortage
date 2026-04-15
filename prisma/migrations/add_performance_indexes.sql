-- ✅ Add indexes for frequently filtered/sorted columns

-- Index for active shortages (most common filter)
CREATE INDEX IF NOT EXISTS "idx_shortage_isActive" ON "Shortage"("isActive") WHERE "isActive" = true;

-- Composite index for firma filtering (used in firma dropdown + filters)
CREATE INDEX IF NOT EXISTS "idx_shortage_firma_active" ON "Shortage"("firma", "isActive") WHERE "isActive" = true;

-- Composite index for ATC code filtering
CREATE INDEX IF NOT EXISTS "idx_shortage_atc_active" ON "Shortage"("atcCode", "isActive") WHERE "isActive" = true;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS "idx_shortage_status_active" ON "Shortage"("statusCode", "isActive") WHERE "isActive" = true;

-- Index for sorting by days since report (most common sort)
CREATE INDEX IF NOT EXISTS "idx_shortage_days_active" ON "Shortage"("tageSeitMeldung" DESC, "isActive") WHERE "isActive" = true;

-- Index for GTIN lookups (alternatives API)
CREATE INDEX IF NOT EXISTS "idx_alternatives_cache_gtin" ON "AlternativesCache"("gtin");

-- Index for scrape run queries
CREATE INDEX IF NOT EXISTS "idx_scrape_run_status_date" ON "ScrapeRun"("status", "scrapedAt" DESC);

-- ✅ Full-text search index for designation search
CREATE INDEX IF NOT EXISTS "idx_shortage_bezeichnung_trgm" ON "Shortage" USING gin ("bezeichnung" gin_trgm_ops);

-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ✅ Composite index for common query pattern (active + sorting)
CREATE INDEX IF NOT EXISTS "idx_shortage_query_perf"
ON "Shortage"("isActive", "tageSeitMeldung" DESC, "firma", "atcCode", "statusCode")
WHERE "isActive" = true;
