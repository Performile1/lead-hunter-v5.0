-- Migration: Update customers table to use segment instead of tier
-- Date: 2024-12-12

-- Add segment column if it doesn't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT 'general';

-- Add area column for geographic filtering (terminalchefer)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS area VARCHAR(100);

-- Add phone and email columns for contact info
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add last_contact column for tracking
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_contact TIMESTAMP;

-- Add decision_makers JSONB column for storing decision makers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS decision_makers JSONB DEFAULT '[]'::jsonb;

-- Migrate existing customer_tier to segment
-- Map tiers to appropriate segments
UPDATE customers 
SET segment = CASE 
    WHEN customer_tier = 'platinum' THEN 'ecommerce'
    WHEN customer_tier = 'gold' THEN 'retail'
    WHEN customer_tier = 'silver' THEN 'wholesale'
    WHEN customer_tier = 'bronze' THEN 'general'
    ELSE 'general'
END
WHERE segment IS NULL OR segment = 'general';

-- Create index on segment for faster filtering
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);

-- Create index on area for terminalchef filtering
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);

-- Create index on customer_status for filtering
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(customer_status);

-- Add comments
COMMENT ON COLUMN customers.segment IS 'Business segment: ecommerce, retail, wholesale, manufacturing, logistics, general';
COMMENT ON COLUMN customers.area IS 'Geographic area for regional filtering (e.g., Stockholm, Göteborg, Malmö)';
COMMENT ON COLUMN customers.phone IS 'Primary phone number';
COMMENT ON COLUMN customers.email IS 'Primary email address';
COMMENT ON COLUMN customers.last_contact IS 'Date of last contact with customer';
COMMENT ON COLUMN customers.decision_makers IS 'Array of decision makers with name, title, email, phone, linkedin';

-- Note: customer_tier column is kept for backward compatibility but should not be used
-- Use segment instead
