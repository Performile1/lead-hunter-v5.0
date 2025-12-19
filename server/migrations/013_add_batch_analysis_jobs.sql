-- Migration: Add batch analysis jobs table
-- Created: 2025-12-18
-- Description: Batch processing system for technical analysis (scraping, puppeteer, google) on lead lists

CREATE TABLE IF NOT EXISTS batch_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Job configuration
  job_name VARCHAR(255) NOT NULL,
  job_type VARCHAR(50) NOT NULL, -- tech_analysis, checkout_scraping, full_analysis
  
  -- Target leads
  lead_ids UUID[], -- Array of lead IDs to process
  filter_criteria JSONB, -- Filters used to select leads (segment, region, etc)
  
  -- Analysis configuration
  analysis_config JSONB, -- Configuration for analysis (which services to use, etc)
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  progress INTEGER DEFAULT 0, -- Number of leads processed
  total_leads INTEGER NOT NULL,
  
  -- Results
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  results JSONB, -- Summary of results
  
  -- Error tracking
  errors JSONB, -- Array of errors encountered
  
  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_duration_minutes INTEGER,
  
  -- Scheduling (for cronjobs)
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron VARCHAR(100), -- Cron expression (e.g., "0 2 * * *" for daily at 2 AM)
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  
  -- Priority
  priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
  
  CONSTRAINT batch_jobs_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'paused')),
  CONSTRAINT batch_jobs_type_check CHECK (job_type IN ('tech_analysis', 'checkout_scraping', 'full_analysis', 'ecommerce_detection', 'carrier_detection'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_batch_jobs_tenant ON batch_analysis_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_analysis_jobs(status, priority);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_scheduled ON batch_analysis_jobs(is_scheduled, next_run_at) WHERE is_scheduled = TRUE;
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created ON batch_analysis_jobs(created_at DESC);

-- Table for individual lead processing within batch job
CREATE TABLE IF NOT EXISTS batch_analysis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_job_id UUID NOT NULL REFERENCES batch_analysis_jobs(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Results
  analysis_result JSONB,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 2,
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  
  CONSTRAINT batch_items_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_batch_items_job ON batch_analysis_items(batch_job_id, status);
CREATE INDEX IF NOT EXISTS idx_batch_items_lead ON batch_analysis_items(lead_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_status ON batch_analysis_items(status);

-- Comments
COMMENT ON TABLE batch_analysis_jobs IS 'Batch processing jobs for technical analysis on lead lists';
COMMENT ON TABLE batch_analysis_items IS 'Individual lead items within a batch job';
COMMENT ON COLUMN batch_analysis_jobs.job_type IS 'Type of analysis: tech_analysis, checkout_scraping, full_analysis, etc';
COMMENT ON COLUMN batch_analysis_jobs.schedule_cron IS 'Cron expression for scheduled jobs (e.g., "0 2 * * *")';
COMMENT ON COLUMN batch_analysis_jobs.analysis_config IS 'JSON config: {use_firecrawl: true, use_puppeteer: true, timeout: 20000}';

-- Function to create batch job
CREATE OR REPLACE FUNCTION create_batch_analysis_job(
  p_tenant_id UUID,
  p_created_by UUID,
  p_job_name VARCHAR(255),
  p_job_type VARCHAR(50),
  p_lead_ids UUID[],
  p_analysis_config JSONB DEFAULT NULL,
  p_is_scheduled BOOLEAN DEFAULT FALSE,
  p_schedule_cron VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_total_leads INTEGER;
BEGIN
  v_total_leads := array_length(p_lead_ids, 1);
  
  INSERT INTO batch_analysis_jobs (
    tenant_id,
    created_by,
    job_name,
    job_type,
    lead_ids,
    total_leads,
    analysis_config,
    is_scheduled,
    schedule_cron,
    next_run_at
  ) VALUES (
    p_tenant_id,
    p_created_by,
    p_job_name,
    p_job_type,
    p_lead_ids,
    v_total_leads,
    p_analysis_config,
    p_is_scheduled,
    p_schedule_cron,
    CASE WHEN p_is_scheduled THEN NOW() + INTERVAL '1 hour' ELSE NULL END
  ) RETURNING id INTO v_job_id;
  
  -- Create batch items for each lead
  INSERT INTO batch_analysis_items (batch_job_id, lead_id)
  SELECT v_job_id, UNNEST(p_lead_ids);
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next pending batch item
CREATE OR REPLACE FUNCTION get_next_batch_item(
  p_batch_job_id UUID
) RETURNS TABLE (
  item_id UUID,
  lead_id UUID,
  company_name VARCHAR(255),
  domain VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id as item_id,
    bi.lead_id,
    l.company_name,
    l.domain
  FROM batch_analysis_items bi
  JOIN leads l ON bi.lead_id = l.id
  WHERE bi.batch_job_id = p_batch_job_id
    AND bi.status = 'pending'
    AND bi.retry_count < bi.max_retries
  ORDER BY bi.id
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Function to update batch item status
CREATE OR REPLACE FUNCTION update_batch_item_status(
  p_item_id UUID,
  p_status VARCHAR(50),
  p_analysis_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
  v_batch_job_id UUID;
BEGIN
  -- Update item
  UPDATE batch_analysis_items
  SET 
    status = p_status,
    analysis_result = COALESCE(p_analysis_result, analysis_result),
    error_message = p_error_message,
    completed_at = CASE WHEN p_status IN ('completed', 'failed', 'skipped') THEN NOW() ELSE completed_at END,
    duration_seconds = CASE 
      WHEN p_status IN ('completed', 'failed', 'skipped') AND started_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
      ELSE duration_seconds
    END,
    retry_count = CASE WHEN p_status = 'failed' THEN retry_count + 1 ELSE retry_count END
  WHERE id = p_item_id
  RETURNING batch_job_id INTO v_batch_job_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- Update batch job progress
  IF v_updated > 0 THEN
    UPDATE batch_analysis_jobs
    SET 
      progress = (SELECT COUNT(*) FROM batch_analysis_items WHERE batch_job_id = v_batch_job_id AND status IN ('completed', 'failed', 'skipped')),
      successful_count = (SELECT COUNT(*) FROM batch_analysis_items WHERE batch_job_id = v_batch_job_id AND status = 'completed'),
      failed_count = (SELECT COUNT(*) FROM batch_analysis_items WHERE batch_job_id = v_batch_job_id AND status = 'failed'),
      skipped_count = (SELECT COUNT(*) FROM batch_analysis_items WHERE batch_job_id = v_batch_job_id AND status = 'skipped'),
      status = CASE 
        WHEN (SELECT COUNT(*) FROM batch_analysis_items WHERE batch_job_id = v_batch_job_id AND status = 'pending') = 0 
        THEN 'completed'
        ELSE status
      END,
      completed_at = CASE 
        WHEN (SELECT COUNT(*) FROM batch_analysis_items WHERE batch_job_id = v_batch_job_id AND status = 'pending') = 0 
        THEN NOW()
        ELSE completed_at
      END
    WHERE id = v_batch_job_id;
  END IF;
  
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get scheduled jobs that need to run
CREATE OR REPLACE FUNCTION get_scheduled_jobs_to_run()
RETURNS TABLE (
  job_id UUID,
  job_name VARCHAR(255),
  job_type VARCHAR(50),
  tenant_id UUID,
  lead_ids UUID[],
  analysis_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id as job_id,
    batch_analysis_jobs.job_name,
    batch_analysis_jobs.job_type,
    batch_analysis_jobs.tenant_id,
    batch_analysis_jobs.lead_ids,
    batch_analysis_jobs.analysis_config
  FROM batch_analysis_jobs
  WHERE is_scheduled = TRUE
    AND next_run_at <= NOW()
    AND status NOT IN ('running', 'paused')
  ORDER BY priority ASC, next_run_at ASC
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next run time based on cron expression
-- Simplified version - for production use a proper cron parser
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_cron_expression VARCHAR(100)
) RETURNS TIMESTAMP AS $$
BEGIN
  -- Simple daily schedule: "0 2 * * *" = 2 AM daily
  IF p_cron_expression LIKE '0 2 * * *' THEN
    RETURN (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '2 hours')::TIMESTAMP;
  -- Hourly: "0 * * * *"
  ELSIF p_cron_expression LIKE '0 * * * *' THEN
    RETURN (DATE_TRUNC('hour', NOW()) + INTERVAL '1 hour')::TIMESTAMP;
  -- Every 6 hours: "0 */6 * * *"
  ELSIF p_cron_expression LIKE '0 */6 * * *' THEN
    RETURN (DATE_TRUNC('hour', NOW()) + INTERVAL '6 hours')::TIMESTAMP;
  -- Default: 24 hours from now
  ELSE
    RETURN (NOW() + INTERVAL '24 hours')::TIMESTAMP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT create_batch_analysis_job(
--   'tenant-id'::UUID,
--   'user-id'::UUID,
--   'Nightly Tech Analysis',
--   'tech_analysis',
--   ARRAY['lead1'::UUID, 'lead2'::UUID, 'lead3'::UUID],
--   '{"use_firecrawl": true, "use_puppeteer": true, "timeout": 20000}'::JSONB,
--   TRUE,
--   '0 2 * * *'
-- );
