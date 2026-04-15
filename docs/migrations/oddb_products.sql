-- Migration: Add oddb_products table
-- Run in Supabase SQL editor before deploying feat/oddb
-- Source: download.hin.ch/download/oddb2xml/oddb_product.xml (daily, ~41MB)

CREATE TABLE IF NOT EXISTS oddb_products (
  id              SERIAL PRIMARY KEY,
  gtin            TEXT NOT NULL UNIQUE,
  prodno          TEXT NOT NULL DEFAULT '',
  "bezeichnungDe" TEXT NOT NULL DEFAULT '',
  "atcCode"       TEXT NOT NULL DEFAULT '',
  substanz        TEXT,
  zusammensetzung TEXT,
  "fetchedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oddb_products_gtin ON oddb_products(gtin);
