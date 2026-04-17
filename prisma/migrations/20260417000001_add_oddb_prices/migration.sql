-- AlterTable: add PPUB, PEXF price columns and authStatus to oddb_products
ALTER TABLE "oddb_products" ADD COLUMN IF NOT EXISTS "ppub" DOUBLE PRECISION;
ALTER TABLE "oddb_products" ADD COLUMN IF NOT EXISTS "pexf" DOUBLE PRECISION;
ALTER TABLE "oddb_products" ADD COLUMN IF NOT EXISTS "authStatus" TEXT;
