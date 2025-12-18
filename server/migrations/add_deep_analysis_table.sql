-- Migration: Add lead_deep_analysis table for annual monitoring
-- Created: 2025-12-18

CREATE TABLE IF NOT EXISTS lead_deep_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Check results (JSON)
  revenue_check JSONB,
  kronofogden_check JSONB,
  credit_check JSONB,
  tax_check JSONB,
  payment_remarks_check JSONB,
  
  -- Risk scoring
  risk_score INTEGER NOT NULL DEFAULT 100,
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(lead_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_lead_deep_analysis_lead_id ON lead_deep_analysis(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_deep_analysis_analyzed_at ON lead_deep_analysis(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_lead_deep_analysis_risk_level ON lead_deep_analysis(risk_level);

-- Add column to leads table for tracking last deep analysis
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_deep_analysis_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_leads_last_deep_analysis ON leads(last_deep_analysis_at);

-- Comments
COMMENT ON TABLE lead_deep_analysis IS 'Stores annual deep analysis results for leads including financial checks, credit reports, and payment remarks';
COMMENT ON COLUMN lead_deep_analysis.risk_score IS 'Risk score from 0-100, where 100 is lowest risk';
COMMENT ON COLUMN lead_deep_analysis.risk_level IS 'Risk level: low, medium, high, critical';
