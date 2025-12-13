-- Error Reports Table
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(255),
  error_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  suggested_correction TEXT,
  current_data JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  reported_by UUID NOT NULL,
  tenant_id UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  correction_applied JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_reports_status ON error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_entity ON error_reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_tenant ON error_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_created ON error_reports(created_at DESC);

-- Add anonymization fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS original_tenant_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS anonymized_by UUID;

CREATE INDEX IF NOT EXISTS idx_leads_anonymized ON leads(is_anonymized) WHERE is_anonymized = true;
