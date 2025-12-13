# 🌐 Real Data Setup - Koppla Till Verkliga API:er

## 🎯 Översikt

Guide för att använda **riktiga API:er** och **verklig företagsdata** istället för mock-data.

---

## 📋 API:er Som Behövs

### 1. **LLM API:er** (För AI-analys)

#### A. Google Gemini (REKOMMENDERAD - GRATIS!)
```env
GEMINI_API_KEY=din_gemini_api_nyckel
```

**Hämta nyckel:**
1. Gå till: https://aistudio.google.com/app/apikey
2. Logga in med Google-konto
3. Klicka "Create API Key"
4. Kopiera nyckeln

**Kostnad:** GRATIS! 🎉
- 15 requests/minut
- 1,500 requests/dag
- 1 miljon requests/månad

**Modeller:**
- `gemini-1.5-flash` - Snabb, billig
- `gemini-1.5-pro` - Högre kvalitet

#### B. Groq (GRATIS FALLBACK - EXTREMT SNABB!)
```env
GROQ_API_KEY=din_groq_api_nyckel
```

**Hämta nyckel:**
1. Gå till: https://console.groq.com/keys
2. Skapa konto (gratis)
3. Klicka "Create API Key"
4. Kopiera nyckeln

**Kostnad:** GRATIS! 🚀
- 14,400 requests/dag
- 30 requests/minut
- Extremt snabb (Llama 3.1 70B)

#### C. OpenAI (VALFRITT - Högsta kvalitet)
```env
OPENAI_API_KEY=sk-...
```

**Hämta nyckel:**
1. Gå till: https://platform.openai.com/api-keys
2. Skapa konto
3. Lägg till betalningsmetod
4. Skapa API-nyckel

**Kostnad:** Betald
- GPT-4o-mini: ~$0.60/1M output tokens
- GPT-4o: ~$15/1M output tokens

---

### 2. **Företagsdata API:er** (För verifierad data)

#### A. Allabolag.se API (REKOMMENDERAD)
```env
ALLABOLAG_API_KEY=din_allabolag_nyckel
```

**Hämta nyckel:**
1. Kontakta: https://www.allabolag.se/api
2. Begär API-åtkomst
3. Välj paket

**Kostnad:** Från 1,500 SEK/månad
**Data:**
- Företagsinformation
- Ekonomiska nyckeltal
- Befattningshavare
- Adresser

#### B. UC API (Alternativ)
```env
UC_API_KEY=din_uc_nyckel
```

**Hämta nyckel:**
1. Kontakta: https://www.uc.se/vara-tjanster/api
2. Begär API-åtkomst

**Kostnad:** Från 2,000 SEK/månad
**Data:**
- Kreditupplysningar
- Företagsinformation
- Befattningshavare

#### C. Bolagsverket API (GRATIS men begränsad)
```env
# Ingen API-nyckel behövs
```

**Kostnad:** GRATIS
**Data:**
- Grundläggande företagsinfo
- Organisationsnummer
- Juridisk form

---

### 3. **Web Search API:er** (För nyheter & analys)

#### A. Tavily Search API (REKOMMENDERAD)
```env
TAVILY_API_KEY=din_tavily_nyckel
```

**Hämta nyckel:**
1. Gå till: https://tavily.com/
2. Skapa konto
3. Hämta API-nyckel

**Kostnad:** 
- GRATIS: 1,000 searches/månad
- Pro: $100/månad för 10,000 searches

**Användning:**
- Hitta företagsnyheter
- Marknadsanalys
- Konkurrentinformation

---

## 🔧 Konfigurera API:er

### Steg 1: Lägg Till Nycklar i .env-filer

#### Frontend (.env.local)
```bash
cd c:\Users\A\Downloads\lead-hunter-v5.0
notepad .env.local
```

**Lägg till:**
```env
# API URL
VITE_API_URL=http://localhost:3001/api

# Google Gemini (PRIMÄR - GRATIS!)
GEMINI_API_KEY=AIzaSy...din_riktiga_nyckel

# Groq (FALLBACK - GRATIS!)
GROQ_API_KEY=gsk_...din_riktiga_nyckel

# OpenAI (VALFRITT)
OPENAI_API_KEY=sk-...din_riktiga_nyckel

# Tavily Search (VALFRITT)
TAVILY_API_KEY=tvly-...din_riktiga_nyckel
```

#### Backend (server/.env)
```bash
cd c:\Users\A\Downloads\lead-hunter-v5.0
notepad server\.env
```

**Lägg till:**
```env
# Database (samma som tidigare)
DATABASE_URL=postgresql://dhl_user:SecurePassword123!@localhost:5432/dhl_lead_hunter
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dhl_lead_hunter
DB_USER=dhl_user
DB_PASSWORD=SecurePassword123!

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# JWT & Session
JWT_SECRET=min_super_hemliga_nyckel_som_ar_minst_32_tecken_lang
SESSION_SECRET=min_session_secret_som_ar_minst_32_tecken_lang

# ============================================
# LLM APIs (LÄGG TILL RIKTIGA NYCKLAR HÄR!)
# ============================================

# Google Gemini (PRIMÄR - GRATIS!)
GEMINI_API_KEY=AIzaSy...din_riktiga_nyckel
GEMINI_MODEL=gemini-1.5-flash

# Groq (FALLBACK - GRATIS!)
GROQ_API_KEY=gsk_...din_riktiga_nyckel
GROQ_MODEL=llama-3.1-70b-versatile

# OpenAI (VALFRITT)
OPENAI_API_KEY=sk-...din_riktiga_nyckel
OPENAI_MODEL=gpt-4o-mini

# Anthropic Claude (VALFRITT)
CLAUDE_API_KEY=sk-ant-...din_riktiga_nyckel
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# ============================================
# FÖRETAGSDATA APIs
# ============================================

# Allabolag (REKOMMENDERAD)
ALLABOLAG_API_KEY=din_allabolag_nyckel
ALLABOLAG_API_URL=https://api.allabolag.se/v1

# UC (ALTERNATIV)
UC_API_KEY=din_uc_nyckel
UC_API_URL=https://api.uc.se/v1

# ============================================
# WEB SEARCH APIs
# ============================================

# Tavily Search
TAVILY_API_KEY=tvly-...din_riktiga_nyckel

# ============================================
# SCRAPING SETTINGS
# ============================================

# Aktivera verklig scraping
ENABLE_REAL_SCRAPING=true
SCRAPING_METHOD=hybrid
SCRAPING_TIMEOUT=30000
SCRAPING_RETRIES=3
SCRAPING_CACHE_ENABLED=true
SCRAPING_CACHE_DURATION=24
```

---

## 🚀 Testa Med Verklig Data

### Steg 1: Starta Systemet
```bash
cd c:\Users\A\Downloads\lead-hunter-v5.0
.\start-local.bat
```

### Steg 2: Logga In
```
http://localhost:5173
Email: admin@dhl.se
Password: Test123!
```

### Steg 3: Sök Verkligt Företag

**Exempel 1: Boozt AB**
```
Företagsnamn: Boozt AB
Org.nummer: 556793-3674
Segment: KAM
```

**Exempel 2: Ellos AB**
```
Företagsnamn: Ellos AB
Org.nummer: 556064-8761
Segment: KAM
```

**Exempel 3: Revolution Race**
```
Företagsnamn: Revolution Race AB
Org.nummer: 559158-2769
Segment: FS
```

### Steg 4: Kör Analys

Systemet kommer nu:
1. ✅ Scrapa företagets hemsida (verklig data)
2. ✅ Hämta företagsdata från API:er
3. ✅ Analysera med LLM (Gemini/Groq)
4. ✅ Hitta decision makers
5. ✅ Generera sales pitch
6. ✅ Beräkna opportunity score

---

## 🔍 Verifiera Att Verklig Data Används

### Kolla Backend Logs
```bash
# I backend-terminalen ser du:
[INFO] Scraping website: https://www.boozt.com
[INFO] Using Gemini API for analysis
[INFO] Found 3 decision makers
[INFO] Opportunity score: 85/100
```

### Kolla Database
```bash
psql -U dhl_user -d dhl_lead_hunter

# Kolla lead-data
SELECT company_name, website_url, ecommerce_platform, delivery_services 
FROM leads 
WHERE company_name = 'Boozt AB';

# Kolla decision makers
SELECT dm.name, dm.title, dm.email, l.company_name
FROM decision_makers dm
JOIN leads l ON dm.lead_id = l.id
WHERE l.company_name = 'Boozt AB';
```

### Kolla API Usage
```bash
# I Admin Settings → API Usage
# Ska visa faktisk användning av Gemini/Groq
```

---

## 📊 Vilken Data Hämtas?

### Från Företagets Hemsida (Scraping)
- ✅ E-commerce platform (Shopify, WooCommerce, etc.)
- ✅ Shipping providers (DHL, PostNord, etc.)
- ✅ Delivery options
- ✅ Technologies used
- ✅ Markets (SE, NO, DK, etc.)
- ✅ Contact information

### Från LLM (Gemini/Groq/OpenAI)
- ✅ Company analysis
- ✅ Sales pitch
- ✅ Triggers (expansion, new markets, etc.)
- ✅ Competitive analysis
- ✅ Opportunity score

### Från Företagsdata API (Allabolag/UC)
- ✅ Org.nummer
- ✅ Revenue (omsättning)
- ✅ Employees (anställda)
- ✅ Legal status
- ✅ Credit rating
- ✅ Decision makers (VD, CFO, etc.)
- ✅ Address & contact

### Från Web Search (Tavily)
- ✅ Latest news
- ✅ Press releases
- ✅ Market analysis
- ✅ Competitor information

---

## 💰 Kostnadskalkyl

### Gratis Setup (REKOMMENDERAD för test)
```
✅ Google Gemini: GRATIS (1.5M requests/månad)
✅ Groq: GRATIS (14,400 requests/dag)
✅ Tavily: GRATIS (1,000 searches/månad)
✅ Bolagsverket: GRATIS
✅ Web Scraping: GRATIS

Total kostnad: 0 SEK/månad 🎉
```

### Budget Setup
```
✅ Google Gemini: GRATIS
✅ Groq: GRATIS
✅ Allabolag API: 1,500 SEK/månad
✅ Tavily Pro: $100/månad (~1,100 SEK)

Total kostnad: ~2,600 SEK/månad
```

### Premium Setup
```
✅ OpenAI GPT-4o: ~$50/månad
✅ Allabolag API: 1,500 SEK/månad
✅ UC API: 2,000 SEK/månad
✅ Tavily Pro: $100/månad

Total kostnad: ~4,100 SEK/månad
```

---

## 🧪 Test-Scenarios

### Scenario 1: Gratis Setup (Gemini + Groq)
```bash
# 1. Lägg till nycklar i .env
GEMINI_API_KEY=din_nyckel
GROQ_API_KEY=din_nyckel

# 2. Starta om backend
cd server
npm run dev

# 3. Sök företag
# Företag: Boozt AB
# Systemet använder Gemini för analys
```

### Scenario 2: Med Allabolag API
```bash
# 1. Lägg till nyckel
ALLABOLAG_API_KEY=din_nyckel

# 2. Systemet hämtar:
# - Exakt omsättning
# - Antal anställda
# - VD och styrelse
# - Kreditbetyg
```

### Scenario 3: Full Stack (Alla API:er)
```bash
# 1. Lägg till alla nycklar
GEMINI_API_KEY=...
GROQ_API_KEY=...
OPENAI_API_KEY=...
ALLABOLAG_API_KEY=...
TAVILY_API_KEY=...

# 2. Systemet ger:
# - Komplett företagsanalys
# - Verifierade decision makers
# - Senaste nyheterna
# - Konkurrentanalys
# - Exakt opportunity score
```

---

## 🔒 Säkerhet

### Skydda API-Nycklar

**VIKTIGT:** Lägg ALDRIG API-nycklar i Git!

```bash
# Kolla att .env är i .gitignore
type .gitignore | findstr .env

# Ska visa:
# .env
# .env.local
# server/.env
```

### Rotera Nycklar Regelbundet
```bash
# Byt API-nycklar var 3:e månad
# Använd olika nycklar för dev/prod
```

### Använd Environment-Specifika Nycklar
```bash
# Development
GEMINI_API_KEY=dev_key_här

# Production
GEMINI_API_KEY=prod_key_här
```

---

## 📈 Monitoring & Limits

### Kolla API Usage

**Gemini:**
- Dashboard: https://aistudio.google.com/app/apikey
- Limit: 1,500 requests/dag

**Groq:**
- Dashboard: https://console.groq.com/
- Limit: 14,400 requests/dag

**OpenAI:**
- Dashboard: https://platform.openai.com/usage
- Limit: Baserat på betalning

### Rate Limiting i Backend

Backend har automatisk rate limiting:
```javascript
// server/index.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 100 // Max 100 requests per IP
});
```

---

## 🎯 Best Practices

### 1. Använd Cache
```env
SCRAPING_CACHE_ENABLED=true
SCRAPING_CACHE_DURATION=24
```

### 2. Fallback Strategy
```javascript
// Systemet försöker i ordning:
1. Gemini (gratis, snabb)
2. Groq (gratis, extremt snabb)
3. OpenAI (betald, högsta kvalitet)
```

### 3. Batch Processing
```javascript
// Sök flera företag samtidigt
// Systemet optimerar API-anrop
```

### 4. Error Handling
```javascript
// Automatisk retry vid API-fel
// Fallback till cache vid timeout
```

---

## ✅ Checklista

- [ ] Skapat Gemini API-nyckel
- [ ] Skapat Groq API-nyckel
- [ ] Lagt till nycklar i .env.local
- [ ] Lagt till nycklar i server/.env
- [ ] Startat om backend
- [ ] Testat sökning på verkligt företag
- [ ] Verifierat att data hämtas från API:er
- [ ] Kollat backend logs
- [ ] Kollat database för verklig data

---

## 🚀 Snabbstart Med Verklig Data

```bash
# 1. Hämta API-nycklar
# Gemini: https://aistudio.google.com/app/apikey
# Groq: https://console.groq.com/keys

# 2. Lägg till i .env-filer
cd c:\Users\A\Downloads\lead-hunter-v5.0
notepad .env.local
notepad server\.env

# 3. Starta om systemet
.\start-local.bat

# 4. Sök verkligt företag
# Boozt AB, Ellos AB, Revolution Race, etc.

# 5. Se verklig data!
```

---

**Status:** ✅ Redo att använda verklig data! 🌐

**Rekommendation:** Börja med gratis Gemini + Groq, lägg till Allabolag senare för verifierad företagsdata.
