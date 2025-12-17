# 🔑 API Configuration - Komplett Guide

**Syfte:** Komplett guide för att konfigurera alla API-nycklar i `.env` och Vercel  
**Målgrupp:** Utvecklingsteam  
**Version:** 5.0  
**Datum:** 2025-12-17

---

## 📊 **SNABB ÖVERSIKT**

### **Status:**
- ✅ Groq API-nyckel uppdaterad
- ✅ Gemini API-nyckel finns
- ❌ Vercel Environment Variables inte konfigurerade
- ❌ Flera rekommenderade nycklar saknas

### **Nästa steg:**
1. Lägg till alla nycklar i `.env` (root)
2. Konfigurera Vercel Environment Variables
3. Testa alla nycklar i APIKeysPanel
4. Verifiera i production

---

## 📁 **FIL-STRUKTUR**

### **Rätt plats för API-nycklar:**

```
lead-hunter-v5.0/
├── .env                    ← ✅ RÄTT PLATS (frontend API-nycklar)
├── .env.example            ← Template
├── .env.local              ← Lokal override (gitignored)
├── server/
│   ├── .env                ← Backend (om backend används)
│   └── .env.mt             ← ❌ FEL PLATS (gitignored, används ej av Vite)
```

### **Viktigt:**
- ✅ Alla frontend-nycklar i `.env` i **ROOT**
- ✅ Alla nycklar måste ha `VITE_` prefix
- ❌ Använd INTE `server/.env.mt` för frontend-nycklar
- ❌ Använd INTE nycklar utan `VITE_` prefix i frontend

---

## 🔴 **STEG 1: KRITISKA API-NYCKLAR (.env)**

### **1.1 Gemini (Google)**

**Status:** ✅ Konfigurerad, behöver läggas till i Vercel

```env
# === Gemini (Google) ===
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://aistudio.google.com/app/apikey
2. Klicka "Create API Key"
3. Kopiera nyckeln
4. Lägg till i `.env`

**Kostnad:** Gratis (20 requests/dag per modell)  
**Används i:** `geminiService.ts`, `aiOrchestrator.ts`  
**Prioritet:** 🔴 KRITISK

---

### **1.2 Groq**

**Status:** ✅ Uppdaterad, behöver läggas till i Vercel

```env
# === Groq ===
VITE_GROQ_API_KEY=gsk_...din_nya_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://console.groq.com/keys
2. Klicka "Create API Key"
3. Kopiera nyckeln (börjar med `gsk_`)
4. Lägg till i `.env`

**Kostnad:** GRATIS (14,400 requests/dag)  
**Används i:** `groqService.ts`, `geminiService.ts` (fallback)  
**Prioritet:** 🔴 KRITISK

**Verifiera:**
```bash
# I browser console (F12):
console.log(import.meta.env.VITE_GROQ_API_KEY);
# Ska visa: gsk_...
```

---

## 🟡 **STEG 2: REKOMMENDERADE API-NYCKLAR (.env)**

### **2.1 Firecrawl**

**Status:** ✅ Har nyckel, behöver läggas till i `.env` och Vercel

```env
# === Firecrawl ===
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
```

**Nyckel:** `fc-0fe3e552a23248159a621397d9a29b1b` (redan tillgänglig)

**Kostnad:** Freemium (500 credits/månad gratis)  
**Används i:** `firecrawlService.ts`, `allabolagScraper.ts`  
**Endpoints:** scrape, crawl, extract, search (alla implementerade)  
**Prioritet:** 🟡 REKOMMENDERAD

---

### **2.2 DeepSeek**

**Status:** ❌ Inte konfigurerad

```env
# === DeepSeek ===
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://platform.deepseek.com
2. Skapa konto
3. Gå till API Keys
4. Skapa ny nyckel
5. Lägg till i `.env`

**Kostnad:** $0.14/1M tokens (mycket billig)  
**Används i:** `deepseekService.ts`, `aiOrchestrator.ts`  
**Prioritet:** 🟡 REKOMMENDERAD (backup AI)

---

### **2.3 Algolia**

**Status:** ❌ Inte konfigurerad

```env
# === Algolia Search ===
VITE_ALGOLIA_APP_ID=din_app_id_här
VITE_ALGOLIA_API_KEY=din_algolia_nyckel_här
VITE_ALGOLIA_INDEX_NAME=leads
```

**Skaffa nycklar:**
1. Gå till: https://www.algolia.com
2. Skapa konto
3. Skapa ny application
4. Gå till Settings → API Keys
5. Kopiera Application ID och Search API Key
6. Lägg till i `.env`

**Kostnad:** Gratis (10,000 records)  
**Används i:** `algoliaService.ts`  
**Problem:** ⚠️ Service finns men INTE integrerad i UI  
**Prioritet:** 🟡 REKOMMENDERAD

**Åtgärd:** Integrera i `SuperAdminLeadSearch.tsx` ELLER ta bort service

---

## 🟢 **STEG 3: VALFRIA API-NYCKLAR (.env)**

### **3.1 Claude (Anthropic)**

**Status:** ❌ Inte konfigurerad

```env
# === Claude ===
VITE_CLAUDE_API_KEY=sk-ant-api03-...din_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://console.anthropic.com
2. Skapa konto
3. Lägg till betalkort (krävs)
4. Gå till API Keys
5. Skapa ny nyckel
6. Lägg till i `.env`

**Kostnad:** $3-15/1M tokens (dyrast men högsta kvalitet)  
**Används i:** `claudeService.ts`  
**Problem:** ⚠️ Service finns men INTE integrerad i `aiOrchestrator.ts`  
**Prioritet:** 🟢 VALFRI

---

### **3.2 Octoparse**

**Status:** ❌ Inte konfigurerad

```env
# === Octoparse ===
VITE_OCTOPARSE_API_KEY=din_octoparse_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://www.octoparse.com
2. Skapa konto
3. Uppgradera till betald plan
4. Gå till API settings
5. Skapa API key
6. Lägg till i `.env`

**Kostnad:** Betald  
**Används i:** `octoparseService.ts`, `allabolagScraper.ts` (fallback)  
**Problem:** ⚠️ Service finns men används INTE  
**Prioritet:** 🟢 VALFRI

---

### **3.3 Browse.ai**

**Status:** ❌ Inte konfigurerad

```env
# === Browse.ai ===
VITE_BROWSE_AI_API_KEY=din_browse_ai_nyckel_här
```

**Kostnad:** Freemium  
**Används i:** `browseAiService.ts`  
**Problem:** ⚠️ Service finns men INTE integrerad  
**Prioritet:** 🟢 VALFRI

---

### **3.4 Tandem.ai**

**Status:** ❌ Inte konfigurerad

```env
# === Tandem.ai ===
VITE_TANDEM_AI_API_KEY=din_tandem_ai_nyckel_här
```

**Kostnad:** Betald  
**Används i:** `tandemAiService.ts`  
**Problem:** ⚠️ Service finns men INTE integrerad  
**Prioritet:** 🟢 VALFRI

---

### **3.5 NewsAPI**

**Status:** ❌ Inte konfigurerad

```env
# === NewsAPI ===
VITE_NEWS_API_KEY=din_news_api_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://newsapi.org
2. Skapa konto (gratis)
3. Kopiera API key
4. Lägg till i `.env`

**Kostnad:** Gratis (100 requests/dag)  
**Används i:** `newsApiService.ts`, `dataSourceServices.ts`  
**Prioritet:** 🟢 VALFRI

---

### **3.6 Hunter.io**

**Status:** ❌ Inte konfigurerad

```env
# === Hunter.io ===
VITE_HUNTER_API_KEY=din_hunter_io_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://hunter.io/api
2. Skapa konto
3. Gå till API
4. Kopiera API key
5. Lägg till i `.env`

**Kostnad:** Freemium (50 requests/månad gratis)  
**Används i:** `dataSourceServices.ts`  
**Problem:** ⚠️ Endast stub implementation  
**Prioritet:** 🟢 VALFRI

---

## 📊 **STEG 4: SVENSKA AFFÄRSDATA (Valfritt, Betald)**

### **4.1 Ratsit**

**Status:** ❌ Inte konfigurerad

```env
# === Ratsit ===
VITE_RATSIT_API_KEY=din_ratsit_nyckel_här
```

**Skaffa nyckel:**
1. Kontakta: https://www.ratsit.se/api
2. Förhandla pris och villkor
3. Få API-nyckel
4. Lägg till i `.env`

**Kostnad:** Betald (kontakta Ratsit)  
**Används i:** `dataSourceServices.ts`  
**Problem:** ⚠️ Endast stub implementation  
**Data:** Kreditbetyg, finansiell info  
**Prioritet:** 🟢 VALFRI

---

### **4.2 UC (Upplysningscentralen)**

**Status:** ❌ Inte konfigurerad

```env
# === UC ===
VITE_UC_API_KEY=din_uc_nyckel_här
```

**Skaffa nyckel:**
1. Kontakta: https://www.uc.se
2. Förhandla pris och villkor
3. Få API-nyckel
4. Lägg till i `.env`

**Kostnad:** Betald (kontakta UC)  
**Används i:** `dataSourceServices.ts`  
**Problem:** ⚠️ Endast stub implementation  
**Data:** Kreditrapporter, betalningsanmärkningar  
**Prioritet:** 🟢 VALFRI

---

### **4.3 BuiltWith**

**Status:** ❌ Inte konfigurerad

```env
# === BuiltWith ===
VITE_BUILTWITH_API_KEY=din_builtwith_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://api.builtwith.com
2. Välj plan
3. Skapa API key
4. Lägg till i `.env`

**Kostnad:** Betald  
**Används i:** `dataSourceServices.ts`  
**Problem:** ⚠️ Endast stub implementation  
**Data:** Teknisk stack-analys  
**Prioritet:** 🟢 VALFRI

---

### **4.4 Wappalyzer**

**Status:** ❌ Inte konfigurerad

```env
# === Wappalyzer ===
VITE_WAPPALYZER_API_KEY=din_wappalyzer_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://www.wappalyzer.com/api
2. Välj plan
3. Skapa API key
4. Lägg till i `.env`

**Kostnad:** Betald  
**Används i:** `dataSourceServices.ts`  
**Problem:** ⚠️ Endast stub implementation  
**Data:** Teknologidetektering med versioner  
**Prioritet:** 🟢 VALFRI

---

## 🔧 **STEG 5: CRAWL4AI (Speciell hantering)**

### **5.1 Crawl4AI Enable Flag**

**Status:** ❌ Inte konfigurerad

```env
# === Crawl4AI ===
VITE_CRAWL4AI_ENABLED=false
```

**Värden:**
- `true` - Aktivera Crawl4AI (kräver Python backend)
- `false` - Inaktivera Crawl4AI (använd endast Puppeteer + Firecrawl)

**Problem:** 🔴 Crawl4AI kräver Python backend som inte finns

**Åtgärder:**

**Alternativ 1: Implementera Python backend (8-12h)**
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

**Alternativ 2: Ta bort Crawl4AI (2h) ← REKOMMENDERAT**
- Ta bort `crawl4aiService.ts`
- Ta bort referenser i `hybridScraperService.ts`
- Uppdatera dokumentation
- Använd endast Puppeteer + Firecrawl

**Rekommendation:** Sätt till `false` och använd Puppeteer + Firecrawl

---

## 🚀 **STEG 6: VERCEL ENVIRONMENT VARIABLES**

### **6.1 Logga in på Vercel**

1. Gå till: https://vercel.com/dashboard
2. Välj projekt: `lead-hunter-v5.0`
3. Gå till: **Settings** → **Environment Variables**

---

### **6.2 Lägg till KRITISKA variabler**

**Lägg till följande variabler:**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | Production, Preview |
| `VITE_GROQ_API_KEY` | `gsk_...` | Production, Preview |
| `VITE_FIRECRAWL_API_KEY` | `fc-0fe3e552a23248159a621397d9a29b1b` | Production, Preview |

**Viktigt:**
- ✅ Välj **Production** och **Preview**
- ❌ Välj INTE **Development** (använd lokal `.env`)

---

### **6.3 Lägg till REKOMMENDERADE variabler**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_DEEPSEEK_API_KEY` | `din_nyckel` | Production, Preview |
| `VITE_ALGOLIA_APP_ID` | `din_app_id` | Production, Preview |
| `VITE_ALGOLIA_API_KEY` | `din_nyckel` | Production, Preview |
| `VITE_ALGOLIA_INDEX_NAME` | `leads` | Production, Preview |

---

### **6.4 Lägg till VALFRIA variabler (om konfigurerade)**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_CLAUDE_API_KEY` | `sk-ant-api03-...` | Production, Preview |
| `VITE_OCTOPARSE_API_KEY` | `din_nyckel` | Production, Preview |
| `VITE_NEWS_API_KEY` | `din_nyckel` | Production, Preview |
| `VITE_HUNTER_API_KEY` | `din_nyckel` | Production, Preview |
| `VITE_CRAWL4AI_ENABLED` | `false` | Production, Preview |

---

### **6.5 Backend variabler (om backend används)**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview |
| `JWT_SECRET` | `din_secret` | Production, Preview |

---

### **6.6 Redeploy**

Efter att ha lagt till alla variabler:

1. Gå till **Deployments**
2. Klicka på senaste deployment
3. Klicka **Redeploy**
4. Vänta på deployment
5. Testa i production

---

## ✅ **STEG 7: VERIFIERA KONFIGURATION**

### **7.1 Lokal verifiering**

```bash
# Starta servern
npm run dev

# Öppna browser console (F12)
# Kör följande kommandon:
```

```javascript
// Verifiera att nycklar laddas
console.log('Gemini:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...');
console.log('Groq:', import.meta.env.VITE_GROQ_API_KEY?.substring(0, 10) + '...');
console.log('Firecrawl:', import.meta.env.VITE_FIRECRAWL_API_KEY?.substring(0, 10) + '...');

// Ska visa början av varje nyckel
```

---

### **7.2 Testa i APIKeysPanel**

1. Gå till: `http://localhost:5173/admin/api-keys`
2. Klicka **"Testa alla nycklar"**
3. Verifiera att alla konfigurerade nycklar är giltiga
4. Åtgärda eventuella fel

---

### **7.3 Production verifiering**

```javascript
// I production (https://your-app.vercel.app)
// Öppna browser console (F12)

console.log('Gemini:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...');
console.log('Groq:', import.meta.env.VITE_GROQ_API_KEY?.substring(0, 10) + '...');

// Ska visa nycklar från Vercel Environment Variables
```

---

## 📋 **KOMPLETT .env TEMPLATE**

### **Minimal setup (Gratis):**

```env
# ============================================
# LEAD HUNTER v5.0 - Environment Variables
# ============================================

# === KRITISKA API-NYCKLAR (MÅSTE HA) ===
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
VITE_GROQ_API_KEY=gsk_...din_nyckel_här
```

---

### **Rekommenderad setup:**

```env
# ============================================
# LEAD HUNTER v5.0 - Environment Variables
# ============================================

# === KRITISKA API-NYCKLAR (MÅSTE HA) ===
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
VITE_GROQ_API_KEY=gsk_...din_nyckel_här

# === REKOMMENDERADE API-NYCKLAR ===
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel_här
VITE_ALGOLIA_APP_ID=din_algolia_app_id
VITE_ALGOLIA_API_KEY=din_algolia_nyckel
VITE_ALGOLIA_INDEX_NAME=leads
```

---

### **Full setup (Produktion):**

```env
# ============================================
# LEAD HUNTER v5.0 - Environment Variables
# ============================================

# === KRITISKA API-NYCKLAR (MÅSTE HA) ===
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
VITE_GROQ_API_KEY=gsk_...din_nyckel_här

# === REKOMMENDERADE API-NYCKLAR ===
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel_här
VITE_ALGOLIA_APP_ID=din_algolia_app_id
VITE_ALGOLIA_API_KEY=din_algolia_nyckel
VITE_ALGOLIA_INDEX_NAME=leads

# === VALFRIA API-NYCKLAR ===
VITE_CLAUDE_API_KEY=sk-ant-api03-...din_nyckel_här
VITE_OCTOPARSE_API_KEY=din_octoparse_nyckel_här
VITE_BROWSE_AI_API_KEY=din_browse_ai_nyckel_här
VITE_TANDEM_AI_API_KEY=din_tandem_ai_nyckel_här
VITE_NEWS_API_KEY=din_news_api_nyckel_här
VITE_HUNTER_API_KEY=din_hunter_io_nyckel_här

# === SVENSKA AFFÄRSDATA (Valfritt, Betald) ===
VITE_RATSIT_API_KEY=din_ratsit_nyckel_här
VITE_UC_API_KEY=din_uc_nyckel_här
VITE_BUILTWITH_API_KEY=din_builtwith_nyckel_här
VITE_WAPPALYZER_API_KEY=din_wappalyzer_nyckel_här

# === CRAWL4AI ===
VITE_CRAWL4AI_ENABLED=false

# === BACKEND (Om backend används) ===
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=din_jwt_secret_här
```

---

## 🚨 **FELSÖKNING**

### **Problem: API-nyckel laddas inte**

**Lösning:**
```bash
# Stoppa servern
Ctrl+C

# Rensa Vite cache
Remove-Item -Recurse -Force node_modules\.vite

# Starta om
npm run dev

# Hard refresh i browser
Ctrl+Shift+R
```

---

### **Problem: "Invalid API Key" i production**

**Lösning:**
1. Kontrollera att nyckeln finns i Vercel Environment Variables
2. Kontrollera att Environment är satt till "Production"
3. Redeploy projektet
4. Vänta 1-2 minuter för deployment
5. Testa igen

---

### **Problem: Nyckel fungerar lokalt men inte i production**

**Lösning:**
1. Nyckeln finns troligen inte i Vercel
2. Gå till Vercel Dashboard → Settings → Environment Variables
3. Lägg till nyckeln
4. Redeploy

---

### **Problem: "VITE_* is undefined"**

**Lösning:**
1. Kontrollera att variabeln har `VITE_` prefix
2. Kontrollera att variabeln finns i `.env` i ROOT
3. Starta om servern
4. Rensa Vite cache

---

## 📊 **CHECKLISTA**

### **Lokal utveckling:**

- [ ] Alla kritiska nycklar i `.env` (root)
- [ ] Alla nycklar har `VITE_` prefix
- [ ] Servern omstartad efter ändringar
- [ ] Vite cache rensad
- [ ] Nycklar verifierade i browser console
- [ ] Nycklar testade i APIKeysPanel

### **Vercel production:**

- [ ] Alla kritiska nycklar i Vercel Environment Variables
- [ ] Environment satt till "Production" och "Preview"
- [ ] Projekt redeployat
- [ ] Nycklar verifierade i production console
- [ ] Funktionalitet testad i production

### **Dokumentation:**

- [ ] `.env.example` uppdaterad
- [ ] README.md uppdaterad
- [ ] Team informerat om nya nycklar
- [ ] Säkerhetsriktlinjer följda

---

## 💰 **KOSTNADSKALKYL**

### **Minimal setup (Gratis):**
- Gemini: Gratis (20 req/dag)
- Groq: Gratis (14,400 req/dag)
- **Total:** 0 SEK/månad

### **Rekommenderad setup:**
- Gemini: Gratis
- Groq: Gratis
- Firecrawl: ~50 SEK/månad (efter free tier)
- DeepSeek: ~20 SEK/månad
- Algolia: Gratis (10,000 records)
- **Total:** ~70 SEK/månad

### **Full setup:**
- Alla ovan +
- Claude: ~500 SEK/månad
- Octoparse: ~800 SEK/månad
- Ratsit: ~1,000 SEK/månad
- UC: ~1,500 SEK/månad
- BuiltWith: ~500 SEK/månad
- **Total:** ~4,370 SEK/månad

---

## 🎯 **SAMMANFATTNING**

### **Vad som är klart:**
- ✅ Groq API-nyckel uppdaterad
- ✅ Gemini API-nyckel finns
- ✅ Firecrawl API-nyckel finns
- ✅ APIKeysPanel skapad
- ✅ ScrapingConfigPanel skapad
- ✅ QuotaManagementPanel skapad

### **Vad som behöver göras:**
1. **Lägg till nycklar i `.env`** (5 min)
2. **Konfigurera Vercel Environment Variables** (15 min)
3. **Testa alla nycklar i APIKeysPanel** (5 min)
4. **Redeploy till production** (5 min)
5. **Verifiera i production** (5 min)

**Total tid:** ~35 minuter

---

**Version:** 5.0  
**Status:** Komplett guide  
**Nästa steg:** Följ steg 1-7 ovan

