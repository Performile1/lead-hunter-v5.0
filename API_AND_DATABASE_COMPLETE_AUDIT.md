# 🔍 Komplett API & Databas Audit - Lead Hunter v5.0

## 📊 Översikt

Denna audit identifierar alla API-integrationer och databastabeller som behövs för full systemfunktionalitet.

---

## 🔑 API-nycklar Status

### **✅ IMPLEMENTERADE APIs:**

#### **1. AI & LLM Services**
- ✅ **Gemini (Google)** - `GEMINI_API_KEY`
  - Används i: `allabolagScraperService.js`, `annualMonitoringService.js`
  - Funktion: AI-analys, finansiella nyckeltal
  - Status: Implementerad

- ✅ **Groq** - `GROQ_API_KEY`
  - Används i: `annualMonitoringService.js`
  - Funktion: Snabb AI-analys, fallback
  - Status: Implementerad

- ✅ **OpenAI** - `OPENAI_API_KEY`
  - Används i: Frontend services
  - Funktion: Backup LLM
  - Status: Konfigurerad men ej aktivt använd

- ✅ **Anthropic Claude** - `ANTHROPIC_API_KEY`
  - Används i: Frontend services
  - Funktion: Premium AI-analys
  - Status: Konfigurerad men ej aktivt använd

#### **2. Web Scraping & Crawling**
- ✅ **Firecrawl** - `FIRECRAWL_API_KEY`
  - Används i: `checkoutDetectionService.js`, `allabolagScraperService.js`
  - Funktion: Allabolag scraping, checkout detection
  - Status: Implementerad och aktiv

#### **3. Swedish Business Data**
- ⚠️ **Allabolag API** - `ALLABOLAG_API_KEY`
  - Används i: `realDataService.js`
  - Funktion: Företagsdata, finansiell info
  - Status: Kod finns, men API-nyckel saknas

- ⚠️ **UC (Upplysningscentralen)** - `UC_API_KEY`
  - Används i: `realDataService.js`
  - Funktion: Kreditupplysningar
  - Status: Kod finns, men API-nyckel saknas

- ⚠️ **Tavily Search** - `TAVILY_API_KEY`
  - Används i: `realDataService.js`
  - Funktion: Företagsnyheter
  - Status: Kod finns, men API-nyckel saknas

#### **4. Vercel Integration**
- ✅ **Vercel API** - `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`
  - Används i: `vercelSyncService.js`
  - Funktion: Synka API-nycklar till Vercel
  - Status: Implementerad

---

### **❌ SAKNADE APIs (Kod finns, men ej konfigurerade):**

#### **1. Email & Notifikationer**
- ❌ **Email Service** - `EMAIL_PROVIDER`, `EMAIL_USER`, `EMAIL_PASSWORD`
  - Kod finns i: `emailService.js`
  - Funktion: Välkomstmail, lösenordsåterställning, notifikationer
  - Alternativ:
    - Gmail: `EMAIL_PROVIDER=gmail`
    - Outlook: `EMAIL_PROVIDER=outlook`
    - SendGrid: `EMAIL_PROVIDER=sendgrid`, `SENDGRID_API_KEY`
  - **Status: SAKNAS - Behövs för notifikationer**

#### **2. Tech Analysis**
- ❌ **BuiltWith API** - `BUILTWITH_API_KEY`
  - Funktion: Tech stack analys
  - Status: Ej implementerad

- ❌ **Wappalyzer API** - `WAPPALYZER_API_KEY`
  - Funktion: Website technology detection
  - Status: Ej implementerad

#### **3. Email Verification**
- ❌ **Hunter.io** - `HUNTER_API_KEY`
  - Funktion: Email verification och finding
  - Status: Ej implementerad

#### **4. News & Search**
- ❌ **NewsAPI** - `NEWS_API_KEY`
  - Funktion: Företagsnyheter
  - Status: Ej implementerad (Tavily används istället)

#### **5. Search & Indexing**
- ❌ **Algolia** - `ALGOLIA_APP_ID`, `ALGOLIA_API_KEY`, `ALGOLIA_INDEX_NAME`
  - Funktion: Snabb sökning
  - Status: Ej implementerad

#### **6. Web Scraping (Additional)**
- ❌ **Browse.ai** - `BROWSE_AI_API_KEY`
  - Funktion: Automated web scraping
  - Status: Ej implementerad

- ❌ **Octoparse** - `OCTOPARSE_API_KEY`
  - Funktion: Cloud-based scraping
  - Status: Ej implementerad

---

## 🗄️ Databas Tabeller Status

### **✅ BEFINTLIGA TABELLER:**

#### **Core Tables**
1. ✅ `tenants` - Multi-tenant support
2. ✅ `users` - Användare
3. ✅ `user_settings` - Personliga inställningar
4. ✅ `leads` - Leads med financial_metrics
5. ✅ `customers` - Kunder
6. ✅ `monitoring_history` - Checkout monitoring
7. ✅ `customer_notes` - Kundanteckningar
8. ✅ `cronjobs` - Schemalagda jobb
9. ✅ `tenant_usage` - Användningsstatistik
10. ✅ `error_reports` - Felrapporter

#### **New Tables (från nya migrations)**
11. ✅ `tenant_settings` - Tenant-specifika inställningar
12. ✅ `audit_logs` - Säkerhetsloggning
13. ✅ `api_quota` - API-användning tracking
14. ✅ `shared_lead_access` - Lead-åtkomst tracking
15. ✅ `lead_deep_analysis` - Årlig djupanalys

---

### **❌ SAKNADE TABELLER:**

#### **1. Notifications Table** ⚠️ **KRITISK**
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL, -- new_lead, quota_warning, customer_update, etc
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  data JSONB, -- Additional context
  link VARCHAR(500), -- URL to related resource
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Optional expiration
  
  -- Indexes
  CONSTRAINT notifications_type_check CHECK (type IN (
    'new_lead', 'quota_warning', 'customer_update', 
    'checkout_change', 'error_report', 'system_alert'
  ))
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

#### **2. Email Queue Table** ⚠️ **VIKTIGT**
```sql
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Email details
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  
  -- Attachments
  attachments JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, sending, sent, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Error tracking
  last_error TEXT,
  last_attempt_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  
  -- Priority
  priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
  
  CONSTRAINT email_queue_status_check CHECK (status IN ('pending', 'sending', 'sent', 'failed'))
);

CREATE INDEX idx_email_queue_status ON email_queue(status, priority, created_at);
CREATE INDEX idx_email_queue_tenant ON email_queue(tenant_id);
```

#### **3. Webhook Logs Table** 📋 **OPTIONAL**
```sql
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Webhook details
  event_type VARCHAR(100) NOT NULL, -- lead.created, customer.updated, etc
  webhook_url VARCHAR(500) NOT NULL,
  
  -- Request
  request_payload JSONB NOT NULL,
  request_headers JSONB,
  
  -- Response
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  
  -- Status
  success BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 1,
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_webhook_logs_tenant ON webhook_logs(tenant_id, created_at DESC);
CREATE INDEX idx_webhook_logs_event ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_success ON webhook_logs(success);
```

#### **4. Integration Configs Table** 📋 **OPTIONAL**
```sql
CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Integration details
  integration_type VARCHAR(50) NOT NULL, -- zapier, make, n8n, custom_webhook
  name VARCHAR(255) NOT NULL,
  
  -- Configuration
  webhook_url VARCHAR(500),
  api_key_encrypted TEXT,
  config JSONB, -- Custom configuration per integration
  
  -- Events to trigger
  enabled_events TEXT[], -- ['lead.created', 'customer.updated', etc]
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_integration_configs_tenant ON integration_configs(tenant_id);
CREATE INDEX idx_integration_configs_active ON integration_configs(is_active);
```

#### **5. Checkout Platforms Table** 📋 **OPTIONAL**
```sql
CREATE TABLE IF NOT EXISTS checkout_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Platform details
  name VARCHAR(100) NOT NULL UNIQUE, -- Klarna, Stripe, PayPal, etc
  display_name VARCHAR(100) NOT NULL,
  
  -- Detection patterns
  detection_patterns JSONB, -- Patterns för att identifiera platformen
  
  -- Metadata
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  category VARCHAR(50), -- payment_gateway, checkout_solution, etc
  
  -- Popularity
  market_share DECIMAL(5,2), -- Percentage
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkout_platforms_active ON checkout_platforms(is_active);
```

#### **6. Ecommerce Platforms Table** 📋 **OPTIONAL**
```sql
CREATE TABLE IF NOT EXISTS ecommerce_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Platform details
  name VARCHAR(100) NOT NULL UNIQUE, -- Shopify, WooCommerce, Magento, etc
  display_name VARCHAR(100) NOT NULL,
  
  -- Detection patterns
  detection_patterns JSONB, -- Meta tags, scripts, etc
  
  -- Metadata
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  
  -- Popularity
  market_share DECIMAL(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ecommerce_platforms_active ON ecommerce_platforms(is_active);
```

---

## 🚨 KRITISKA SAKNADE FUNKTIONER

### **1. Notifikationssystem** ⚠️ **HÖGSTA PRIORITET**

**Vad som saknas:**
- ✅ Email service finns (`emailService.js`)
- ✅ Notifications route finns (`notifications.js`)
- ❌ `notifications` tabell saknas i databasen
- ❌ Email credentials saknas (SMTP/SendGrid)

**Vad som behövs:**
1. Kör migration för `notifications` tabell
2. Konfigurera email provider:
   ```env
   # För Gmail:
   EMAIL_PROVIDER=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   
   # ELLER för SendGrid:
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   ```

**Användningsfall:**
- Nya leads notifikationer
- Quota varningar
- Customer updates
- System alerts
- Välkomstmail för nya användare
- Lösenordsåterställning

---

### **2. Email Queue System** ⚠️ **VIKTIGT**

**Vad som saknas:**
- ❌ `email_queue` tabell saknas
- ❌ Background worker för email-skickning

**Vad som behövs:**
1. Kör migration för `email_queue` tabell
2. Implementera background worker (cron job)

**Fördelar:**
- Asynkron email-skickning
- Retry-logik vid misslyckanden
- Prioritering av emails
- Tracking av skickade emails

---

### **3. Swedish Business Data APIs** ⚠️ **REKOMMENDERAT**

**Vad som saknas:**
- ❌ Allabolag API-nyckel
- ❌ UC API-nyckel
- ❌ Tavily API-nyckel

**Nuvarande situation:**
- Kod finns i `realDataService.js`
- Fallback till web scraping med Firecrawl

**Rekommendation:**
1. Skaffa Allabolag API-nyckel för officiell data
2. Alternativt: fortsätt med Firecrawl scraping (fungerar men långsammare)

---

## 📋 Action Plan

### **Prioritet 1: KRITISKT (Gör nu)**

1. **Skapa notifications tabell**
   ```bash
   Kör: server/migrations/010_add_notifications.sql
   ```

2. **Konfigurera email service**
   ```env
   # Lägg till i .env:
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your-key
   EMAIL_FROM=noreply@yourdomain.com
   APP_URL=https://your-app.vercel.app
   ```

3. **Skapa email_queue tabell**
   ```bash
   Kör: server/migrations/011_add_email_queue.sql
   ```

---

### **Prioritet 2: VIKTIGT (Nästa steg)**

4. **Konfigurera Swedish Business Data APIs**
   ```env
   # Lägg till i .env:
   ALLABOLAG_API_KEY=your-allabolag-key
   UC_API_KEY=your-uc-key
   TAVILY_API_KEY=your-tavily-key
   ```

5. **Skapa webhook_logs tabell (om ni vill ha webhooks)**
   ```bash
   Kör: server/migrations/012_add_webhook_logs.sql
   ```

---

### **Prioritet 3: OPTIONAL (Framtida förbättringar)**

6. **Skapa checkout_platforms och ecommerce_platforms tabeller**
   - För bättre tracking av plattformar
   - Seed data med populära plattformar

7. **Implementera integration_configs**
   - För Zapier/Make/n8n integrationer

---

## 📊 Sammanfattning

### **API-nycklar:**
- ✅ **Implementerade:** 4 (Gemini, Groq, Firecrawl, Vercel)
- ⚠️ **Konfigurerade men ej använda:** 3 (Allabolag, UC, Tavily)
- ❌ **Saknas helt:** 1 (Email service)

### **Databas Tabeller:**
- ✅ **Befintliga:** 15 tabeller
- ❌ **Saknas (kritiska):** 2 (notifications, email_queue)
- 📋 **Saknas (optional):** 4 (webhook_logs, integration_configs, checkout_platforms, ecommerce_platforms)

### **Nästa Steg:**
1. ✅ Skapa notifications migration
2. ✅ Skapa email_queue migration
3. ⚠️ Konfigurera email service
4. 📋 Överväg Swedish Business Data APIs

---

Vill du att jag skapar de saknade migrations nu? 🚀
