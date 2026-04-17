-- Add ERLOSCHEN value to OffMarketCategory enum
ALTER TYPE "OffMarketCategory" ADD VALUE IF NOT EXISTS 'ERLOSCHEN';
