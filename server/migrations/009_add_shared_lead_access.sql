-- Migration: Add shared_lead_access table (OPTIONAL)
-- Created: 2025-12-18
-- Description: Track which tenants have accessed which shared leads

CREATE TABLE IF NOT EXISTS shared_lead_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  accessed_by_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  accessed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Access details
  access_type VARCHAR(50) DEFAULT 'view', -- view, export, contact, claim
  access_count INTEGER DEFAULT 1,
  
  -- Timestamps
  first_accessed_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(lead_id, accessed_by_tenant_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shared_lead_access_lead ON shared_lead_access(lead_id);
CREATE INDEX IF NOT EXISTS idx_shared_lead_access_tenant ON shared_lead_access(accessed_by_tenant_id);
CREATE INDEX IF NOT EXISTS idx_shared_lead_access_user ON shared_lead_access(accessed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_lead_access_type ON shared_lead_access(access_type);

-- Comments
COMMENT ON TABLE shared_lead_access IS 'Tracks which tenants have accessed which shared leads';
COMMENT ON COLUMN shared_lead_access.access_type IS 'Type of access: view, export, contact, claim';
COMMENT ON COLUMN shared_lead_access.access_count IS 'Number of times this tenant has accessed this lead';

-- Function to log shared lead access
CREATE OR REPLACE FUNCTION log_shared_lead_access(
  p_lead_id UUID,
  p_tenant_id UUID,
  p_user_id UUID,
  p_access_type VARCHAR(50) DEFAULT 'view'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO shared_lead_access (
    lead_id,
    accessed_by_tenant_id,
    accessed_by_user_id,
    access_type,
    access_count,
    first_accessed_at,
    last_accessed_at
  ) VALUES (
    p_lead_id,
    p_tenant_id,
    p_user_id,
    p_access_type,
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (lead_id, accessed_by_tenant_id) 
  DO UPDATE SET
    access_count = shared_lead_access.access_count + 1,
    last_accessed_at = NOW(),
    accessed_by_user_id = p_user_id,
    access_type = CASE 
      WHEN p_access_type IN ('contact', 'claim') THEN p_access_type
      ELSE shared_lead_access.access_type
    END;
END;
$$ LANGUAGE plpgsql;

-- View for popular shared leads
CREATE OR REPLACE VIEW popular_shared_leads AS
SELECT 
  l.id,
  l.company_name,
  l.segment,
  l.revenue_tkr,
  COUNT(DISTINCT sla.accessed_by_tenant_id) as tenant_views,
  SUM(sla.access_count) as total_views,
  MAX(sla.last_accessed_at) as last_viewed_at
FROM leads l
INNER JOIN shared_lead_access sla ON sla.lead_id = l.id
GROUP BY l.id, l.company_name, l.segment, l.revenue_tkr
ORDER BY total_views DESC;

-- Example usage:
-- SELECT log_shared_lead_access(
--   'lead-id'::UUID,
--   'tenant-id'::UUID,
--   'user-id'::UUID,
--   'view'
-- );
