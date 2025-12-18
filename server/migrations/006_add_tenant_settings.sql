-- Migration: Add tenant_settings table
-- Created: 2025-12-18
-- Description: Tenant-specific settings for primary carrier, lead sharing preferences, etc.

CREATE TABLE IF NOT EXISTS tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Carrier settings
  primary_carrier VARCHAR(50) DEFAULT 'DHL',
  competitor_carriers TEXT[] DEFAULT ARRAY['PostNord', 'Bring', 'Schenker'],
  show_competitors BOOLEAN DEFAULT TRUE,
  
  -- Lead pool preferences
  share_leads_enabled BOOLEAN DEFAULT TRUE,
  accept_shared_leads BOOLEAN DEFAULT TRUE,
  preferred_segments TEXT[] DEFAULT ARRAY['E-handel', 'Detaljhandel', 'Grossist'],
  preferred_regions TEXT[],
  preferred_sni_codes TEXT[],
  min_revenue_tkr INTEGER DEFAULT 0,
  max_revenue_tkr INTEGER,
  
  -- Notification settings
  notify_new_shared_leads BOOLEAN DEFAULT TRUE,
  notify_quota_warning BOOLEAN DEFAULT TRUE,
  notify_quota_threshold INTEGER DEFAULT 80, -- Notify at 80% quota
  
  -- Scraping settings
  scraping_timeout_seconds INTEGER DEFAULT 30,
  scraping_retry_attempts INTEGER DEFAULT 3,
  enable_deep_analysis BOOLEAN DEFAULT TRUE,
  
  -- API preferences
  preferred_llm_provider VARCHAR(50) DEFAULT 'gemini',
  fallback_llm_provider VARCHAR(50) DEFAULT 'groq',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);

-- Comments
COMMENT ON TABLE tenant_settings IS 'Tenant-specific configuration and preferences';
COMMENT ON COLUMN tenant_settings.primary_carrier IS 'Primary shipping carrier for this tenant (e.g., DHL, PostNord)';
COMMENT ON COLUMN tenant_settings.share_leads_enabled IS 'Whether this tenant shares leads to the shared pool';
COMMENT ON COLUMN tenant_settings.accept_shared_leads IS 'Whether this tenant can see shared leads from other tenants';

-- Create default settings for existing tenants
INSERT INTO tenant_settings (tenant_id, primary_carrier)
SELECT id, checkout_search_term
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_settings)
ON CONFLICT (tenant_id) DO NOTHING;
