-- Migration: Add audit_logs table
-- Created: 2025-12-18
-- Description: Audit logging for security and compliance

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action details
  action VARCHAR(100) NOT NULL, -- e.g., 'update_api_keys', 'create_tenant', 'delete_lead'
  resource_type VARCHAR(50), -- e.g., 'tenant', 'user', 'lead', 'api_key'
  resource_id UUID,
  
  -- Request details
  details JSONB, -- Additional context about the action
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Result
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Comments
COMMENT ON TABLE audit_logs IS 'Audit trail for all important system actions';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., update_api_keys, create_tenant)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., tenant, user, lead)';
COMMENT ON COLUMN audit_logs.details IS 'JSON object with additional context about the action';

-- Function to automatically log actions
CREATE OR REPLACE FUNCTION log_audit(
  p_tenant_id UUID,
  p_user_id UUID,
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50),
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT log_audit(
--   '11111111-1111-1111-1111-111111111111'::UUID,
--   'user-id'::UUID,
--   'update_api_keys',
--   'api_key',
--   NULL,
--   '{"keys": ["GEMINI_API_KEY", "GROQ_API_KEY"]}'::JSONB,
--   '192.168.1.1'
-- );
