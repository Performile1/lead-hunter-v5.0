# 🔧 Lead Hunter v5.0 - Intern Färdigställande Checklista

**Syfte:** Intern checklista för utvecklingsteamet att färdigställa systemet  
**Målgrupp:** Utvecklare, inte slutanvändare  
**Version:** 5.0  
**Datum:** 2025-12-17

---

## 📊 **EXECUTIVE SUMMARY**

### **Systemstatus: 85% Färdigt**

**✅ Färdigt:**
- Request Queue System
- Quota Management
- API Key Configuration
- Firecrawl Integration (alla 4 endpoints)
- LeadCard med full data
- Admin-paneler (20 komponenter)

**⚠️ Behöver åtgärdas:**
- Puppeteer/Crawl4AI backend saknas
- Vissa settings-sidor saknas för vissa roller
- API-nycklar inte konfigurerade i Vercel
- Dokumentation fragmenterad (66+ filer)

**🔴 Kritiska problem:**
- Crawl4AI kräver backend (Python)
- Puppeteer importeras men används inte fullt ut
- Vissa dokumenterade features inte implementerade

---

## 🔑 **FAS 1: API-NYCKLAR AUDIT**

### **1.1 Frontend API-nycklar (.env i ROOT)**

#### **🔴 KRITISKA (Måste läggas till):**

- [ ] **VITE_GEMINI_API_KEY**
  - **Status:** ✅ Konfigurerad
  - **Vercel:** ❌ Behöver läggas till
  - **Kostnad:** Gratis (20 req/dag)
  - **Används i:** `geminiService.ts`, `aiOrchestrator.ts`

- [ ] **VITE_GROQ_API_KEY**
  - **Status:** ⚠️ Ogiltig nyckel (401)
  - **Vercel:** ❌ Behöver läggas till
  - **Åtgärd:** Skaffa ny nyckel från https://console.groq.com/keys
  - **Kostnad:** Gratis (14,400 req/dag)
  - **Används i:** `groqService.ts`, `geminiService.ts` (fallback)

#### **🟡 REKOMMENDERADE (Bör läggas till):**

- [ ] **VITE_FIRECRAWL_API_KEY**
  - **Status:** ✅ Har nyckel (`fc-0fe3e552a23248159a621397d9a29b1b`)
  - **Vercel:** ❌ Behöver läggas till
  - **Kostnad:** Freemium (500 credits/månad)
  - **Används i:** `firecrawlService.ts`, `allabolagScraper.ts`
  - **Endpoints:** scrape, crawl, extract, search (alla implementerade)

- [ ] **VITE_DEEPSEEK_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Vercel:** ❌ Behöver läggas till
  - **Kostnad:** $0.14/1M tokens
  - **Används i:** `deepseekService.ts`, `aiOrchestrator.ts`
  - **Prioritet:** Medel (backup AI)

- [ ] **VITE_ALGOLIA_APP_ID**
- [ ] **VITE_ALGOLIA_API_KEY**
- [ ] **VITE_ALGOLIA_INDEX_NAME**
  - **Status:** ❌ Inte konfigurerade
  - **Vercel:** ❌ Behöver läggas till
  - **Kostnad:** Gratis (10,000 records)
  - **Används i:** `algoliaService.ts`
  - **Problem:** ⚠️ Service finns men INTE integrerad i UI
  - **Åtgärd:** Integrera i `SuperAdminLeadSearch.tsx` ELLER ta bort

#### **🟢 VALFRIA (Nice to have):**

- [ ] **VITE_CLAUDE_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Vercel:** ❌ Inte nödvändig än
  - **Kostnad:** $3-15/1M tokens (dyrast)
  - **Används i:** `claudeService.ts`
  - **Problem:** ⚠️ Service finns men INTE integrerad i `aiOrchestrator.ts`

- [ ] **VITE_OCTOPARSE_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Används i:** `octoparseService.ts`, `allabolagScraper.ts` (fallback)
  - **Problem:** ⚠️ Service finns men används INTE

- [ ] **VITE_BROWSE_AI_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Används i:** `browseAiService.ts`
  - **Problem:** ⚠️ Service finns men INTE integrerad i `aiOrchestrator.ts`

- [ ] **VITE_TANDEM_AI_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Används i:** `tandemAiService.ts`
  - **Problem:** ⚠️ Service finns men INTE integrerad i `aiOrchestrator.ts`

#### **📊 SVENSKA AFFÄRSDATA (Valfritt, betald):**

- [ ] **VITE_RATSIT_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Används i:** `dataSourceServices.ts`
  - **Problem:** ⚠️ Endast stub, ingen faktisk implementation

- [ ] **VITE_UC_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Används i:** `dataSourceServices.ts`
  - **Problem:** ⚠️ Endast stub, ingen faktisk implementation

- [ ] **VITE_BUILTWITH_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Används i:** `dataSourceServices.ts`
  - **Problem:** ⚠️ Endast stub, ingen faktisk implementation

- [ ] **VITE_WAPPALYZER_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Används i:** `dataSourceServices.ts`
  - **Problem:** ⚠️ Endast stub, ingen faktisk implementation

- [ ] **VITE_HUNTER_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Kostnad:** Freemium (50 req/månad)
  - **Används i:** `dataSourceServices.ts`
  - **Problem:** ⚠️ Endast stub, ingen faktisk implementation

- [ ] **VITE_NEWS_API_KEY**
  - **Status:** ❌ Inte konfigurerad
  - **Kostnad:** Gratis (100 req/dag)
  - **Används i:** `dataSourceServices.ts`, `newsApiService.ts`

#### **🔧 CRAWL4AI (Speciell hantering):**

- [ ] **VITE_CRAWL4AI_ENABLED**
  - **Status:** ❌ Inte konfigurerad
  - **Värde:** `true` eller `false`
  - **Problem:** 🔴 Kräver Python backend
  - **Används i:** `crawl4aiService.ts`, `hybridScraperService.ts`
  - **Åtgärd:** Se Fas 4 för implementation

### **1.2 Backend API-nycklar (server/.env)**

#### **Endast om backend används:**

- [ ] **DATABASE_URL**
  - **Status:** ✅ Konfigurerad (PostgreSQL)
  - **Vercel:** ✅ Ska läggas till i Vercel Environment Variables

- [ ] **JWT_SECRET**
  - **Status:** ❓ Okänd
  - **Vercel:** ✅ Behöver läggas till
  - **Åtgärd:** Generera stark secret

- [ ] **GEMINI_API_KEY** (utan VITE_ prefix)
  - **Status:** ❌ Inte nödvändig (frontend-only app)
  - **Åtgärd:** Ta bort från dokumentation

- [ ] **GROQ_API_KEY** (utan VITE_ prefix)
  - **Status:** ❌ Inte nödvändig (frontend-only app)
  - **Åtgärd:** Ta bort från dokumentation

### **1.3 Vercel Environment Variables**

#### **Åtgärdslista:**

- [ ] **Logga in på Vercel Dashboard**
  - URL: https://vercel.com/dashboard
  - Projekt: lead-hunter-v5.0

- [ ] **Navigera till Settings → Environment Variables**

- [ ] **Lägg till ALLA VITE_ variabler:**
  ```
  VITE_GEMINI_API_KEY=AIzaSy...
  VITE_GROQ_API_KEY=gsk_...
  VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
  VITE_DEEPSEEK_API_KEY=...
  VITE_ALGOLIA_APP_ID=...
  VITE_ALGOLIA_API_KEY=...
  VITE_ALGOLIA_INDEX_NAME=leads
  ```

- [ ] **Lägg till DATABASE_URL (om backend används)**

- [ ] **Sätt Environment för varje variabel:**
  - Production ✅
  - Preview ✅
  - Development ❌ (använd lokal .env)

- [ ] **Redeploy efter att ha lagt till variabler**

---

## ⚙️ **FAS 2: SETTINGS-SIDOR AUDIT**

### **2.1 Befintliga Settings-komponenter**

#### **✅ Implementerade:**

1. **SuperAdminSettings.tsx**
   - **Roller:** Super Admin
   - **Innehåll:** Globala systeminställningar
   - **Status:** ✅ Komplett

2. **LLMConfigPanel.tsx**
   - **Roller:** Super Admin
   - **Innehåll:** AI-modell konfiguration
   - **Status:** ✅ Komplett

3. **TenantSegmentConfig.tsx**
   - **Roller:** Super Admin, Tenant Admin
   - **Innehåll:** Segment-konfiguration per tenant
   - **Status:** ✅ Komplett

4. **SalesTerritoryManager.tsx**
   - **Roller:** Super Admin, Manager
   - **Innehåll:** Geografisk territorieindelning
   - **Status:** ✅ Komplett

5. **CronJobsPanel.tsx**
   - **Roller:** Super Admin
   - **Innehåll:** Schemalagda jobb
   - **Status:** ✅ Komplett

6. **RequestQueueMonitor.tsx**
   - **Roller:** Super Admin, Admin
   - **Innehåll:** Request queue övervakning
   - **Status:** ✅ Komplett

### **2.2 Saknade Settings-sidor per Roll**

#### **🔴 Super Admin:**

- [ ] **API Keys Management Panel**
  - **Saknas:** Ja
  - **Behövs:** Ja
  - **Innehåll:**
    - Lista alla konfigurerade API-nycklar
    - Visa status (giltig/ogiltig)
    - Testa API-nycklar
    - Rotera nycklar
    - Visa användningsstatistik
  - **Fil:** `src/components/admin/APIKeysPanel.tsx`
  - **Prioritet:** 🔴 Hög

- [ ] **Scraping Configuration Panel**
  - **Saknas:** Delvis (finns i SuperAdminSettings men inte dedikerad)
  - **Behövs:** Ja
  - **Innehåll:**
    - Välj scraping-metod (Traditional/AI/Hybrid)
    - Konfigurera Puppeteer settings
    - Konfigurera Crawl4AI settings
    - Cache-inställningar
    - Timeout och retries
  - **Fil:** `src/components/admin/ScrapingConfigPanel.tsx`
  - **Prioritet:** 🟡 Medel

- [ ] **Quota Management Panel**
  - **Saknas:** Ja
  - **Behövs:** Ja
  - **Innehåll:**
    - Visa aktuell quota-användning per service
    - Sätt varningar vid X% användning
    - Historik över quota exhaustion
    - Automatiska åtgärder vid quota-slut
  - **Fil:** `src/components/admin/QuotaManagementPanel.tsx`
  - **Prioritet:** 🟡 Medel

#### **🟡 Tenant Admin:**

- [ ] **Tenant Settings**
  - **Saknas:** Delvis
  - **Behövs:** Ja
  - **Innehåll:**
    - Företagsinformation
    - Logotyp upload
    - Färgtema
    - E-postsignaturer
    - Notifikationsinställningar
  - **Fil:** `src/components/admin/TenantSettings.tsx`
  - **Prioritet:** 🟡 Medel

- [ ] **Tenant User Preferences**
  - **Saknas:** Ja
  - **Behövs:** Ja
  - **Innehåll:**
    - Standardvyer
    - Kolumnval i tabeller
    - Notifikationspreferenser
    - Språkinställningar
  - **Fil:** `src/components/admin/TenantUserPreferences.tsx`
  - **Prioritet:** 🟢 Låg

#### **🟢 Manager:**

- [ ] **Team Settings**
  - **Saknas:** Ja
  - **Behövs:** Ja
  - **Innehåll:**
    - Team-mål
    - KPI-inställningar
    - Rapporteringsfrekvens
    - Team-notifikationer
  - **Fil:** `src/components/admin/TeamSettings.tsx`
  - **Prioritet:** 🟢 Låg

#### **🟢 Säljare (FS/TS/KAM/DM):**

- [ ] **Personal Settings**
  - **Saknas:** Ja
  - **Behövs:** Ja
  - **Innehåll:**
    - Profilinformation
    - Notifikationspreferenser
    - Snabbval/favoriter
    - Personlig dashboard-layout
  - **Fil:** `src/components/settings/PersonalSettings.tsx`
  - **Prioritet:** 🟢 Låg

### **2.3 Åtgärdslista Settings:**

- [ ] **Skapa APIKeysPanel.tsx** (Prioritet: Hög)
- [ ] **Skapa ScrapingConfigPanel.tsx** (Prioritet: Medel)
- [ ] **Skapa QuotaManagementPanel.tsx** (Prioritet: Medel)
- [ ] **Skapa TenantSettings.tsx** (Prioritet: Medel)
- [ ] **Integrera alla panels i routing**
- [ ] **Lägg till rollbaserad åtkomstkontroll**

---

## 🕷️ **FAS 3: PUPPETEER & CRAWL4AI AUDIT**

### **3.1 Puppeteer Status**

#### **Implementation:**

**Fil:** `services/hybridScraperService.ts`

**Status:** ✅ Implementerad men ⚠️ Används inte fullt ut

**Funktioner:**
- ✅ `scrapeTraditional()` - Puppeteer scraping
- ✅ `detectEcommercePlatform()` - Detektera e-handelsplattform
- ✅ `findShippingProviders()` - Hitta leverantörer
- ✅ `detectTechnologies()` - Detektera teknologier
- ✅ `findMarkets()` - Hitta marknader

**Problem:**
1. ❌ **Puppeteer importeras men används inte i production**
   - `import puppeteer from 'puppeteer'` finns
   - Men `HybridScraperService` instansieras inte i andra services

2. ❌ **Ingen integration i geminiService.ts**
   - Website analysis använder inte `HybridScraperService`
   - Använder istället enklare scraping

3. ❌ **Ingen admin-panel för konfiguration**
   - Användare kan inte välja scraping-metod
   - Ingen cache-hantering i UI

**Åtgärder:**

- [ ] **Integrera HybridScraperService i geminiService.ts**
  ```typescript
  // I geminiService.ts
  import { HybridScraperService } from './hybridScraperService';
  
  const scraper = new HybridScraperService({
    method: 'traditional', // eller 'ai' eller 'hybrid'
    cacheEnabled: true
  });
  
  const websiteData = await scraper.analyzeWebsite(url);
  ```

- [ ] **Skapa ScrapingConfigPanel.tsx**
  - Låt admin välja metod (Traditional/AI/Hybrid)
  - Konfigurera timeout, retries, cache

- [ ] **Lägg till Puppeteer i package.json dependencies**
  - Verifiera att Puppeteer är installerad
  - Testa att det fungerar i production (Vercel)

- [ ] **Hantera Puppeteer i Vercel**
  - Problem: Vercel har begränsningar för Puppeteer
  - Lösning: Använd `@sparticuz/chromium` för Vercel
  - Eller: Kör Puppeteer i separat serverless function

### **3.2 Crawl4AI Status**

#### **Implementation:**

**Fil:** `services/crawl4aiService.ts`

**Status:** ⚠️ Stub implementation - Kräver backend

**Funktioner:**
- ✅ `crawlWithAI()` - AI-powered crawling
- ✅ `extractStructuredDataWithAI()` - Strukturerad extraktion
- ✅ `crawlCompanyWebsite()` - Företagswebbplats crawling
- ✅ `batchCrawl()` - Batch crawling
- ✅ `smartCrawl()` - Smart crawling med auto-schema

**Problem:**
1. 🔴 **Kräver Python backend**
   - Crawl4AI är ett Python-bibliotek
   - Kan inte köras direkt i browser
   - Behöver backend API endpoint

2. ❌ **Backend API saknas**
   - `/api/crawl4ai/scrape` finns inte
   - Behöver implementeras som serverless function eller separat backend

3. ❌ **Fallback till traditional scraping**
   - `scrapeWithAI()` fallback till `scrapeTraditional()`
   - Men `scrapeTraditional()` finns inte i `crawl4aiService.ts`

**Åtgärder:**

#### **Alternativ 1: Implementera Python Backend (Rekommenderat)**

- [ ] **Skapa Python backend med FastAPI**
  ```python
  # backend/crawl4ai_server.py
  from fastapi import FastAPI
  from crawl4ai import Crawler
  
  app = FastAPI()
  
  @app.post("/api/crawl4ai/scrape")
  async def scrape(url: str, schema: dict):
      crawler = Crawler()
      result = await crawler.crawl(url, extraction_schema=schema)
      return result
  ```

- [ ] **Deploy Python backend**
  - Alternativ: Vercel Serverless Functions (Python)
  - Alternativ: Separat server (Railway, Render, Heroku)
  - Alternativ: Docker container

- [ ] **Uppdatera crawl4aiService.ts**
  ```typescript
  const response = await fetch('https://your-backend.com/api/crawl4ai/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, schema })
  });
  ```

#### **Alternativ 2: Ta bort Crawl4AI (Enklare)**

- [ ] **Ta bort `crawl4aiService.ts`**
- [ ] **Ta bort referenser i `hybridScraperService.ts`**
- [ ] **Uppdatera dokumentation**
- [ ] **Använd endast Puppeteer + Firecrawl**

**Rekommendation:** Alternativ 2 (Ta bort) för nu, implementera Alternativ 1 senare om behov finns.

### **3.3 Hybrid Scraper Integration**

**Åtgärder:**

- [ ] **Integrera i geminiService.ts**
  - Ersätt enkel scraping med `HybridScraperService`
  - Använd cache för att minska API-anrop

- [ ] **Lägg till i aiOrchestrator.ts**
  - Välj scraping-metod baserat på tillgänglighet
  - Fallback-kedja: Firecrawl → Puppeteer → Crawl4AI

- [ ] **Skapa admin-panel för scraping-konfiguration**
  - Välj metod (Traditional/AI/Hybrid)
  - Konfigurera cache, timeout, retries

---

## 📊 **FAS 4: LEADCARD DATA AUDIT**

### **4.1 LeadCard Data Fields**

**Fil:** `components/LeadCard.tsx` (1329 rader)

#### **✅ Implementerade fält:**

**Grundläggande:**
- ✅ Företagsnamn (`companyName`)
- ✅ Org.nummer (`orgNumber`)
- ✅ Adress (`address`)
- ✅ Telefon (`phone`)
- ✅ E-post (`email`)
- ✅ Webbplats (`websiteUrl`)

**Ekonomi:**
- ✅ Omsättning (`revenue`) - Med formatering (tkr/MSEK/mdSEK)
- ✅ Kreditbetyg (`creditRatingLabel`, `creditRatingDescription`)
- ✅ Fraktbudget (`freightBudget`) - Beräknad från omsättning
- ✅ Segment (`segment`) - A/B/C/D baserat på omsättning
- ✅ Finansiell historik (`financialRecords`)

**Beslutsfattare:**
- ✅ VD, CFO, Logistikchef (`decisionMakers`)
- ✅ LinkedIn-länkar
- ✅ E-post och telefon per person

**E-handel:**
- ✅ E-handelsplattform (`ecommercePlatform`)
- ✅ Leverantörer (`carriers`)
- ✅ DHL-användning (`usesDhl`)
- ✅ Checkout-position (`checkoutPosition`)
- ✅ Teknologier (`technologies`)

**Analys:**
- ✅ Opportunity Score (`opportunityScore`)
- ✅ Sales Pitch (`salesPitch`)
- ✅ Triggers (`triggers`)
- ✅ Competitive Intelligence (`competitiveIntelligence`)

**Metadata:**
- ✅ Källänkar (`sourceLinks`)
- ✅ Analysdatum (`analysisDate`)
- ✅ Senaste nyheter (`latestNews`)

### **4.2 Data Integration Status**

#### **✅ Fungerar:**

1. **Allabolag Data**
   - **Service:** `allabolagScraper.ts`
   - **Integration:** ✅ Fungerar
   - **Data:** Omsättning, org.nummer, adress, styrelse
   - **Källa:** Firecrawl → Octoparse fallback

2. **Gemini AI Analysis**
   - **Service:** `geminiService.ts`
   - **Integration:** ✅ Fungerar
   - **Data:** Sales pitch, opportunity score, triggers
   - **Fallback:** Groq (om quota slut)

3. **Kronofogden Check**
   - **Service:** `kronofogdenService.ts`
   - **Integration:** ✅ Fungerar
   - **Data:** Betalningsanmärkningar, konkurser

4. **Website Analysis**
   - **Service:** `geminiService.ts` + `techAnalysisService.ts`
   - **Integration:** ✅ Fungerar
   - **Data:** E-handelsplattform, teknologier, leverantörer

#### **⚠️ Delvis fungerar:**

1. **LinkedIn Search**
   - **Service:** `linkedinService.ts`
   - **Integration:** ⚠️ Delvis
   - **Problem:** Kräver manuell sökning, ingen automatisk scraping
   - **Data:** Länkar till profiler, men inte fullständig data

2. **News Search**
   - **Service:** `newsApiService.ts`
   - **Integration:** ⚠️ Delvis
   - **Problem:** NewsAPI-nyckel inte konfigurerad
   - **Data:** Senaste nyheter om företaget

#### **❌ Fungerar inte:**

1. **Ratsit Data**
   - **Service:** `dataSourceServices.ts`
   - **Integration:** ❌ Endast stub
   - **Problem:** API-nyckel saknas, ingen implementation
   - **Data:** Kreditbetyg, finansiell info

2. **UC Data**
   - **Service:** `dataSourceServices.ts`
   - **Integration:** ❌ Endast stub
   - **Problem:** API-nyckel saknas, ingen implementation
   - **Data:** Kreditrapporter

3. **BuiltWith Data**
   - **Service:** `dataSourceServices.ts`
   - **Integration:** ❌ Endast stub
   - **Problem:** API-nyckel saknas, ingen implementation
   - **Data:** Teknisk stack

4. **Hunter.io Data**
   - **Service:** `dataSourceServices.ts`
   - **Integration:** ❌ Endast stub
   - **Problem:** API-nyckel saknas, ingen implementation
   - **Data:** E-postadresser

### **4.3 Åtgärder LeadCard:**

- [ ] **Verifiera att alla fält renderas korrekt**
  - Testa med olika datamängder
  - Kontrollera edge cases (null, undefined, tomma arrayer)

- [ ] **Lägg till fallback-värden**
  - Om data saknas, visa "Ej tillgängligt" istället för tomt

- [ ] **Förbättra error handling**
  - Visa tydliga felmeddelanden om data inte kan hämtas
  - Lägg till retry-knappar

- [ ] **Implementera saknade data sources**
  - Ratsit, UC, BuiltWith, Hunter.io
  - Eller ta bort från UI om inte används

- [ ] **Lägg till data validation**
  - Validera org.nummer (10 siffror)
  - Validera omsättning (rimligt värde)
  - Validera e-post och telefonnummer

---

## 📚 **FAS 5: DOKUMENTATIONS AUDIT**

### **5.1 Dokumentationsstatus**

**Totalt:** 66+ markdown-filer

#### **✅ Uppdaterade och korrekta:**

1. **README.md** (90% korrekt)
   - ⚠️ Version säger "4.4" → Bör vara "5.0"
   - ⚠️ "Backend API: 100%" → Bör vara "Minimal (Frontend-focused)"

2. **REQUEST_QUEUE_README.md** (100% korrekt)
   - ✅ Nyligen skapad
   - ✅ Komplett dokumentation

3. **QUOTA_FIX_GUIDE.md** (100% korrekt)
   - ✅ Nyligen skapad
   - ✅ Steg-för-steg lösningar

4. **API_KEY_CLEANUP_GUIDE.md** (100% korrekt)
   - ✅ Nyligen skapad
   - ✅ Tydlig VITE_ prefix förklaring

5. **FIRECRAWL_COMPLETE_GUIDE.md** (100% korrekt)
   - ✅ Nyligen skapad
   - ✅ Alla 4 endpoints dokumenterade

6. **DOCUMENTATION_STATUS_REPORT.md** (100% korrekt)
   - ✅ Nyligen skapad
   - ✅ Komplett audit

7. **DATA_ORCHESTRATOR_README.md** (95% korrekt)
   - ✅ Protokoll-baserad design
   - ✅ Fallback-kedjor

8. **DHL_CORPORATE_IDENTITY.md** (100% korrekt)
   - ✅ Färger, logotyp, branding

9. **COLOR_SYSTEM.md** (100% korrekt)
   - ✅ Färgpalett definierad

#### **⚠️ Behöver uppdatering:**

1. **AI_SERVICES_README.md** (85% korrekt)
   - ❌ Saknar Request Queue dokumentation
   - ❌ Saknar Quota Management
   - ⚠️ Tandem.ai/Browse.ai markerade som "New" men inte integrerade

2. **API_KEYS_GUIDE.md** (70% korrekt)
   - ❌ Använder gamla format (utan VITE_ prefix)
   - ❌ Nämner inte vite.config.ts cleanup

3. **TROUBLESHOOTING.md** (60% korrekt)
   - ❌ Saknar Vite cache clearing
   - ❌ Saknar Request Queue troubleshooting
   - ❌ Saknar QuotaExhaustedModal usage

4. **INSTALLATION.md** (80% korrekt)
   - ❌ Refererar till `server/.env` istället för `.env` i root

#### **❌ Utdaterade:**

1. **REAL_DATA_SETUP.md**
   - ❌ Refererar till gamla environment variable paths

2. **VERCEL_ENV_SETUP.md**
   - ❌ Gamla environment variabler

3. **docs_archive/** (40+ filer)
   - ❌ Helt utdaterade
   - ✅ Redan arkiverade

### **5.2 Dokumentations Åtgärder:**

#### **Prioritet 1: Uppdatera Core Docs (2-3h)**

- [ ] **README.md**
  - Ändra version till "5.0"
  - Uppdatera backend-status till "Minimal (Frontend-focused)"
  - Lägg till Request Queue i features

- [ ] **AI_SERVICES_README.md**
  - Lägg till Request Queue section
  - Lägg till Quota Management section
  - Markera Tandem.ai/Browse.ai som "Planned" istället för "New"

- [ ] **TROUBLESHOOTING.md**
  - Lägg till Vite cache clearing
  - Lägg till Request Queue troubleshooting
  - Referera till QUOTA_FIX_GUIDE.md

- [ ] **API_KEYS_GUIDE.md**
  - Uppdatera till VITE_ prefix format
  - Lägg till vite.config.ts cleanup info
  - Referera till API_KEY_CLEANUP_GUIDE.md

#### **Prioritet 2: Konsolidera (4-6h)**

**Mål:** Minska från 66 filer till 10-15 huvudguider

**Föreslagna huvudguider:**

1. **README.md** - Översikt & snabbstart
2. **SETUP_GUIDE.md** - Installation & konfiguration
3. **API_SERVICES_GUIDE.md** - AI & externa APIs (konsolidera AI_SERVICES_README.md + API_KEYS_GUIDE.md)
4. **DATA_SOURCES_GUIDE.md** - Datakällor & scraping (konsolidera DATA_ORCHESTRATOR_README.md + WEBSITE_SCRAPING_GUIDE.md)
5. **QUOTA_MANAGEMENT_GUIDE.md** - Request queue & rate limiting (konsolidera REQUEST_QUEUE_README.md + QUOTA_FIX_GUIDE.md)
6. **USER_GUIDE.md** - Användarmanual
7. **ADMIN_GUIDE.md** - Admin-funktioner (konsolidera alla admin-guider)
8. **DEVELOPER_GUIDE.md** - Utvecklingsdokumentation
9. **TROUBLESHOOTING.md** - Felsökning
10. **CHANGELOG.md** - Versionshistorik

**Åtgärder:**

- [ ] **Skapa nya konsoliderade guider**
- [ ] **Flytta gamla filer till docs_archive/**
- [ ] **Uppdatera länkar i README.md**
- [ ] **Ta bort dubbletter**

#### **Prioritet 3: Ta bort eller implementera (2-4h)**

**Dokumenterade men INTE implementerade features:**

- [ ] **Algolia Search**
  - **Åtgärd:** Integrera i SuperAdminLeadSearch.tsx ELLER ta bort från dokumentation
  
- [ ] **UC/Ratsit APIs**
  - **Åtgärd:** Implementera faktiska API-anrop ELLER markera som "Requires API Key"
  
- [ ] **Tandem.ai/Browse.ai**
  - **Åtgärd:** Integrera i aiOrchestrator.ts ELLER ta bort från dokumentation
  
- [ ] **Crawl4AI**
  - **Åtgärd:** Implementera Python backend ELLER ta bort och använd endast Puppeteer + Firecrawl

---

## 🚀 **FAS 6: FÖRBÄTTRINGAR & REKOMMENDATIONER**

### **6.1 Kritiska Förbättringar**

#### **🔴 Prioritet 1: API Key Management**

**Problem:** Ingen UI för att hantera API-nycklar

**Lösning:**
- [ ] Skapa `APIKeysPanel.tsx`
- [ ] Visa status för alla nycklar (giltig/ogiltig)
- [ ] Testa nycklar direkt i UI
- [ ] Visa användningsstatistik
- [ ] Varningar vid quota-gränser

**Estimerad tid:** 4-6h

#### **🔴 Prioritet 2: Groq API Key Fix**

**Problem:** Groq-nyckel är ogiltig (401 Unauthorized)

**Lösning:**
- [ ] Skaffa ny nyckel från https://console.groq.com/keys
- [ ] Uppdatera `.env`: `VITE_GROQ_API_KEY=gsk_...`
- [ ] Uppdatera Vercel Environment Variables
- [ ] Testa att fallback fungerar

**Estimerad tid:** 15 minuter

#### **🔴 Prioritet 3: Vercel Environment Variables**

**Problem:** API-nycklar inte konfigurerade i Vercel

**Lösning:**
- [ ] Logga in på Vercel Dashboard
- [ ] Lägg till alla VITE_ variabler
- [ ] Redeploy
- [ ] Testa i production

**Estimerad tid:** 30 minuter

### **6.2 Viktiga Förbättringar**

#### **🟡 Prioritet 4: Scraping Configuration**

**Problem:** Ingen UI för att konfigurera scraping

**Lösning:**
- [ ] Skapa `ScrapingConfigPanel.tsx`
- [ ] Välj metod (Traditional/AI/Hybrid)
- [ ] Konfigurera cache, timeout, retries
- [ ] Integrera `HybridScraperService` i geminiService.ts

**Estimerad tid:** 6-8h

#### **🟡 Prioritet 5: Quota Management Panel**

**Problem:** Ingen realtidsövervakning av quota

**Lösning:**
- [ ] Skapa `QuotaManagementPanel.tsx`
- [ ] Visa aktuell användning per service
- [ ] Sätt varningar vid X% användning
- [ ] Historik över quota exhaustion
- [ ] Automatiska åtgärder vid quota-slut

**Estimerad tid:** 4-6h

#### **🟡 Prioritet 6: Dokumentations Konsolidering**

**Problem:** 66+ filer, svårt att hitta information

**Lösning:**
- [ ] Konsolidera till 10-15 huvudguider
- [ ] Flytta gamla filer till docs_archive/
- [ ] Uppdatera länkar
- [ ] Ta bort dubbletter

**Estimerad tid:** 4-6h

### **6.3 Nice-to-Have Förbättringar**

#### **🟢 Prioritet 7: Crawl4AI Implementation**

**Problem:** Crawl4AI är stub, kräver backend

**Lösning:**
- [ ] Implementera Python backend med FastAPI
- [ ] Deploy backend (Vercel/Railway/Render)
- [ ] Uppdatera crawl4aiService.ts
- [ ] Testa integration

**Estimerad tid:** 8-12h

**Alternativ:** Ta bort Crawl4AI och använd endast Puppeteer + Firecrawl (2h)

#### **🟢 Prioritet 8: Algolia Integration**

**Problem:** Service finns men inte integrerad i UI

**Lösning:**
- [ ] Integrera i SuperAdminLeadSearch.tsx
- [ ] Lägg till Algolia-sökning som alternativ
- [ ] Indexera befintliga leads
- [ ] Testa sökprestanda

**Estimerad tid:** 4-6h

**Alternativ:** Ta bort Algolia-service (1h)

#### **🟢 Prioritet 9: Svenska Data APIs**

**Problem:** Ratsit, UC, BuiltWith, Hunter.io är stubs

**Lösning:**
- [ ] Skaffa API-nycklar
- [ ] Implementera faktiska API-anrop
- [ ] Integrera i dataOrchestrator
- [ ] Testa datakvalitet

**Estimerad tid:** 8-12h per API

**Alternativ:** Ta bort från dokumentation och UI (2h)

### **6.4 Andra Rekommendationer**

#### **Performance:**

- [ ] **Implementera lazy loading**
  - LeadCard-komponenter laddas endast när synliga
  - Minskar initial load time

- [ ] **Optimera bundle size**
  - Code splitting med dynamic imports
  - Tree shaking för oanvända dependencies
  - Aktuell storlek: 1.36 MB (363 KB gzipped)

- [ ] **Implementera service worker**
  - Offline-support
  - Cache API-responses
  - Background sync

#### **Security:**

- [ ] **Implementera rate limiting på frontend**
  - Förhindra abuse av API-nycklar
  - Komplettera backend rate limiting

- [ ] **Lägg till API key rotation**
  - Automatisk rotation var X månad
  - Notifikationer innan nyckel går ut

- [ ] **Implementera audit logging**
  - Logga alla API-anrop
  - Spåra användning per användare
  - Detektera ovanliga mönster

#### **UX:**

- [ ] **Förbättra loading states**
  - Skeleton screens istället för spinners
  - Progress bars för långsamma operationer

- [ ] **Lägg till keyboard shortcuts**
  - Snabbare navigation
  - Power user-funktioner

- [ ] **Implementera dark mode**
  - Använd DHL-färger i dark theme
  - Spara preferens per användare

---

## 📊 **SAMMANFATTNING & PRIORITERING**

### **Kritisk Path (Måste göras innan production):**

1. **Fixa Groq API-nyckel** (15 min) 🔴
2. **Konfigurera Vercel Environment Variables** (30 min) 🔴
3. **Skapa APIKeysPanel.tsx** (4-6h) 🔴
4. **Uppdatera README.md version till 5.0** (15 min) 🔴

**Total tid:** ~7h

### **Viktiga förbättringar (Bör göras inom 1-2 veckor):**

5. **Skapa ScrapingConfigPanel.tsx** (6-8h) 🟡
6. **Skapa QuotaManagementPanel.tsx** (4-6h) 🟡
7. **Konsolidera dokumentation** (4-6h) 🟡
8. **Integrera HybridScraperService** (4-6h) 🟡

**Total tid:** ~24h

### **Nice-to-Have (Kan vänta):**

9. **Crawl4AI backend** (8-12h) ELLER Ta bort (2h) 🟢
10. **Algolia integration** (4-6h) ELLER Ta bort (1h) 🟢
11. **Svenska Data APIs** (8-12h per API) ELLER Ta bort (2h) 🟢

**Total tid:** ~30h (om alla implementeras)

### **Total estimerad tid för completion:**

- **Kritisk:** 7h
- **Viktiga:** 24h
- **Nice-to-Have:** 30h

**Total:** ~61h (~8 arbetsdagar)

---

## ✅ **CHECKLISTA FÖR FÄRDIGSTÄLLANDE**

### **Vecka 1: Kritiska åtgärder**

- [ ] Fixa Groq API-nyckel
- [ ] Konfigurera Vercel Environment Variables
- [ ] Skapa APIKeysPanel.tsx
- [ ] Uppdatera README.md
- [ ] Testa att systemet fungerar i production

### **Vecka 2: Viktiga förbättringar**

- [ ] Skapa ScrapingConfigPanel.tsx
- [ ] Skapa QuotaManagementPanel.tsx
- [ ] Integrera HybridScraperService
- [ ] Konsolidera dokumentation

### **Vecka 3: Beslut och cleanup**

- [ ] Beslut: Implementera eller ta bort Crawl4AI
- [ ] Beslut: Implementera eller ta bort Algolia
- [ ] Beslut: Implementera eller ta bort Svenska Data APIs
- [ ] Final testing
- [ ] Production deployment

---

**Status:** 🟡 85% Färdigt  
**Nästa steg:** Börja med Kritisk Path  
**Estimerad färdigställande:** 3 veckor

