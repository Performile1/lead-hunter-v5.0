-- Migration: Add financial_metrics column to leads table
-- Created: 2025-12-18

-- Add financial_metrics JSONB column
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS financial_metrics JSONB,
ADD COLUMN IF NOT EXISTS financial_metrics_updated_at TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_financial_metrics ON leads USING GIN (financial_metrics);

-- Comments
COMMENT ON COLUMN leads.financial_metrics IS 'Financial metrics from Allabolag: kassalikviditet, vinstmarginal, soliditet';
COMMENT ON COLUMN leads.financial_metrics_updated_at IS 'Last time financial metrics were updated';

-- Example structure:
-- {
--   "kassalikviditet": 145.5,
--   "vinstmarginal": 8.2,
--   "soliditet": 42.3,
--   "year": "2023"
-- }
