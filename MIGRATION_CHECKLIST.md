# 📋 Migration Checklist - Supabase

## ❌ Problem
Felet `relation "user_settings" does not exist` betyder att migration **003_multi_tenant_system.sql** inte har körts i Supabase.

---

## ✅ Lösning: Kör Migrations i Rätt Ordning

### **Steg 1: Kolla vilka tabeller som finns**
Kör denna query i Supabase SQL Editor:
```sql
-- Kopiera från: SAFE_TABLE_CHECK.sql
SELECT 
  expected_table,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = expected_table
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  SELECT unnest(ARRAY[
    'tenants',
    'users',
    'user_settings',
    'leads',
    'customers',
    'monitoring_history',
    'customer_notes',
    'customer_monitoring_schedule',
    'cronjobs',
    'tenant_usage',
    'error_reports',
    'tenant_settings',
    'audit_logs',
    'api_quota',
    'shared_lead_access',
    'lead_deep_analysis',
    'notifications',
    'email_queue',
    'batch_analysis_jobs',
    'batch_analysis_items'
  ]) as expected_table
) expected_tables
ORDER BY 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = expected_table
    ) THEN 1
    ELSE 2
  END,
  expected_table;
```

---

### **Steg 2: Kör Migrations i Ordning**

Kör dessa migrations **EN I TAGET** i Supabase SQL Editor:

#### **1. Multi-Tenant System** (VIKTIGT!)
```
📄 server/migrations/003_multi_tenant_system.sql
```
**Skapar:**
- `tenants` tabell
- `user_settings` tabell ⭐ (den som saknas!)
- Uppdaterar `users`, `leads`, `customers` med `tenant_id`

#### **2. Subdomain Support**
```
📄 server/migrations/004_add_subdomain_to_tenants.sql
```

#### **3. Error Reports**
```
📄 server/migrations/005_error_reports_simple.sql
```

#### **4. Tenant Settings**
```
📄 server/migrations/006_add_tenant_settings.sql
```

#### **5. Audit Logs**
```
📄 server/migrations/007_add_audit_logs.sql
```

#### **6. API Quota**
```
📄 server/migrations/008_add_api_quota.sql
```

#### **7. Shared Lead Access**
```
📄 server/migrations/009_add_shared_lead_access.sql
```

#### **8. Notifications**
```
📄 server/migrations/010_add_notifications.sql
```

#### **9. Email Queue**
```
📄 server/migrations/011_add_email_queue.sql
```

#### **10. Checkout Data Columns**
```
📄 server/migrations/012_add_checkout_data_columns.sql
```

#### **11. Batch Analysis Jobs**
```
📄 server/migrations/013_add_batch_analysis_jobs.sql
```

---

### **Steg 3: Verifiera Efter Varje Migration**

Efter varje migration, kör:
```sql
-- Kolla att tabellen skapades
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 🎯 Snabbfix: Kör Endast user_settings

Om du bara vill fixa `user_settings` felet snabbt:

```sql
-- Från migration 003_multi_tenant_system.sql
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- UI Preferences
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'sv',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  
  -- Dashboard preferences
  default_view VARCHAR(50) DEFAULT 'dashboard',
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

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

COMMENT ON TABLE user_settings IS 'Personliga inställningar för varje användare';
```

---

## 📊 Förväntade Tabeller Efter Alla Migrations

| # | Tabell | Migration | Status |
|---|--------|-----------|--------|
| 1 | `tenants` | 003 | ❓ |
| 2 | `users` | (existing) | ✅ |
| 3 | `user_settings` | 003 | ❌ MISSING |
| 4 | `leads` | (existing) | ✅ |
| 5 | `customers` | (existing) | ✅ |
| 6 | `monitoring_history` | (existing) | ✅ |
| 7 | `customer_notes` | (existing) | ✅ |
| 8 | `customer_monitoring_schedule` | (existing) | ✅ |
| 9 | `cronjobs` | 003 | ❓ |
| 10 | `tenant_usage` | 003 | ❓ |
| 11 | `error_reports` | 005 | ❓ |
| 12 | `tenant_settings` | 006 | ❓ |
| 13 | `audit_logs` | 007 | ❓ |
| 14 | `api_quota` | 008 | ❓ |
| 15 | `shared_lead_access` | 009 | ❓ |
| 16 | `lead_deep_analysis` | (existing) | ✅ |
| 17 | `notifications` | 010 | ❓ |
| 18 | `email_queue` | 011 | ❓ |
| 19 | `batch_analysis_jobs` | 013 | ❓ |
| 20 | `batch_analysis_items` | 013 | ❓ |

---

## 🚨 Viktigt!

1. **Kör migrations i ordning** - de är beroende av varandra
2. **Kör EN migration i taget** - verifiera att den lyckades innan nästa
3. **Använd `SAFE_TABLE_CHECK.sql`** istället för `CHECK_ALL_TABLES.sql` - den failar inte på saknade tabeller
4. **Backup först** - om du har viktig data i databasen

---

## 🔍 Debug Commands

```sql
-- Kolla alla existerande tabeller
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Kolla kolumner i en specifik tabell
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_settings'
ORDER BY ordinal_position;

-- Kolla indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'user_settings';
```

---

Kör **migration 003** först för att fixa `user_settings` felet! 🚀
