-- Migration: Add bwl_shortages table
-- Run this in Supabase SQL editor before deploying feat/bwl
-- Column names match Prisma schema (camelCase, no @map overrides)

CREATE TABLE IF NOT EXISTS bwl_shortages (
  id                      SERIAL PRIMARY KEY,
  gtin                    TEXT NOT NULL UNIQUE,
  "atcCode"               TEXT NOT NULL DEFAULT '',
  bezeichnung             TEXT NOT NULL DEFAULT '',
  eintrittsdatum          TEXT,
  "voraussichtlicheDauer" TEXT,
  bemerkungen             TEXT,
  "datumPublikation"      TEXT,
  "letzteAktualisierung"  TEXT,
  "fetchedAt"             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bwl_shortages_gtin ON bwl_shortages(gtin);
