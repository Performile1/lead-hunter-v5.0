-- ============================================
-- CUSTOMER LIST SYSTEM
-- Separerad från leads för befintliga kunder
-- ============================================

-- Customer List Table (liknande leads men för befintliga kunder)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Info
  company_name VARCHAR(255) NOT NULL,
  org_number VARCHAR(20) UNIQUE,
  
  -- Contact Info
  address TEXT,
  visiting_address TEXT,
  warehouse_address TEXT,
  return_address TEXT,
  phone_number VARCHAR(50),
  website_url TEXT,
  
  -- Financial
  segment VARCHAR(10),
  revenue BIGINT,
  revenue_source VARCHAR(100),
  freight_budget BIGINT,
  
  -- Legal & Credit
  legal_status VARCHAR(100),
  credit_rating_label VARCHAR(50),
  credit_rating_description TEXT,
  has_ftax BOOLEAN DEFAULT false,
  
  -- Logistics Profile
  logistics_profile TEXT,
  ecommerce_platform VARCHAR(100),
  carriers TEXT,
  uses_dhl BOOLEAN DEFAULT false,
  checkout_position VARCHAR(100),
  delivery_services TEXT[],
  markets TEXT,
  multi_brands TEXT,
  
  -- Decision Makers (JSONB for flexibility)
  decision_makers JSONB DEFAULT '[]'::jsonb,
  
  -- Customer Specific Fields
  customer_since DATE,
  contract_end_date DATE,
  account_manager_id UUID REFERENCES users(id),
  customer_status VARCHAR(50) DEFAULT 'active', -- active, inactive, churned, at_risk
  customer_tier VARCHAR(20), -- platinum, gold, silver, bronze
  annual_contract_value BIGINT,
  
  -- Monitoring Settings
  monitor_checkout BOOLEAN DEFAULT true,
  monitor_frequency VARCHAR(20) DEFAULT 'daily', -- hourly, daily, weekly
  monitor_times TIME[], -- Array of times to check (e.g., ['09:00', '15:00', '21:00'])
  last_monitored_at TIMESTAMP,
  
  -- Website Scraping Data (JSONB for flexibility)
  website_analysis JSONB,
  
  -- Competitive Intelligence
  competitive_data JSONB, -- Stores historical checkout positions, competitors, etc.
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  
  -- Search
  search_vector tsvector
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_org_number ON customers(org_number);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_customer_status ON customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_account_manager ON customers(account_manager_id);
CREATE INDEX IF NOT EXISTS idx_customers_monitor_checkout ON customers(monitor_checkout) WHERE monitor_checkout = true;
CREATE INDEX IF NOT EXISTS idx_customers_search_vector ON customers USING gin(search_vector);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION customers_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('swedish', COALESCE(NEW.company_name, '')), 'A') ||
    setweight(to_tsvector('swedish', COALESCE(NEW.org_number, '')), 'B') ||
    setweight(to_tsvector('swedish', COALESCE(NEW.address, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_search_update 
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION customers_search_trigger();

-- ============================================
-- CUSTOMER MONITORING HISTORY
-- Lagrar historik över checkout-positioner och konkurrenter
-- ============================================

CREATE TABLE IF NOT EXISTS customer_monitoring_history (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Monitoring Data
  monitored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checkout_position INTEGER,
  total_shipping_options INTEGER,
  shipping_providers TEXT[],
  dhl_position INTEGER,
  
  -- Competitive Changes
  new_competitors TEXT[],
  removed_competitors TEXT[],
  position_change INTEGER, -- +1 = moved up, -1 = moved down
  
  -- Website Changes
  website_changes JSONB, -- Stores any detected changes on website
  
  -- Alerts
  alert_triggered BOOLEAN DEFAULT false,
  alert_type VARCHAR(50), -- position_dropped, new_competitor, dhl_removed, etc.
  alert_message TEXT,
  
  -- Metadata
  scrape_duration_ms INTEGER,
  scrape_success BOOLEAN DEFAULT true,
  scrape_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_monitoring_history_customer ON customer_monitoring_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_history_monitored_at ON customer_monitoring_history(monitored_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_history_alerts ON customer_monitoring_history(alert_triggered) WHERE alert_triggered = true;

-- ============================================
-- CUSTOMER NOTES & INTERACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS customer_notes (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  note_type VARCHAR(50), -- meeting, call, email, alert, general
  subject VARCHAR(255),
  content TEXT NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);

-- ============================================
-- MONITORING SCHEDULE (för cronjobs)
-- ============================================

CREATE TABLE IF NOT EXISTS customer_monitoring_schedule (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Schedule Settings
  enabled BOOLEAN DEFAULT true,
  frequency VARCHAR(20) NOT NULL, -- hourly, daily, weekly
  schedule_times TIME[] NOT NULL, -- Array of times to run
  timezone VARCHAR(50) DEFAULT 'Europe/Stockholm',
  
  -- Next Run
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monitoring_schedule_customer ON customer_monitoring_schedule(customer_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_schedule_next_run ON customer_monitoring_schedule(next_run_at) WHERE enabled = true;

-- ============================================
-- VIEWS
-- ============================================

-- View: Customers at risk (position dropped or new competitors)
CREATE OR REPLACE VIEW customers_at_risk AS
SELECT 
  c.*,
  mh.position_change,
  mh.new_competitors,
  mh.monitored_at as last_check
FROM customers c
LEFT JOIN LATERAL (
  SELECT * FROM customer_monitoring_history
  WHERE customer_id = c.id
  ORDER BY monitored_at DESC
  LIMIT 1
) mh ON true
WHERE 
  c.customer_status = 'active' 
  AND (
    mh.position_change < 0 
    OR array_length(mh.new_competitors, 1) > 0
    OR mh.alert_triggered = true
  );

-- View: Monitoring queue (customers due for monitoring)
CREATE OR REPLACE VIEW monitoring_queue AS
SELECT 
  c.id,
  c.company_name,
  c.website_url,
  cms.next_run_at,
  cms.frequency,
  cms.schedule_times
FROM customers c
JOIN customer_monitoring_schedule cms ON c.id = cms.customer_id
WHERE 
  c.customer_status = 'active'
  AND c.monitor_checkout = true
  AND cms.enabled = true
  AND cms.next_run_at <= NOW()
ORDER BY cms.next_run_at ASC;

-- ============================================
-- GRANTS (Commented out - not needed in Supabase)
-- ============================================

-- GRANT ALL PRIVILEGES ON customers TO dhl_user;
-- GRANT ALL PRIVILEGES ON customer_monitoring_history TO dhl_user;
-- GRANT ALL PRIVILEGES ON customer_notes TO dhl_user;
-- GRANT ALL PRIVILEGES ON customer_monitoring_schedule TO dhl_user;
-- GRANT ALL PRIVILEGES ON customer_monitoring_history_id_seq TO dhl_user;
-- GRANT ALL PRIVILEGES ON customer_notes_id_seq TO dhl_user;
-- GRANT ALL PRIVILEGES ON customer_monitoring_schedule_id_seq TO dhl_user;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE customers IS 'Befintliga DHL-kunder, separerad från leads för att undvika förvirring';
COMMENT ON TABLE customer_monitoring_history IS 'Historik över checkout-positioner och konkurrenter för kundövervakning';
COMMENT ON TABLE customer_monitoring_schedule IS 'Schema för automatisk övervakning av kunder via cronjobs';
COMMENT ON COLUMN customers.monitor_checkout IS 'Om true, övervaka checkout-position automatiskt';
COMMENT ON COLUMN customers.monitor_times IS 'Array av tider på dagen att köra övervakning (t.ex. 09:00, 15:00, 21:00)';
COMMENT ON COLUMN customer_monitoring_history.position_change IS 'Förändring i position sedan senaste check (+1 = bättre, -1 = sämre)';
