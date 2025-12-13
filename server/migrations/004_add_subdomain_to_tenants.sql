-- Migration: Add subdomain to tenants
-- Date: 2024-12-12
-- Description: Lägger till subdomain-fält för tenant-specifika subdomäner

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
