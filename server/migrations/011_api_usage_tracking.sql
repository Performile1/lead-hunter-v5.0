-- Migration: API Usage Tracking för Quota Management
-- Skapar tabell för att spåra API-användning per tenant

-- Skapa tabell för API usage tracking
CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id SERIAL PRIMARY KEY,
  service VARCHAR(50) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för snabbare queries
CREATE INDEX idx_api_usage_tracking_service ON api_usage_tracking(service);
CREATE INDEX idx_api_usage_tracking_tenant ON api_usage_tracking(tenant_id);
CREATE INDEX idx_api_usage_tracking_timestamp ON api_usage_tracking(timestamp);
CREATE INDEX idx_api_usage_tracking_service_tenant ON api_usage_tracking(service, tenant_id);

-- Composite index för quota queries
CREATE INDEX idx_api_usage_tracking_quota_lookup 
  ON api_usage_tracking(service, tenant_id, timestamp DESC);

COMMENT ON TABLE api_usage_tracking IS 'Tracks API usage for quota management per tenant';
COMMENT ON COLUMN api_usage_tracking.service IS 'API service name (gemini, groq, firecrawl, deepseek, newsapi)';
COMMENT ON COLUMN api_usage_tracking.tenant_id IS 'Tenant that made the API call (NULL for global/SuperAdmin)';
COMMENT ON COLUMN api_usage_tracking.user_id IS 'User who made the API call';
COMMENT ON COLUMN api_usage_tracking.timestamp IS 'When the API call was made';
