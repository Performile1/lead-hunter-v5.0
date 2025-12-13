-- Migration: Multi-Tenant System
-- Date: 2024-12-12
-- Description: Implementerar multi-tenant stöd för flera transportföretag

-- ============================================
-- 1. SKAPA TENANTS TABELL
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE, -- t.ex. 'dhl.se', 'postnord.se'
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#D40511',
  secondary_color VARCHAR(7) DEFAULT '#FFCC00',
  
  -- Checkout tracking settings
  checkout_search_term VARCHAR(255), -- Vad systemet letar efter i checkout (t.ex. 'DHL', 'PostNord')
  main_competitor VARCHAR(255), -- Största konkurrenten (t.ex. 'PostNord' för DHL)
  
  -- Subscription & limits
  subscription_tier VARCHAR(50) DEFAULT 'basic', -- basic, professional, enterprise
  max_users INTEGER DEFAULT 10,
  max_leads_per_month INTEGER DEFAULT 1000,
  max_customers INTEGER DEFAULT 500,
  
  -- API settings (endast super admin kan ändra)
  google_api_key_encrypted TEXT,
  gemini_api_key_encrypted TEXT,
  linkedin_api_key_encrypted TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Index för snabb sökning
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_active ON tenants(is_active);

COMMENT ON TABLE tenants IS 'Multi-tenant: Olika transportföretag som använder systemet';
COMMENT ON COLUMN tenants.domain IS 'Företagets domän (t.ex. dhl.se, postnord.se)';
COMMENT ON COLUMN tenants.checkout_search_term IS 'Vad systemet letar efter i checkout';
COMMENT ON COLUMN tenants.main_competitor IS 'Största konkurrenten att bevaka';

-- ============================================
-- 2. UPPDATERA USERS TABELL
-- ============================================

-- Lägg till tenant_id och super_admin
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Uppdatera role enum för att inkludera super_admin
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_new') THEN
    -- Drop views that depend on users.role
    DROP VIEW IF EXISTS user_stats CASCADE;
    DROP VIEW IF EXISTS users_with_tenant CASCADE;
    
    CREATE TYPE user_role_new AS ENUM ('user', 'manager', 'terminalchef', 'admin', 'super_admin');
    ALTER TABLE users ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;
    DROP TYPE IF EXISTS user_role;
    ALTER TYPE user_role_new RENAME TO user_role;
    
    -- Recreate user_stats view if it existed
    CREATE OR REPLACE VIEW user_stats AS
    SELECT 
      u.id,
      u.email,
      u.full_name,
      u.role,
      u.tenant_id,
      t.company_name as tenant_name,
      COUNT(DISTINCT l.id) as total_leads,
      COUNT(DISTINCT c.id) as total_customers
    FROM users u
    LEFT JOIN tenants t ON u.tenant_id = t.id
    LEFT JOIN leads l ON l.created_by = u.id
    LEFT JOIN customers c ON c.account_manager_id = u.id
    GROUP BY u.id, u.email, u.full_name, u.role, u.tenant_id, t.company_name;
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_super_admin ON users(is_super_admin);

COMMENT ON COLUMN users.tenant_id IS 'Vilket företag användaren tillhör';
COMMENT ON COLUMN users.is_super_admin IS 'Super admin ser alla tenants och hanterar API-nycklar';

-- ============================================
-- 3. SKAPA USER_SETTINGS TABELL
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- UI Preferences
  theme VARCHAR(50) DEFAULT 'light', -- light, dark, auto
  language VARCHAR(10) DEFAULT 'sv',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  
  -- Dashboard preferences
  default_view VARCHAR(50) DEFAULT 'dashboard', -- dashboard, leads, customers
  leads_per_page INTEGER DEFAULT 20,
  show_onboarding BOOLEAN DEFAULT true,
  
  -- Search preferences
  default_segment VARCHAR(50),
  default_protocol VARCHAR(50) DEFAULT 'deep',
  auto_enrich BOOLEAN DEFAULT false,
  
  -- Notification preferences
  notify_new_leads BOOLEAN DEFAULT true,
  notify_customer_updates BOOLEAN DEFAULT true,
  notify_cronjob_complete BOOLEAN DEFAULT false,
  
  -- Privacy
  share_analytics BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);

COMMENT ON TABLE user_settings IS 'Personliga inställningar för varje användare';

-- ============================================
-- 4. UPPDATERA LEADS TABELL
-- ============================================

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);

COMMENT ON COLUMN leads.tenant_id IS 'Vilket företag som äger detta lead';

-- ============================================
-- 5. UPPDATERA CUSTOMERS TABELL
-- ============================================

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Lägg till konkurrent-tracking
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS uses_competitor BOOLEAN DEFAULT false;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS competitor_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_competitor ON customers(uses_competitor);

COMMENT ON COLUMN customers.tenant_id IS 'Vilket företag som äger denna kund';
COMMENT ON COLUMN customers.uses_competitor IS 'Om kunden använder huvudkonkurrenten';
COMMENT ON COLUMN customers.competitor_name IS 'Vilken konkurrent kunden använder';

-- ============================================
-- 6. UPPDATERA MONITORING_HISTORY TABELL
-- ============================================

-- Skapa tabellen om den inte finns
CREATE TABLE IF NOT EXISTS monitoring_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  checked_at TIMESTAMP DEFAULT NOW(),
  uses_dhl BOOLEAN,
  checkout_position INTEGER,
  checkout_html TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE monitoring_history 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Lägg till konkurrent-data
ALTER TABLE monitoring_history 
ADD COLUMN IF NOT EXISTS competitor_found BOOLEAN DEFAULT false;

ALTER TABLE monitoring_history 
ADD COLUMN IF NOT EXISTS competitor_position INTEGER;

CREATE INDEX IF NOT EXISTS idx_monitoring_tenant ON monitoring_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_customer ON monitoring_history(customer_id);

COMMENT ON COLUMN monitoring_history.competitor_found IS 'Om konkurrenten hittades i checkout';
COMMENT ON COLUMN monitoring_history.competitor_position IS 'Position i checkout för konkurrent';

-- ============================================
-- 7. UPPDATERA CUSTOMER_NOTES TABELL
-- ============================================

-- Skapa tabellen om den inte finns
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  note_type VARCHAR(50) DEFAULT 'general',
  subject VARCHAR(255),
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE customer_notes 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_customer_notes_tenant ON customer_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);

-- ============================================
-- 8. UPPDATERA CRONJOBS TABELL
-- ============================================

-- Skapa tabellen om den inte finns
CREATE TABLE IF NOT EXISTS cronjobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  schedule VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE cronjobs 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Null tenant_id = global cronjob (endast super admin)
CREATE INDEX IF NOT EXISTS idx_cronjobs_tenant ON cronjobs(tenant_id);

COMMENT ON COLUMN cronjobs.tenant_id IS 'NULL = global cronjob (super admin), annars tenant-specifik';

-- ============================================
-- 9. UPPDATERA SYSTEM_SETTINGS TABELL
-- ============================================

ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Null tenant_id = global setting (super admin)
CREATE INDEX IF NOT EXISTS idx_system_settings_tenant ON system_settings(tenant_id);

COMMENT ON COLUMN system_settings.tenant_id IS 'NULL = global setting (super admin), annars tenant-specifik';

-- ============================================
-- 10. SKAPA TENANT_USAGE TABELL (för limits)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Monthly usage
  month DATE NOT NULL, -- First day of month
  leads_created INTEGER DEFAULT 0,
  customers_created INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  monitoring_checks INTEGER DEFAULT 0,
  
  -- Costs (för fakturering)
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, month)
);

CREATE INDEX idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_month ON tenant_usage(month);

COMMENT ON TABLE tenant_usage IS 'Spårar användning per tenant för limits och fakturering';

-- ============================================
-- 11. SKAPA DEFAULT TENANT (DHL)
-- ============================================

INSERT INTO tenants (
  company_name,
  domain,
  checkout_search_term,
  main_competitor,
  subscription_tier,
  max_users,
  max_leads_per_month,
  max_customers,
  is_active
) VALUES (
  'DHL Express Sweden',
  'dhl.se',
  'DHL',
  'PostNord',
  'enterprise',
  100,
  10000,
  5000,
  true
) ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- 12. UPPDATERA BEFINTLIGA ANVÄNDARE
-- ============================================

-- Sätt alla befintliga användare till DHL tenant
UPDATE users 
SET tenant_id = (SELECT id FROM tenants WHERE domain = 'dhl.se' LIMIT 1)
WHERE tenant_id IS NULL;

-- ============================================
-- 13. UPPDATERA BEFINTLIG DATA
-- ============================================

-- Sätt tenant_id för alla befintliga leads
UPDATE leads 
SET tenant_id = (SELECT id FROM tenants WHERE domain = 'dhl.se' LIMIT 1)
WHERE tenant_id IS NULL;

-- Sätt tenant_id för alla befintliga customers
UPDATE customers 
SET tenant_id = (SELECT id FROM tenants WHERE domain = 'dhl.se' LIMIT 1)
WHERE tenant_id IS NULL;

-- Sätt tenant_id för monitoring_history
UPDATE monitoring_history 
SET tenant_id = (SELECT id FROM tenants WHERE domain = 'dhl.se' LIMIT 1)
WHERE tenant_id IS NULL;

-- Sätt tenant_id för customer_notes
UPDATE customer_notes 
SET tenant_id = (SELECT id FROM tenants WHERE domain = 'dhl.se' LIMIT 1)
WHERE tenant_id IS NULL;

-- ============================================
-- 14. SKAPA VIEWS FÖR ENKEL ÅTKOMST
-- ============================================

-- View för tenant statistics
CREATE OR REPLACE VIEW tenant_statistics AS
SELECT 
  t.id,
  t.company_name,
  t.domain,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT c.id) as total_customers,
  t.is_active,
  t.subscription_tier
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
LEFT JOIN leads l ON l.tenant_id = t.id
LEFT JOIN customers c ON c.tenant_id = t.id
GROUP BY t.id, t.company_name, t.domain, t.is_active, t.subscription_tier;

-- View för user med tenant info
CREATE OR REPLACE VIEW users_with_tenant AS
SELECT 
  u.*,
  t.company_name as tenant_name,
  t.domain as tenant_domain,
  t.checkout_search_term,
  t.main_competitor
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id;

-- ============================================
-- 15. SKAPA FUNCTIONS FÖR TENANT ISOLATION
-- ============================================

-- Function för att hämta tenant_id från user_id
CREATE OR REPLACE FUNCTION get_user_tenant_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Function för att kontrollera om user är super admin
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_super_admin, false) FROM users WHERE id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Function för att kontrollera tenant access
CREATE OR REPLACE FUNCTION has_tenant_access(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT 
    CASE 
      WHEN is_super_admin(p_user_id) THEN true
      WHEN get_user_tenant_id(p_user_id) = p_tenant_id THEN true
      ELSE false
    END;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 16. ROW LEVEL SECURITY (RLS) - OPTIONAL
-- ============================================

-- Enable RLS på leads (exempel)
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY tenant_isolation_policy ON leads
--   USING (tenant_id = get_user_tenant_id(current_user_id()));

-- ============================================
-- 17. TRIGGERS FÖR AUTO-UPDATE
-- ============================================

-- Auto-update tenant_id från user när ny lead skapas
CREATE OR REPLACE FUNCTION set_tenant_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.created_by IS NOT NULL THEN
    NEW.tenant_id := get_user_tenant_id(NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applicera trigger på leads
DROP TRIGGER IF EXISTS leads_set_tenant_id ON leads;
CREATE TRIGGER leads_set_tenant_id
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id_from_user();

-- Applicera trigger på customers
DROP TRIGGER IF EXISTS customers_set_tenant_id ON customers;
CREATE TRIGGER customers_set_tenant_id
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id_from_user();

-- ============================================
-- 18. SKAPA EXEMPEL-TENANTS
-- ============================================

-- PostNord
INSERT INTO tenants (
  company_name, domain, checkout_search_term, main_competitor,
  subscription_tier, max_users, max_leads_per_month, max_customers
) VALUES (
  'PostNord AB', 'postnord.se', 'PostNord', 'DHL',
  'professional', 50, 5000, 2000
) ON CONFLICT (domain) DO NOTHING;

-- Bring
INSERT INTO tenants (
  company_name, domain, checkout_search_term, main_competitor,
  subscription_tier, max_users, max_leads_per_month, max_customers
) VALUES (
  'Bring Parcels AB', 'bring.se', 'Bring', 'PostNord',
  'professional', 50, 5000, 2000
) ON CONFLICT (domain) DO NOTHING;

-- Schenker
INSERT INTO tenants (
  company_name, domain, checkout_search_term, main_competitor,
  subscription_tier, max_users, max_leads_per_month, max_customers
) VALUES (
  'DB Schenker', 'schenker.se', 'Schenker', 'DHL',
  'basic', 20, 2000, 1000
) ON CONFLICT (domain) DO NOTHING;

-- Instabox
INSERT INTO tenants (
  company_name, domain, checkout_search_term, main_competitor,
  subscription_tier, max_users, max_leads_per_month, max_customers
) VALUES (
  'Instabox AB', 'instabox.se', 'Instabox', 'Budbee',
  'basic', 20, 2000, 1000
) ON CONFLICT (domain) DO NOTHING;

-- Budbee
INSERT INTO tenants (
  company_name, domain, checkout_search_term, main_competitor,
  subscription_tier, max_users, max_leads_per_month, max_customers
) VALUES (
  'Budbee AB', 'budbee.se', 'Budbee', 'Instabox',
  'basic', 20, 2000, 1000
) ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify migration
DO $$
DECLARE
  tenant_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  SELECT COUNT(*) INTO user_count FROM users WHERE tenant_id IS NOT NULL;
  
  RAISE NOTICE 'Migration complete!';
  RAISE NOTICE 'Tenants created: %', tenant_count;
  RAISE NOTICE 'Users with tenant: %', user_count;
END $$;
