-- Migration 010: Lead Storage & Auto-Refresh System
-- Adds support for tenant lead storage, shared pool, and automatic refresh

-- ============================================================================
-- 1. ADD COLUMNS TO LEADS TABLE
-- ============================================================================

-- Add last_analyzed_at for tracking when analysis was performed
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP DEFAULT NOW();

-- Add is_shared flag for shared pool leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Add analysis_version for tracking analysis iterations
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS analysis_version INTEGER DEFAULT 1;

-- Add source_tenant_id to track original tenant (for shared leads)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS source_tenant_id UUID REFERENCES tenants(id);

COMMENT ON COLUMN leads.last_analyzed_at IS 'Timestamp of last AI analysis';
COMMENT ON COLUMN leads.is_shared IS 'Whether this lead is available in shared pool';
COMMENT ON COLUMN leads.analysis_version IS 'Version number of analysis (increments on refresh)';
COMMENT ON COLUMN leads.source_tenant_id IS 'Original tenant that created this lead';

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leads_last_analyzed ON leads(last_analyzed_at);
CREATE INDEX IF NOT EXISTS idx_leads_shared ON leads(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_leads_tenant_analyzed ON leads(tenant_id, last_analyzed_at);
CREATE INDEX IF NOT EXISTS idx_leads_company_tenant ON leads(company_name, tenant_id);

-- ============================================================================
-- 3. CREATE SYSTEM_SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  data_type VARCHAR(50) DEFAULT 'string', -- string, integer, boolean, json
  category VARCHAR(100) DEFAULT 'general',
  is_public BOOLEAN DEFAULT false, -- Can non-admin users see this?
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON COLUMN system_settings.setting_key IS 'Unique identifier for setting';
COMMENT ON COLUMN system_settings.data_type IS 'Data type for validation';
COMMENT ON COLUMN system_settings.is_public IS 'Whether setting is visible to non-admins';

-- ============================================================================
-- 4. INSERT DEFAULT SYSTEM SETTINGS
-- ============================================================================

INSERT INTO system_settings (setting_key, setting_value, description, data_type, category, is_public)
VALUES 
  ('lead_refresh_interval_months', '6', 'Number of months before lead analysis is automatically refreshed', 'integer', 'analysis', false),
  ('auto_refresh_enabled', 'true', 'Enable automatic refresh of old analyses', 'boolean', 'analysis', false),
  ('shared_pool_enabled', 'true', 'Enable shared lead pool across tenants', 'boolean', 'sharing', false),
  ('max_analysis_age_days', '180', 'Maximum age of analysis before requiring refresh (days)', 'integer', 'analysis', false),
  ('enable_lead_caching', 'true', 'Cache lead data to reduce API calls', 'boolean', 'performance', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 5. CREATE CUSTOMERS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  org_number VARCHAR(50),
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Sweden',
  customer_status VARCHAR(50) DEFAULT 'prospect', -- prospect, active, inactive, lost
  customer_since DATE,
  annual_contract_value DECIMAL(12,2),
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id), -- Link to original lead
  last_contacted_at TIMESTAMP,
  next_followup_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

COMMENT ON TABLE customers IS 'Converted customers from leads';
COMMENT ON COLUMN customers.customer_status IS 'Current status: prospect, active, inactive, lost';
COMMENT ON COLUMN customers.lead_id IS 'Reference to original lead that was converted';

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_lead ON customers(lead_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);

-- ============================================================================
-- 6. CREATE LEAD_SEARCH_CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  search_query VARCHAR(500) NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  search_count INTEGER DEFAULT 1,
  first_searched_at TIMESTAMP DEFAULT NOW(),
  last_searched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, search_query)
);

COMMENT ON TABLE lead_search_cache IS 'Cache of lead searches to avoid duplicate API calls';

CREATE INDEX IF NOT EXISTS idx_search_cache_tenant ON lead_search_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_search_cache_query ON lead_search_cache(search_query);

-- ============================================================================
-- 7. CREATE FUNCTIONS FOR LEAD MANAGEMENT
-- ============================================================================

-- Function to check if lead needs refresh
CREATE OR REPLACE FUNCTION check_lead_needs_refresh(
  p_lead_id UUID,
  p_refresh_interval_months INTEGER DEFAULT 6
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_analyzed TIMESTAMP;
  v_needs_refresh BOOLEAN;
BEGIN
  SELECT last_analyzed_at INTO v_last_analyzed
  FROM leads
  WHERE id = p_lead_id;
  
  IF v_last_analyzed IS NULL THEN
    RETURN true;
  END IF;
  
  v_needs_refresh := (NOW() - v_last_analyzed) > (p_refresh_interval_months || ' months')::INTERVAL;
  
  RETURN v_needs_refresh;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_lead_needs_refresh IS 'Check if a lead analysis needs to be refreshed based on age';

-- Function to update lead analysis timestamp
CREATE OR REPLACE FUNCTION update_lead_analysis(
  p_lead_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE leads
  SET 
    last_analyzed_at = NOW(),
    analysis_version = analysis_version + 1,
    updated_at = NOW()
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_lead_analysis IS 'Update lead analysis timestamp and increment version';

-- Function to get tenant leads with refresh status
CREATE OR REPLACE FUNCTION get_tenant_leads_with_refresh_status(
  p_tenant_id UUID,
  p_refresh_interval_months INTEGER DEFAULT 6
)
RETURNS TABLE (
  lead_id UUID,
  company_name VARCHAR,
  last_analyzed_at TIMESTAMP,
  needs_refresh BOOLEAN,
  days_since_analysis INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.company_name,
    l.last_analyzed_at,
    (NOW() - l.last_analyzed_at) > (p_refresh_interval_months || ' months')::INTERVAL AS needs_refresh,
    EXTRACT(DAY FROM (NOW() - l.last_analyzed_at))::INTEGER AS days_since_analysis
  FROM leads l
  WHERE l.tenant_id = p_tenant_id
  ORDER BY l.last_analyzed_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_tenant_leads_with_refresh_status IS 'Get all tenant leads with refresh status';

-- ============================================================================
-- 8. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to customers table
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to system_settings table
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. UPDATE EXISTING LEADS
-- ============================================================================

-- Set source_tenant_id for existing leads
UPDATE leads
SET source_tenant_id = tenant_id
WHERE source_tenant_id IS NULL AND tenant_id IS NOT NULL;

-- Set last_analyzed_at for existing leads (use created_at as fallback)
UPDATE leads
SET last_analyzed_at = COALESCE(last_analyzed_at, created_at, NOW())
WHERE last_analyzed_at IS NULL;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions on new tables (adjust role names as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON lead_search_cache TO app_user;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 010 completed successfully';
  RAISE NOTICE 'Added lead storage and auto-refresh functionality';
  RAISE NOTICE 'Created system_settings, customers, and lead_search_cache tables';
  RAISE NOTICE 'Added indexes and functions for lead management';
END $$;
