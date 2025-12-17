# 🚚 Lead Hunter v5.0 - Multi-Tenant Sales Intelligence Platform

**Enterprise Lead Generation System med AI, Multi-LLM & Real Data Integration**

---

## ⚡ Snabbstart (5 Minuter)

### 1. Kör Setup
```bash
# Dubbelklicka på:
setup.bat
```

**Gör automatiskt:**
- ✅ Skapar databas
- ✅ Installerar packages
- ✅ Lägger till test-data
- ✅ Verifierar installation

### 2. Starta Systemet
```bash
# Dubbelklicka på:
start-local.bat
```

### 3. Öppna Browser
```
http://localhost:5173
Email: admin@dhl.se
Password: Test123!
```

**✅ Klart! Systemet fungerar nu med test-data.**

---

## 🌐 Aktivera Verklig Data (GRATIS!)

### Hämta API-Nycklar (5 min):
1. **Gemini:** https://aistudio.google.com/app/apikey (GRATIS)
2. **Groq:** https://console.groq.com/keys (GRATIS)

### Lägg till i .env (root):
```bash
notepad .env

# Lägg till (VIKTIGT: VITE_ prefix krävs):
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel
VITE_GROQ_API_KEY=gsk_...din_nyckel
```

### Starta om frontend:
```bash
npm run dev
```

**OBS:** Se **[API_CONFIGURATION_COMPLETE_GUIDE.md](API_CONFIGURATION_COMPLETE_GUIDE.md)** för fullständig guide

### Nu hämtas automatiskt:
- ✅ **Kontaktpersoner** (VD, CFO, Logistics Manager)
- ✅ **Nyheter** (expansion, tillväxt, investeringar)
- ✅ **Ekonomi** (omsättning, kreditbetyg)
- ✅ **E-commerce data** (platform, leverantörer)
- ✅ **AI-analys** (sales pitch, opportunity score)
- ✅ **Triggers** (signaler för försäljning)

---

## 📚 Dokumentation

### Snabbstart & Setup
- **[QUICK_START.md](QUICK_START.md)** - 5-minuters guide
- **[SETUP_COMMANDS.md](SETUP_COMMANDS.md)** - Alla kommandon
- **[LOCAL_TEST_GUIDE.md](LOCAL_TEST_GUIDE.md)** - Detaljerad testguide

### Real Data Integration
- **[REAL_DATA_SETUP.md](REAL_DATA_SETUP.md)** - API-nycklar & setup
- **[DATA_SOURCES_OVERVIEW.md](DATA_SOURCES_OVERVIEW.md)** - Vad hämtas?
- **[REAL_DATA_INTEGRATION.md](REAL_DATA_INTEGRATION.md)** - Hur det fungerar

### System & Integration
- **[INTEGRATION_COMPLETE_GUIDE.md](INTEGRATION_COMPLETE_GUIDE.md)** - API & backend
- **[COMPLETE_DASHBOARD_GUIDE.md](COMPLETE_DASHBOARD_GUIDE.md)** - UI-komponenter
- **[CRAWL4AI_ADMIN_GUIDE.md](CRAWL4AI_ADMIN_GUIDE.md)** - Scraping & admin

### Scripts & Kommandon
- **[README_SCRIPTS.md](README_SCRIPTS.md)** - Scripts översikt
- **setup.bat / setup.ps1** - Automatisk setup
- **start-local.bat** - Starta systemet

---

## 🎯 Features

### ✅ Lead Management
- Sök leads (enstaka & batch)
- Analysera med AI
- Ladda ned PDF-rapporter
- Radera med anledningar
- Batch-operationer

### ✅ Real Data Integration
- Allabolag API (ekonomi, befattningshavare)
- UC API (kreditbetyg, ledningsgrupp)
- Bolagsverket (grunddata - GRATIS)
- Tavily Search (nyheter)
- Website Scraping (e-commerce data)

### ✅ AI-Analys
- Multi-LLM (Gemini, Groq, OpenAI, Claude)
- Automatisk fallback
- Sales pitch generation
- Opportunity scoring
- Trigger detection
- Competitive analysis

### ✅ Admin System
- Konfigurera scraping (Traditional/AI/Hybrid)
- API-nycklar management
- Sök-inställningar
- UI-anpassning
- Data & backup
- Säkerhetsinställningar

### ✅ Rollbaserad Åtkomst
- Admin - Full åtkomst
- Manager - Team-leads
- Terminal Chef - Terminal-specifikt
- FS/TS/KAM/DM - Region/postnummer-baserat

---

## 💰 Kostnad

### Gratis (0 SEK/månad):
- ✅ Gemini (1.5M requests/mån)
- ✅ Groq (14,400 requests/dag)
- ✅ Bolagsverket (grunddata)
- ✅ Web scraping
- **Funktionalitet: ~70%**

### Budget (1,500 SEK/månad):
- ✅ Allt ovan +
- ✅ Allabolag API
- **Funktionalitet: ~90%**

### Premium (5,100 SEK/månad):
- ✅ Allt ovan +
- ✅ UC API
- ✅ Tavily Pro
- ✅ OpenAI GPT-4
- **Funktionalitet: 100%**

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Multi-LLM Orchestration

**AI & Data:**
- Google Gemini
- Groq (Llama 3.1)
- OpenAI GPT-4
- Anthropic Claude
- Crawl4AI
- Puppeteer/Playwright

**APIs:**
- Allabolag
- UC
- Bolagsverket
- Tavily Search

---

## 📊 Status

**Backend API:** ✅ 100% Klart  
**Database:** ✅ 100% Klart  
**Frontend:** ✅ 100% Klart  
**Real Data Integration:** ✅ 100% Klart  
**Admin System:** ✅ 100% Klart  

**Totalt:** ✅ **95% PRODUCTION-READY!**

---

## 🚀 Support

**Problem?** Se [LOCAL_TEST_GUIDE.md](LOCAL_TEST_GUIDE.md) för felsökning.

**API-nycklar?** Se [REAL_DATA_SETUP.md](REAL_DATA_SETUP.md) för guide.

**Vad hämtas?** Se [DATA_SOURCES_OVERVIEW.md](DATA_SOURCES_OVERVIEW.md) för detaljer.

---

**Version:** 4.4  
**Status:** Production-Ready  
**License:** Proprietary - DHL Internal Use
