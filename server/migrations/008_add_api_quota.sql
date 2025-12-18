-- Migration: Add api_quota table
-- Created: 2025-12-18
-- Description: Track API usage and quota per tenant and provider

CREATE TABLE IF NOT EXISTS api_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- API provider details
  api_provider VARCHAR(50) NOT NULL, -- gemini, groq, openai, firecrawl, etc
  month DATE NOT NULL, -- First day of the month
  
  -- Usage tracking
  requests_made INTEGER DEFAULT 0,
  requests_limit INTEGER DEFAULT 1000,
  tokens_used BIGINT DEFAULT 0,
  tokens_limit BIGINT DEFAULT 1000000,
  
  -- Cost tracking
  cost_usd DECIMAL(10,4) DEFAULT 0,
  estimated_monthly_cost DECIMAL(10,4) DEFAULT 0,
  
  -- Metadata
  last_request_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, api_provider, month)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_api_quota_tenant ON api_quota(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_quota_provider ON api_quota(api_provider);
CREATE INDEX IF NOT EXISTS idx_api_quota_month ON api_quota(month DESC);
CREATE INDEX IF NOT EXISTS idx_api_quota_tenant_month ON api_quota(tenant_id, month);

-- Comments
COMMENT ON TABLE api_quota IS 'Tracks API usage and quota per tenant and provider';
COMMENT ON COLUMN api_quota.api_provider IS 'API provider name (gemini, groq, openai, firecrawl, etc)';
COMMENT ON COLUMN api_quota.month IS 'First day of the month for this quota period';
COMMENT ON COLUMN api_quota.requests_made IS 'Number of API requests made this month';
COMMENT ON COLUMN api_quota.tokens_used IS 'Total tokens consumed this month';

-- Function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_tenant_id UUID,
  p_api_provider VARCHAR(50),
  p_requests INTEGER DEFAULT 1,
  p_tokens BIGINT DEFAULT 0,
  p_cost_usd DECIMAL(10,4) DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  v_current_month DATE;
BEGIN
  v_current_month := DATE_TRUNC('month', NOW())::DATE;
  
  INSERT INTO api_quota (
    tenant_id,
    api_provider,
    month,
    requests_made,
    tokens_used,
    cost_usd,
    last_request_at
  ) VALUES (
    p_tenant_id,
    p_api_provider,
    v_current_month,
    p_requests,
    p_tokens,
    p_cost_usd,
    NOW()
  )
  ON CONFLICT (tenant_id, api_provider, month) 
  DO UPDATE SET
    requests_made = api_quota.requests_made + p_requests,
    tokens_used = api_quota.tokens_used + p_tokens,
    cost_usd = api_quota.cost_usd + p_cost_usd,
    last_request_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check if quota is exceeded
CREATE OR REPLACE FUNCTION is_quota_exceeded(
  p_tenant_id UUID,
  p_api_provider VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_month DATE;
  v_requests_made INTEGER;
  v_requests_limit INTEGER;
BEGIN
  v_current_month := DATE_TRUNC('month', NOW())::DATE;
  
  SELECT 
    COALESCE(requests_made, 0),
    COALESCE(requests_limit, 1000)
  INTO v_requests_made, v_requests_limit
  FROM api_quota
  WHERE tenant_id = p_tenant_id
    AND api_provider = p_api_provider
    AND month = v_current_month;
  
  RETURN v_requests_made >= v_requests_limit;
END;
$$ LANGUAGE plpgsql;

-- Create initial quota entries for existing tenants
INSERT INTO api_quota (tenant_id, api_provider, month, requests_limit, tokens_limit)
SELECT 
  t.id,
  provider.name,
  DATE_TRUNC('month', NOW())::DATE,
  CASE 
    WHEN t.subscription_tier = 'enterprise' THEN 10000
    WHEN t.subscription_tier = 'professional' THEN 5000
    ELSE 1000
  END,
  CASE 
    WHEN t.subscription_tier = 'enterprise' THEN 10000000
    WHEN t.subscription_tier = 'professional' THEN 5000000
    ELSE 1000000
  END
FROM tenants t
CROSS JOIN (
  SELECT 'gemini' as name
  UNION ALL SELECT 'groq'
  UNION ALL SELECT 'openai'
  UNION ALL SELECT 'firecrawl'
) provider
ON CONFLICT (tenant_id, api_provider, month) DO NOTHING;

-- Example usage:
-- SELECT increment_api_usage(
--   '11111111-1111-1111-1111-111111111111'::UUID,
--   'gemini',
--   1,
--   1500,
--   0.0015
-- );
--
-- SELECT is_quota_exceeded(
--   '11111111-1111-1111-1111-111111111111'::UUID,
--   'gemini'
-- );
