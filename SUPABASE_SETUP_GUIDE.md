# 🗄️ Supabase Setup Guide - Lead Hunter v5.0

## Översikt

Komplett guide för att sätta upp alla databastabeller i Supabase.

---

## 📋 Migrations att köra (i ordning)

### **Steg 1: Kör huvudmigrations**

Gå till Supabase Dashboard → SQL Editor och kör dessa i ordning:

#### **1. Multi-Tenant System** ✅
```bash
File: server/migrations/003_multi_tenant_system.sql
```
**Skapar:**
- `tenants` - Företag som använder systemet
- `users` - Användare med tenant-koppling
- `user_settings` - Personliga inställningar
- `tenant_usage` - Användningsstatistik
- `monitoring_history` - Checkout-monitoring
- `customer_notes` - Kundanteckningar
- `cronjobs` - Schemalagda jobb

#### **2. Add Subdomain** ✅
```bash
File: server/migrations/004_add_subdomain_to_tenants.sql
```
**Lägger till:**
- `tenants.subdomain` - Unik subdomain per tenant

#### **3. Error Reports** ✅
```bash
File: server/migrations/005_error_reports_simple.sql
```
**Skapar:**
- `error_reports` - Felrapportering

#### **4. Deep Analysis** ✅
```bash
File: server/migrations/add_deep_analysis_table.sql
```
**Skapar:**
- `lead_deep_analysis` - Årlig djupanalys
- `leads.last_deep_analysis_at` - Timestamp

#### **5. Financial Metrics** ✅
```bash
File: server/migrations/add_financial_metrics.sql
```
**Lägger till:**
- `leads.financial_metrics` - Allabolag nyckeltal
- `leads.financial_metrics_updated_at` - Timestamp

---

### **Steg 2: Kör nya migrations (VIKTIGT!)**

#### **6. Tenant Settings** ⚠️ NY
```bash
File: server/migrations/006_add_tenant_settings.sql
```
**Skapar:**
- `tenant_settings` - Tenant-specifika inställningar
  - Primary carrier
  - Lead sharing preferences
  - Notification settings
  - Scraping settings

**Kör denna:**
```sql
-- Kopiera innehållet från 006_add_tenant_settings.sql
-- Klistra in i Supabase SQL Editor
-- Klicka "Run"
```

#### **7. Audit Logs** ⚠️ NY
```bash
File: server/migrations/007_add_audit_logs.sql
```
**Skapar:**
- `audit_logs` - Säkerhetsloggning
- `log_audit()` - Helper function

**Kör denna:**
```sql
-- Kopiera innehållet från 007_add_audit_logs.sql
-- Klistra in i Supabase SQL Editor
-- Klicka "Run"
```

#### **8. API Quota** ⚠️ NY
```bash
File: server/migrations/008_add_api_quota.sql
```
**Skapar:**
- `api_quota` - API-användning per tenant
- `increment_api_usage()` - Helper function
- `is_quota_exceeded()` - Helper function

**Kör denna:**
```sql
-- Kopiera innehållet från 008_add_api_quota.sql
-- Klistra in i Supabase SQL Editor
-- Klicka "Run"
```

#### **9. Shared Lead Access** (OPTIONAL)
```bash
File: server/migrations/009_add_shared_lead_access.sql
```
**Skapar:**
- `shared_lead_access` - Spåra lead-åtkomst
- `log_shared_lead_access()` - Helper function
- `popular_shared_leads` - View

---

## ✅ Verifikation

### **Kolla att alla tabeller finns:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Förväntat resultat (minst dessa):**
- ✅ tenants
- ✅ users
- ✅ user_settings
- ✅ leads
- ✅ customers
- ✅ monitoring_history
- ✅ customer_notes
- ✅ cronjobs
- ✅ tenant_usage
- ✅ error_reports
- ✅ lead_deep_analysis
- ⚠️ tenant_settings (NY)
- ⚠️ audit_logs (NY)
- ⚠️ api_quota (NY)
- 📋 shared_lead_access (OPTIONAL)

---

### **Kolla kolumner i leads:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;
```

**Viktiga kolumner att verifiera:**
- ✅ `tenant_id` (UUID)
- ✅ `financial_metrics` (JSONB)
- ✅ `financial_metrics_updated_at` (TIMESTAMP)
- ✅ `last_deep_analysis_at` (TIMESTAMP)

---

### **Kolla att functions finns:**
```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Förväntat resultat:**
- ✅ `get_user_tenant_id`
- ✅ `is_super_admin`
- ✅ `has_tenant_access`
- ✅ `set_tenant_id_from_user`
- ⚠️ `log_audit` (NY)
- ⚠️ `increment_api_usage` (NY)
- ⚠️ `is_quota_exceeded` (NY)
- 📋 `log_shared_lead_access` (OPTIONAL)

---

## 🔧 Troubleshooting

### **Error: "relation already exists"**
```sql
-- Tabellen finns redan, skippa denna migration
-- Eller använd DROP TABLE om du vill återskapa:
DROP TABLE IF EXISTS table_name CASCADE;
```

### **Error: "column already exists"**
```sql
-- Kolumnen finns redan, skippa denna del
-- Migrations använder IF NOT EXISTS så detta borde inte hända
```

### **Error: "function already exists"**
```sql
-- Använd CREATE OR REPLACE FUNCTION istället
-- Migrations använder redan detta
```

---

## 📊 Test Data

### **Skapa test-tenant:**
```sql
INSERT INTO tenants (
  company_name,
  domain,
  subdomain,
  checkout_search_term,
  main_competitor,
  subscription_tier
) VALUES (
  'Test Transport AB',
  'test.se',
  'test-transport',
  'Test',
  'DHL',
  'basic'
) RETURNING id;
```

### **Skapa test-användare:**
```sql
-- Först, hämta tenant_id från ovan
INSERT INTO users (
  email,
  password_hash,
  full_name,
  role,
  tenant_id,
  status
) VALUES (
  'test@test.se',
  '$2b$10$abcdefghijklmnopqrstuvwxyz', -- Använd bcrypt hash
  'Test User',
  'user',
  'TENANT_ID_FRÅN_OVAN',
  'active'
);
```

---

## 🔐 Säkerhet

### **Row Level Security (RLS)**

Om du vill aktivera RLS för tenant-isolation:

```sql
-- Aktivera RLS på leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Användare ser endast sina tenant's leads
CREATE POLICY tenant_isolation_policy ON leads
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Super admins ser allt
CREATE POLICY super_admin_policy ON leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
        AND is_super_admin = true
    )
  );
```

**Upprepa för andra tabeller:**
- customers
- monitoring_history
- customer_notes
- etc.

---

## 📈 Indexering

### **Kolla befintliga index:**
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### **Lägg till extra index vid behov:**
```sql
-- Om queries är långsamma på leads.segment
CREATE INDEX IF NOT EXISTS idx_leads_segment ON leads(segment);

-- Om queries är långsamma på leads.revenue_tkr
CREATE INDEX IF NOT EXISTS idx_leads_revenue ON leads(revenue_tkr DESC);

-- Om queries är långsamma på leads.created_at
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
```

---

## 🔄 Backup

### **Exportera data:**
```bash
# Från Supabase Dashboard:
# Settings → Database → Backups → Create Backup

# Eller via pg_dump:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### **Importera data:**
```bash
psql $DATABASE_URL < backup_20251218.sql
```

---

## 📝 Nästa Steg

1. ✅ Kör alla migrations i ordning
2. ✅ Verifiera att alla tabeller finns
3. ✅ Verifiera att alla kolumner finns
4. ✅ Verifiera att alla functions finns
5. ✅ Skapa test-data
6. ✅ Testa applikationen
7. 📋 Aktivera RLS (optional)
8. 📋 Sätt upp backups

---

## 🆘 Support

### **Supabase Dashboard:**
```
https://app.supabase.com/project/YOUR_PROJECT_ID
```

### **SQL Editor:**
```
Dashboard → SQL Editor → New Query
```

### **Logs:**
```
Dashboard → Logs → Postgres Logs
```

---

## ✅ Checklist

- [ ] Kör migration 003_multi_tenant_system.sql
- [ ] Kör migration 004_add_subdomain_to_tenants.sql
- [ ] Kör migration 005_error_reports_simple.sql
- [ ] Kör migration add_deep_analysis_table.sql
- [ ] Kör migration add_financial_metrics.sql
- [ ] Kör migration 006_add_tenant_settings.sql ⚠️ NY
- [ ] Kör migration 007_add_audit_logs.sql ⚠️ NY
- [ ] Kör migration 008_add_api_quota.sql ⚠️ NY
- [ ] Kör migration 009_add_shared_lead_access.sql (optional)
- [ ] Verifiera alla tabeller finns
- [ ] Verifiera alla kolumner finns
- [ ] Verifiera alla functions finns
- [ ] Skapa test-tenant
- [ ] Skapa test-användare
- [ ] Testa applikationen

---

Lycka till! 🚀
