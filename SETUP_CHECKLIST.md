# 📋 Lead Hunter v5.0 - Komplett Setup Checklista

**Version:** 5.0  
**Datum:** 2025-12-17  
**Status:** Production-Ready

---

## 🎯 **Snabbstart Checklista**

### **Fas 1: Grundläggande Setup (5 minuter)**

- [ ] **1.1 Klona repository**
  ```bash
  git clone https://github.com/Performile1/lead-hunter-v5.0.git
  cd lead-hunter-v5.0
  ```

- [ ] **1.2 Installera dependencies**
  ```bash
  npm install
  ```

- [ ] **1.3 Skapa `.env` fil i ROOT**
  ```bash
  # Windows:
  copy .env.example .env
  
  # Mac/Linux:
  cp .env.example .env
  ```

- [ ] **1.4 Lägg till kritiska API-nycklar**
  ```env
  # Öppna .env och lägg till:
  VITE_GEMINI_API_KEY=din_gemini_nyckel
  VITE_GROQ_API_KEY=din_groq_nyckel
  ```

- [ ] **1.5 Starta utvecklingsserver**
  ```bash
  npm run dev
  ```

- [ ] **1.6 Öppna i browser**
  ```
  http://localhost:5173
  ```

---

## 🔑 **Fas 2: API-nycklar Setup**

### **🔴 KRITISKA (Måste ha)**

- [ ] **2.1 Gemini (Google)**
  - [ ] Gå till: https://aistudio.google.com/app/apikey
  - [ ] Skapa API-nyckel
  - [ ] Lägg till i `.env`: `VITE_GEMINI_API_KEY=AIzaSy...`
  - [ ] Verifiera: `console.log(import.meta.env.VITE_GEMINI_API_KEY)`
  - **Kostnad:** Gratis (20 requests/dag)
  - **Används för:** Huvudmotor för AI-analys

- [ ] **2.2 Groq**
  - [ ] Gå till: https://console.groq.com/keys
  - [ ] Skapa API-nyckel
  - [ ] Lägg till i `.env`: `VITE_GROQ_API_KEY=gsk_...`
  - [ ] Verifiera: `console.log(import.meta.env.VITE_GROQ_API_KEY)`
  - **Kostnad:** GRATIS (14,400 requests/dag)
  - **Används för:** Snabb fallback, 500+ tokens/s

### **🟡 REKOMMENDERADE (Bör ha)**

- [ ] **2.3 Firecrawl**
  - [ ] Gå till: https://firecrawl.dev
  - [ ] Skapa konto och API-nyckel
  - [ ] Lägg till i `.env`: `VITE_FIRECRAWL_API_KEY=fc-...`
  - **Kostnad:** Freemium (500 credits/månad gratis)
  - **Används för:** Allabolag scraping, website analysis
  - **Endpoints:** scrape, crawl, extract, search

- [ ] **2.4 DeepSeek**
  - [ ] Gå till: https://platform.deepseek.com
  - [ ] Skapa API-nyckel
  - [ ] Lägg till i `.env`: `VITE_DEEPSEEK_API_KEY=...`
  - **Kostnad:** Mycket billig ($0.14/1M tokens)
  - **Används för:** Backup AI-analys

- [ ] **2.5 Algolia**
  - [ ] Gå till: https://www.algolia.com
  - [ ] Skapa konto och app
  - [ ] Lägg till i `.env`:
    ```env
    VITE_ALGOLIA_APP_ID=din_app_id
    VITE_ALGOLIA_API_KEY=din_nyckel
    VITE_ALGOLIA_INDEX_NAME=leads
    ```
  - **Kostnad:** Gratis (10,000 records)
  - **Används för:** Blixtsnabb lead-sökning (50ms)

### **🟢 VALFRIA (Nice to have)**

- [ ] **2.6 Claude (Anthropic)**
  - [ ] Gå till: https://console.anthropic.com
  - [ ] Skapa konto och API-nyckel
  - [ ] Lägg till betalkort (krävs)
  - [ ] Lägg till i `.env`: `VITE_CLAUDE_API_KEY=sk-ant-api03-...`
  - **Kostnad:** $3-15/1M tokens
  - **Används för:** Högkvalitativ analys

- [ ] **2.7 Octoparse**
  - [ ] Gå till: https://www.octoparse.com
  - [ ] Lägg till i `.env`: `VITE_OCTOPARSE_API_KEY=...`
  - **Används för:** Fallback för Firecrawl

- [ ] **2.8 Browse.ai**
  - [ ] Gå till: https://browse.ai
  - [ ] Lägg till i `.env`: `VITE_BROWSE_AI_API_KEY=...`
  - **Används för:** Automatiserade scraping-robotar

- [ ] **2.9 Tandem.ai**
  - [ ] Gå till: https://tandem.ai
  - [ ] Lägg till i `.env`: `VITE_TANDEM_AI_API_KEY=...`
  - **Används för:** Multi-agent AI-analys

### **📊 SVENSKA AFFÄRSDATA (Valfritt)**

- [ ] **2.10 Ratsit**
  - [ ] Kontakta: https://www.ratsit.se/api
  - [ ] Lägg till i `.env`: `VITE_RATSIT_API_KEY=...`
  - **Används för:** Svensk företagsdata, kreditbetyg

- [ ] **2.11 UC (Upplysningscentralen)**
  - [ ] Kontakta: https://www.uc.se
  - [ ] Lägg till i `.env`: `VITE_UC_API_KEY=...`
  - **Används för:** Kreditrapporter

- [ ] **2.12 BuiltWith**
  - [ ] Gå till: https://api.builtwith.com
  - [ ] Lägg till i `.env`: `VITE_BUILTWITH_API_KEY=...`
  - **Används för:** Teknisk stack-analys

- [ ] **2.13 Wappalyzer**
  - [ ] Gå till: https://www.wappalyzer.com/api
  - [ ] Lägg till i `.env`: `VITE_WAPPALYZER_API_KEY=...`
  - **Används för:** Teknologidetektering

- [ ] **2.14 Hunter.io**
  - [ ] Gå till: https://hunter.io/api
  - [ ] Lägg till i `.env`: `VITE_HUNTER_API_KEY=...`
  - **Kostnad:** Freemium (50 requests/månad)
  - **Används för:** E-postverifiering

- [ ] **2.15 NewsAPI**
  - [ ] Gå till: https://newsapi.org
  - [ ] Lägg till i `.env`: `VITE_NEWS_API_KEY=...`
  - **Kostnad:** Gratis (100 requests/dag)
  - **Används för:** Företagsnyheter

---

## 🚀 **Fas 3: Request Queue Monitor Setup**

### **3.1 Verifiera Request Queue är aktiv**

- [ ] **Kontrollera att filen finns**
  ```bash
  ls services/requestQueue.ts
  ```

- [ ] **Verifiera integration i services**
  - [ ] `allabolagScraper.ts` använder request queue
  - [ ] `geminiService.ts` använder request queue
  - [ ] `firecrawlService.ts` använder request queue

### **3.2 Admin-panel: Request Queue Monitor**

- [ ] **Navigera till monitoring**
  ```
  http://localhost:5173/admin/monitoring/queue
  ```

- [ ] **Verifiera att panelen visar:**
  - [ ] 📥 Antal väntande requests
  - [ ] ⚡ Processing-status (aktiv/vilande)
  - [ ] 📈 Rate limit-användning per service
  - [ ] 🚨 Varningar vid >90% användning
  - [ ] 🔴 Emergency "Rensa Kö"-knapp

### **3.3 Färgkoder fungerar**

- [ ] **🟢 Grön:** <70% av limit
- [ ] **🟡 Gul:** 70-90% av limit
- [ ] **🔴 Röd:** >90% av limit

### **3.4 Testa Request Queue**

- [ ] **Kör test-request**
  ```typescript
  import { queueRequest } from './services/requestQueue';
  
  const result = await queueRequest(
    () => fetch('https://api.example.com'),
    'test-service',
    5,  // Priority (1-10)
    3   // Max retries
  );
  ```

- [ ] **Verifiera i console:**
  - [ ] Request köad
  - [ ] Processing startar
  - [ ] Retry vid fel
  - [ ] Exponential backoff fungerar

---

## 🛡️ **Fas 4: Quota Management**

### **4.1 QuotaExhaustedModal**

- [ ] **Verifiera att komponenten finns**
  ```bash
  ls src/components/QuotaExhaustedModal.tsx
  ```

- [ ] **Testa quota exhaustion:**
  - [ ] Gör 20+ Gemini-requests (nå limit)
  - [ ] Verifiera att modal visas
  - [ ] Kontrollera att lösningar visas:
    - [ ] Groq API-nyckel fix
    - [ ] Gemini upgrade
    - [ ] DeepSeek alternativ

### **4.2 Quota Limits**

- [ ] **Gemini:** 20 requests/dag per modell (gratis tier)
- [ ] **Groq:** 14,400 requests/dag (gratis)
- [ ] **Firecrawl:** 500 credits/månad (gratis tier)
- [ ] **DeepSeek:** Ingen free tier (betald)
- [ ] **Claude:** Ingen free tier (betald)

### **4.3 Fallback-kedja**

- [ ] **AI Analysis fallback:**
  1. Groq (snabbast, gratis)
  2. DeepSeek (billig)
  3. Gemini (om quota finns)
  4. Claude (högsta kvalitet, dyrast)

- [ ] **Scraping fallback:**
  1. Firecrawl (bäst kvalitet)
  2. Octoparse (fallback)
  3. Crawl4AI (LLM-integration)

---

## 🚨 **Fas 5: Felsökning**

### **5.1 Vit sida (White Screen)**

- [ ] **Öppna Developer Tools (F12)**
- [ ] **Kontrollera Console för fel:**
  - [ ] `429 Too Many Requests` → Quota slut
  - [ ] `401 Unauthorized` → Ogiltig API-nyckel
  - [ ] `404 Not Found` → Fil saknas
  - [ ] `GROQ_API_KEY saknas` → Lägg till nyckel

- [ ] **Lösning för vit sida:**
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

### **5.2 API-nyckel fungerar inte**

- [ ] **Verifiera att nyckeln laddas:**
  ```javascript
  // I browser console (F12):
  console.log(import.meta.env.VITE_GEMINI_API_KEY);
  console.log(import.meta.env.VITE_GROQ_API_KEY);
  ```

- [ ] **Kontrollera vanliga fel:**
  - [ ] Nyckel saknar `VITE_` prefix
  - [ ] Mellanslag runt `=` i `.env`
  - [ ] Nyckel i fel fil (`server/.env.mt` istället för `.env`)
  - [ ] Servern inte omstartad efter ändring

### **5.3 Gemini Quota Exhausted**

- [ ] **Fel:** `429 Too Many Requests`
- [ ] **Lösning 1: Vänta**
  - Gemini återställs efter 24h
  - Använd Groq under tiden

- [ ] **Lösning 2: Fixa Groq API-nyckel**
  - Gå till: https://console.groq.com/keys
  - Skapa ny nyckel
  - Uppdatera `.env`
  - Starta om servern

- [ ] **Lösning 3: Lägg till DeepSeek**
  - Billig backup ($0.14/1M tokens)
  - Ingen free tier men mycket billig

### **5.4 Groq API Key Invalid**

- [ ] **Fel:** `401 Unauthorized`
- [ ] **Lösning:**
  - [ ] Gå till: https://console.groq.com/keys
  - [ ] Skapa NY API-nyckel
  - [ ] Kopiera hela nyckeln (börjar med `gsk_`)
  - [ ] Uppdatera `.env`: `VITE_GROQ_API_KEY=gsk_...`
  - [ ] Rensa cache: `Remove-Item -Recurse -Force node_modules\.vite`
  - [ ] Starta om: `npm run dev`
  - [ ] Hard refresh: `Ctrl+Shift+R`

### **5.5 Notifications API 404**

- [ ] **Fel:** `/api/notifications 404`
- [ ] **Orsak:** Backend API inte implementerad än
- [ ] **Lösning:** Ignorera (påverkar inte funktionalitet)
- [ ] **Eller:** Implementera backend notifications API

### **5.6 index.css 404**

- [ ] **Fel:** `/index.css 404`
- [ ] **Orsak:** CSS-fil saknas eller fel path
- [ ] **Lösning:** Kontrollera att `index.css` finns i `src/`

---

## ✅ **Fas 6: Verifiering**

### **6.1 Grundläggande funktionalitet**

- [ ] **Lead Search fungerar**
  - [ ] Sök efter företag (t.ex. "Mockberg")
  - [ ] Verifiera att resultat visas
  - [ ] Kontrollera att data är korrekt

- [ ] **AI-analys fungerar**
  - [ ] Djupanalys startar
  - [ ] Gemini eller Groq används
  - [ ] Fallback fungerar vid quota-fel

- [ ] **Scraping fungerar**
  - [ ] Allabolag-data hämtas
  - [ ] Firecrawl används (om konfigurerad)
  - [ ] Fallback till Octoparse fungerar

### **6.2 Request Queue fungerar**

- [ ] **Öppna Request Queue Monitor**
  ```
  http://localhost:5173/admin/monitoring/queue
  ```

- [ ] **Verifiera:**
  - [ ] Requests visas i kö
  - [ ] Rate limits respekteras
  - [ ] Färgkoder uppdateras (grön/gul/röd)
  - [ ] Retries fungerar vid fel

### **6.3 Quota Management fungerar**

- [ ] **Testa quota exhaustion:**
  - [ ] Nå Gemini limit (20 requests)
  - [ ] Verifiera att QuotaExhaustedModal visas
  - [ ] Kontrollera att Groq fallback aktiveras

### **6.4 Performance**

- [ ] **Svarstider:**
  - [ ] Lead search: <3s
  - [ ] Djupanalys: <30s
  - [ ] Scraping: <10s

- [ ] **Ingen minnesläcka:**
  - [ ] Kör 10+ sökningar
  - [ ] Kontrollera minneanvändning i Task Manager
  - [ ] Verifiera att minne inte växer okontrollerat

---

## 📊 **Fas 7: Production Readiness**

### **7.1 Environment Variables**

- [ ] **Alla kritiska nycklar konfigurerade:**
  - [ ] `VITE_GEMINI_API_KEY`
  - [ ] `VITE_GROQ_API_KEY`

- [ ] **Rekommenderade nycklar konfigurerade:**
  - [ ] `VITE_FIRECRAWL_API_KEY`
  - [ ] `VITE_DEEPSEEK_API_KEY`
  - [ ] `VITE_ALGOLIA_APP_ID`
  - [ ] `VITE_ALGOLIA_API_KEY`

- [ ] **`.env` är gitignored:**
  ```bash
  # Verifiera:
  cat .gitignore | grep .env
  ```

### **7.2 Build fungerar**

- [ ] **Kör production build:**
  ```bash
  npm run build
  ```

- [ ] **Verifiera att bygget lyckas:**
  - [ ] Inga TypeScript-fel
  - [ ] Inga ESLint-fel
  - [ ] `dist/` mapp skapas

- [ ] **Testa production build:**
  ```bash
  npm run preview
  ```

### **7.3 Git Status**

- [ ] **Alla ändringar committade:**
  ```bash
  git status
  # Ska visa: "nothing to commit, working tree clean"
  ```

- [ ] **Pushat till GitHub:**
  ```bash
  git push origin master
  ```

### **7.4 Dokumentation**

- [ ] **Alla guider skapade:**
  - [ ] `README.md`
  - [ ] `REQUEST_QUEUE_README.md`
  - [ ] `QUOTA_FIX_GUIDE.md`
  - [ ] `API_KEY_CLEANUP_GUIDE.md`
  - [ ] `FIRECRAWL_COMPLETE_GUIDE.md`
  - [ ] `DOCUMENTATION_STATUS_REPORT.md`
  - [ ] `SETUP_CHECKLIST.md` (denna fil)

---

## 🎯 **Sammanfattning**

### **Minimal Setup (Gratis) - 0-20 SEK/månad**
```env
VITE_GEMINI_API_KEY=din_nyckel
VITE_GROQ_API_KEY=din_nyckel
```
**Funktionalitet:** ~70%

### **Rekommenderad Setup - 200-500 SEK/månad**
```env
VITE_GEMINI_API_KEY=din_nyckel
VITE_GROQ_API_KEY=din_nyckel
VITE_FIRECRAWL_API_KEY=din_nyckel
VITE_DEEPSEEK_API_KEY=din_nyckel
VITE_ALGOLIA_APP_ID=din_app_id
VITE_ALGOLIA_API_KEY=din_nyckel
```
**Funktionalitet:** ~90%

### **Full Setup (Produktion) - 2,000-5,000 SEK/månad**
Alla API-nycklar inklusive:
- Svenska data (Ratsit, UC)
- Tech analysis (BuiltWith, Wappalyzer)
- Contact & News (Hunter.io, NewsAPI)

**Funktionalitet:** 100%

---

## 📚 **Dokumentation**

- **Setup:** `README.md`, `INSTALLATION.md`
- **API Keys:** `API_KEY_CLEANUP_GUIDE.md`, `API_KEYS_GUIDE.md`
- **Request Queue:** `REQUEST_QUEUE_README.md`
- **Quota Management:** `QUOTA_FIX_GUIDE.md`
- **Firecrawl:** `FIRECRAWL_COMPLETE_GUIDE.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Status:** `DOCUMENTATION_STATUS_REPORT.md`

---

## 🚀 **Support**

**Problem?**
1. Kontrollera denna checklista
2. Se `TROUBLESHOOTING.md`
3. Kontrollera console logs (F12)
4. Verifiera API-nycklar laddas

**Allt fungerar?**
✅ Systemet är redo för produktion!

---

**Version:** 5.0  
**Status:** Production-Ready  
**Senaste uppdatering:** 2025-12-17
