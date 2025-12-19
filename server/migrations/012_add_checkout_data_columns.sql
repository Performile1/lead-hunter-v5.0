-- Migration: Add checkout and ecommerce data columns to leads
-- Created: 2025-12-18
-- Description: Add columns for storing checkout scraping results

-- Add columns to leads table if they don't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS ecommerce_platform VARCHAR(100),
ADD COLUMN IF NOT EXISTS carriers TEXT, -- Comma-separated list
ADD COLUMN IF NOT EXISTS checkout_position TEXT, -- JSON or comma-separated with positions
ADD COLUMN IF NOT EXISTS delivery_services TEXT[], -- Array of delivery methods
ADD COLUMN IF NOT EXISTS checkout_providers TEXT[], -- Array of checkout providers (Klarna, Stripe, etc)
ADD COLUMN IF NOT EXISTS has_checkout BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checkout_scraped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS checkout_detection_method VARCHAR(50); -- firecrawl, puppeteer, gemini

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_ecommerce_platform ON leads(ecommerce_platform);
CREATE INDEX IF NOT EXISTS idx_leads_has_checkout ON leads(has_checkout);
CREATE INDEX IF NOT EXISTS idx_leads_checkout_scraped ON leads(checkout_scraped_at DESC);

-- Comments
COMMENT ON COLUMN leads.ecommerce_platform IS 'E-commerce platform (Shopify, WooCommerce, Magento, etc)';
COMMENT ON COLUMN leads.carriers IS 'Comma-separated list of shipping carriers found in checkout';
COMMENT ON COLUMN leads.checkout_position IS 'Shipping carrier positions in checkout (e.g., "1. DHL, 2. PostNord")';
COMMENT ON COLUMN leads.delivery_services IS 'Array of delivery methods (home_delivery, pickup_point, etc)';
COMMENT ON COLUMN leads.checkout_providers IS 'Array of checkout/payment providers (Klarna, Stripe, PayPal, etc)';
COMMENT ON COLUMN leads.checkout_detection_method IS 'Method used to detect checkout (firecrawl, puppeteer, gemini)';

-- Function to update checkout data
CREATE OR REPLACE FUNCTION update_lead_checkout_data(
  p_lead_id UUID,
  p_ecommerce_platform VARCHAR(100),
  p_carriers TEXT,
  p_checkout_position TEXT,
  p_delivery_services TEXT[],
  p_checkout_providers TEXT[],
  p_has_checkout BOOLEAN,
  p_detection_method VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE leads
  SET 
    ecommerce_platform = COALESCE(p_ecommerce_platform, ecommerce_platform),
    carriers = COALESCE(p_carriers, carriers),
    checkout_position = COALESCE(p_checkout_position, checkout_position),
    delivery_services = COALESCE(p_delivery_services, delivery_services),
    checkout_providers = COALESCE(p_checkout_providers, checkout_providers),
    has_checkout = COALESCE(p_has_checkout, has_checkout),
    checkout_scraped_at = NOW(),
    checkout_detection_method = COALESCE(p_detection_method, checkout_detection_method),
    updated_at = NOW()
  WHERE id = p_lead_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT update_lead_checkout_data(
--   'lead-id'::UUID,
--   'Shopify',
--   'DHL,PostNord,Bring',
--   '1. DHL, 2. PostNord, 3. Bring',
--   ARRAY['home_delivery', 'pickup_point'],
--   ARRAY['Klarna', 'Stripe'],
--   TRUE,
--   'firecrawl'
-- );
