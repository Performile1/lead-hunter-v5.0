-- Error Reports Table
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('lead', 'customer')),
  entity_id UUID NOT NULL,
  entity_name VARCHAR(255),
  error_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  suggested_correction TEXT,
  current_data JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'corrected')),
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  correction_applied JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_error_reports_status ON error_reports(status);
CREATE INDEX idx_error_reports_entity ON error_reports(entity_type, entity_id);
CREATE INDEX idx_error_reports_tenant ON error_reports(tenant_id);
CREATE INDEX idx_error_reports_created ON error_reports(created_at DESC);

-- Add anonymization fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS original_tenant_id UUID REFERENCES tenants(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS anonymized_by UUID REFERENCES users(id);

-- Add index for anonymized leads
CREATE INDEX IF NOT EXISTS idx_leads_anonymized ON leads(is_anonymized) WHERE is_anonymized = true;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON error_reports TO dhl_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dhl_app;
