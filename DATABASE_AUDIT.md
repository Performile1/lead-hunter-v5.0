# 🗄️ Database Audit - Supabase Tables

## Översikt

Komplett lista över alla tabeller som behövs för Lead Hunter v5.0 med Supabase.

---

## ✅ Befintliga Tabeller (från migrations)

### **1. Core Tables**

#### **tenants** ✅
```sql
-- Multi-tenant support för olika transportföretag
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  company_name VARCHAR(255),
  domain VARCHAR(255) UNIQUE,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  checkout_search_term VARCHAR(255),
  main_competitor VARCHAR(255),
  subscription_tier VARCHAR(50),
  max_users INTEGER,
  max_leads_per_month INTEGER,
  max_customers INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP
);
```

#### **users** ✅
```sql
-- Användare med multi-tenant support
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT,
  full_name VARCHAR(255),
  role user_role, -- user, manager, terminalchef, admin, super_admin
  tenant_id UUID REFERENCES tenants(id),
  is_super_admin BOOLEAN,
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

#### **leads** ✅
```sql
-- Leads med tenant isolation
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  company_name VARCHAR(255),
  org_number VARCHAR(50),
  domain VARCHAR(255),
  segment VARCHAR(50),
  revenue_tkr DECIMAL,
  revenue_year VARCHAR(10),
  shipping_providers TEXT,
  shipping_providers_with_position JSONB,
  ecommerce_platform VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  
  -- Nya kolumner
  last_deep_analysis_at TIMESTAMP,
  financial_metrics JSONB,
  financial_metrics_updated_at TIMESTAMP
);
```

#### **customers** ✅
```sql
-- Kunder med tenant isolation
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  company_name VARCHAR(255),
  org_number VARCHAR(50),
  segment VARCHAR(50),
  uses_competitor BOOLEAN,
  competitor_name VARCHAR(255),
  account_manager_id UUID REFERENCES users(id),
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

---

### **2. Settings & Configuration**

#### **user_settings** ✅
```sql
-- Personliga inställningar per användare
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  theme VARCHAR(50),
  language VARCHAR(10),
  notifications_enabled BOOLEAN,
  default_view VARCHAR(50),
  created_at TIMESTAMP
);
```

#### **system_settings** ✅
```sql
-- System-inställningar (global eller per tenant)
CREATE TABLE system_settings (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id), -- NULL = global
  setting_key VARCHAR(255),
  setting_value TEXT,
  created_at TIMESTAMP
);
```

#### **tenant_usage** ✅
```sql
-- Spårar användning per tenant för limits
CREATE TABLE tenant_usage (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  month DATE,
  leads_created INTEGER,
  customers_created INTEGER,
  api_calls INTEGER,
  monitoring_checks INTEGER,
  estimated_cost DECIMAL(10,2),
  UNIQUE(tenant_id, month)
);
```

---

### **3. Monitoring & History**

#### **monitoring_history** ✅
```sql
-- Checkout monitoring historik
CREATE TABLE monitoring_history (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  customer_id UUID REFERENCES customers(id),
  checked_at TIMESTAMP,
  uses_dhl BOOLEAN,
  checkout_position INTEGER,
  competitor_found BOOLEAN,
  competitor_position INTEGER,
  checkout_html TEXT,
  created_at TIMESTAMP
);
```

#### **customer_notes** ✅
```sql
-- Anteckningar på kunder
CREATE TABLE customer_notes (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  customer_id UUID REFERENCES customers(id),
  note_type VARCHAR(50),
  subject VARCHAR(255),
  content TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

---

### **4. Automation**

#### **cronjobs** ✅
```sql
-- Schemalagda jobb
CREATE TABLE cronjobs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id), -- NULL = global
  name VARCHAR(255),
  schedule VARCHAR(100),
  is_active BOOLEAN,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

---

### **5. Error Handling**

#### **error_reports** ✅
```sql
-- Felrapporter
CREATE TABLE error_reports (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  error_type VARCHAR(100),
  error_message TEXT,
  stack_trace TEXT,
  context JSONB,
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

---

### **6. Deep Analysis (Nya)**

#### **lead_deep_analysis** ✅
```sql
-- Årlig djupanalys av leads
CREATE TABLE lead_deep_analysis (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  analyzed_at TIMESTAMP,
  revenue_check JSONB,
  kronofogden_check JSONB,
  credit_check JSONB,
  tax_check JSONB,
  payment_remarks_check JSONB,
  risk_score INTEGER,
  risk_level VARCHAR(20),
  created_at TIMESTAMP,
  UNIQUE(lead_id)
);
```

---

## ❌ Saknade Tabeller

### **1. tenant_settings** ⚠️ SAKNAS
```sql
-- Tenant-specifika inställningar (t.ex. primary_carrier)
CREATE TABLE IF NOT EXISTS tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Carrier settings
  primary_carrier VARCHAR(50) DEFAULT 'DHL',
  competitor_carriers TEXT[],
  show_competitors BOOLEAN DEFAULT TRUE,
  
  -- Lead pool preferences
  share_leads_enabled BOOLEAN DEFAULT TRUE,
  preferred_segments TEXT[],
  preferred_regions TEXT[],
  preferred_sni_codes TEXT[],
  
  -- Notification settings
  notify_new_shared_leads BOOLEAN DEFAULT TRUE,
  notify_quota_warning BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

CREATE INDEX idx_tenant_settings_tenant ON tenant_settings(tenant_id);
```

### **2. audit_logs** ⚠️ SAKNAS
```sql
-- Audit logging för säkerhet
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### **3. api_quota** ⚠️ SAKNAS
```sql
-- API quota tracking
CREATE TABLE IF NOT EXISTS api_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  api_provider VARCHAR(50) NOT NULL, -- gemini, groq, openai, etc
  month DATE NOT NULL,
  requests_made INTEGER DEFAULT 0,
  requests_limit INTEGER DEFAULT 1000,
  tokens_used BIGINT DEFAULT 0,
  tokens_limit BIGINT DEFAULT 1000000,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, api_provider, month)
);

CREATE INDEX idx_api_quota_tenant ON api_quota(tenant_id);
CREATE INDEX idx_api_quota_month ON api_quota(month);
```

### **4. llm_configurations** ⚠️ SAKNAS (om ni använder LLM management)
```sql
-- LLM konfigurationer
CREATE TABLE IF NOT EXISTS llm_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  api_key_encrypted TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  cost_per_1m_tokens DECIMAL(10,4),
  max_tokens INTEGER,
  temperature DECIMAL(3,2),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **5. shared_lead_access** ⚠️ OPTIONAL
```sql
-- Spåra vilka tenants som har sett vilka delade leads
CREATE TABLE IF NOT EXISTS shared_lead_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  accessed_by_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  accessed_by_user_id UUID REFERENCES users(id),
  access_type VARCHAR(50), -- view, export, contact
  accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shared_lead_access_lead ON shared_lead_access(lead_id);
CREATE INDEX idx_shared_lead_access_tenant ON shared_lead_access(accessed_by_tenant_id);
```

---

## 🔧 Migrations att köra

### **Steg 1: Kör befintliga migrations (i ordning)**
```bash
# I Supabase SQL Editor:

1. 003_multi_tenant_system.sql ✅
2. 004_add_subdomain_to_tenants.sql ✅
3. 005_error_reports_simple.sql ✅
4. add_deep_analysis_table.sql ✅
5. add_financial_metrics.sql ✅
```

### **Steg 2: Kör nya migrations**
```bash
# Skapa dessa nya migrations:

6. add_tenant_settings.sql ⚠️ BEHÖVS
7. add_audit_logs.sql ⚠️ BEHÖVS
8. add_api_quota.sql ⚠️ BEHÖVS
9. add_llm_configurations.sql (optional)
10. add_shared_lead_access.sql (optional)
```

---

## 📊 Verifikation

### **Kolla vilka tabeller som finns:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Kolla kolumner i leads:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;
```

### **Kolla indexes:**
```sql
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

---

## ⚠️ Kritiska Saknade Tabeller

### **MÅSTE ha:**
1. ✅ **tenants** - Finns
2. ✅ **users** - Finns
3. ✅ **leads** - Finns
4. ✅ **customers** - Finns
5. ❌ **tenant_settings** - SAKNAS (behövs för primary_carrier)
6. ❌ **audit_logs** - SAKNAS (behövs för säkerhet)
7. ❌ **api_quota** - SAKNAS (behövs för quota tracking)

### **Bra att ha:**
8. ✅ **lead_deep_analysis** - Finns
9. ✅ **monitoring_history** - Finns
10. ✅ **cronjobs** - Finns
11. ❌ **shared_lead_access** - SAKNAS (optional)

---

## 🚀 Action Items

### **Prioritet 1: Kritiska migrations**
```bash
# Skapa och kör dessa ASAP:
1. add_tenant_settings.sql
2. add_audit_logs.sql
3. add_api_quota.sql
```

### **Prioritet 2: Verifiera befintliga**
```bash
# Kolla att alla kolumner finns:
- leads.financial_metrics
- leads.last_deep_analysis_at
- tenants.subdomain
- users.tenant_id
```

### **Prioritet 3: Optional enhancements**
```bash
# Om tid finns:
- shared_lead_access.sql
- llm_configurations.sql
```

---

## 📝 SQL för att kolla status

```sql
-- Kolla alla tabeller
SELECT 
  t.table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as size
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- Kolla antal rader per tabell
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

Vill du att jag skapar de saknade migrations nu? 🚀
