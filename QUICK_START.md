# 🚀 Quick Start - Testa Lokalt på 5 Minuter!

## ⚡ Snabbaste Sättet

### Första Gången - Komplett Setup:
```
Dubbelklicka på: setup.bat
```

**Gör automatiskt:**
- ✅ Skapar databas
- ✅ Kör migrations
- ✅ Kopierar .env-filer
- ✅ Installerar packages
- ✅ Lägger till test-data
- ✅ Verifierar installation

### Därefter - Starta Systemet:
```
Dubbelklicka på: start-local.bat
```

**Gör automatiskt:**
- ✅ Startar backend (port 3001)
- ✅ Startar frontend (port 5173)
- ✅ Öppnar browser

---

## 📋 Manuell Start (Om du vill ha mer kontroll)

### Steg 1: Sätt upp databas (En gång)
```bash
# Skapa databas
psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;"
psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"

# Kör migrations
psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql

# Lägg till test-data
cd server
npm run db:seed-test
cd ..
```

### Steg 2: Konfigurera (En gång)
```bash
# Kopiera env-filer
copy .env.local.example .env.local
copy server\.env.example server\.env

# Redigera server\.env och sätt minst:
# - DB_PASSWORD=SecurePassword123!
# - JWT_SECRET=din_hemliga_nyckel_minst_32_tecken
notepad server\.env
```

### Steg 3: Installera (En gång)
```bash
npm install
cd server && npm install && cd ..
```

### Steg 4: Starta (Varje gång)
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Steg 5: Öppna browser
```
http://localhost:5173
```

---

## 🔑 Test-Användare

Efter `npm run db:seed-test` har du dessa användare:

| Email | Password | Roll |
|-------|----------|------|
| admin@dhl.se | Test123! | Admin |
| manager@dhl.se | Test123! | Manager |
| terminal@dhl.se | Test123! | Terminal Chef |
| kam@dhl.se | Test123! | KAM |
| fs@dhl.se | Test123! | FS |

---

## 🧪 Testa Funktioner

### 1. Logga In
- Öppna http://localhost:5173
- Email: `admin@dhl.se`
- Password: `Test123!`

### 2. Se Leads
- Du ska se 5 test-leads (Boozt, Ellos, etc.)
- Klicka på ett lead för att se detaljer

### 3. Sök Nya Leads
- Klicka "Enstaka" tab
- Fyll i företagsnamn
- Klicka "KÖR PROTOKOLL"

### 4. Admin Settings
- Klicka "Verktyg" → "Visa Systemstatus"
- Testa olika inställningar

### 5. Lead Actions
- Klicka på ett lead
- Testa "Starta Analys"
- Testa "Ladda ned PDF"
- Testa "Radera" med olika anledningar

---

## ❓ Felsökning

### Backend startar inte?
```bash
# Kolla om PostgreSQL körs
psql -U postgres -c "SELECT 1"

# Kolla om databas finns
psql -U dhl_user -d dhl_lead_hunter -c "SELECT COUNT(*) FROM users;"
```

### Frontend kan inte nå backend?
```bash
# Kolla att backend körs
curl http://localhost:3001/api/health

# Ska svara: {"status":"ok","timestamp":"..."}
```

### Kan inte logga in?
```bash
# Kör seed-script igen
cd server
npm run db:seed-test
```

---

## 📚 Mer Information

- **Full guide:** `LOCAL_TEST_GUIDE.md`
- **Integration:** `INTEGRATION_COMPLETE_GUIDE.md`
- **UI Guide:** `COMPLETE_DASHBOARD_GUIDE.md`
- **API Docs:** `INTEGRATION_COMPLETE_GUIDE.md`

---

## 🎯 Nästa Steg

### 1. ✅ Testa Med Mock-Data (Fungerar Direkt)
- Systemet fungerar direkt med test-data
- 5 test-leads finns redan
- Alla funktioner fungerar

### 2. 🌐 Aktivera Verklig Data (REKOMMENDERAT)

#### Gratis API-Nycklar (0 SEK/månad):

**Google Gemini (GRATIS!):**
```bash
# 1. Hämta nyckel: https://aistudio.google.com/app/apikey
# 2. Lägg till i server\.env:
notepad server\.env

# Lägg till:
GEMINI_API_KEY=AIzaSy...din_nyckel
```

**Groq (GRATIS!):**
```bash
# 1. Hämta nyckel: https://console.groq.com/keys
# 2. Lägg till i server\.env:
GROQ_API_KEY=gsk_...din_nyckel
```

**Starta om backend:**
```bash
cd server
npm run dev
```

#### Nu Hämtas Automatiskt:
- ✅ **Kontaktpersoner** (VD, CFO, Logistics Manager)
- ✅ **Nyheter** (expansion, tillväxt, investeringar)
- ✅ **Ekonomi** (omsättning, kreditbetyg)
- ✅ **E-commerce data** (platform, leverantörer)
- ✅ **AI-analys** (sales pitch, opportunity score)
- ✅ **Triggers** (signaler för försäljning)

#### Test Med Verkligt Företag:
```
Sök: Boozt AB (556793-3674)
Klicka: "Starta Analys"
Se: Verklig data från API:er! 🎉
```

### 3. 📊 Vad Hämtas?

**Från Gratis API:er:**
- Bolagsverket: Grunddata (GRATIS)
- Gemini: AI-analys (GRATIS, 1.5M requests/mån)
- Groq: AI-analys (GRATIS, 14,400 requests/dag)
- Website Scraping: E-commerce data (GRATIS)

**Från Betalda API:er (Valfritt):**
- Allabolag: Ekonomi + Befattningshavare (1,500 SEK/mån)
- UC: Kreditbetyg + Ledningsgrupp (2,000 SEK/mån)
- Tavily: Nyheter (GRATIS 1,000/mån, Pro 1,100 SEK/mån)

### 4. 📚 Mer Information

**Guides:**
- **Real Data:** `REAL_DATA_SETUP.md` - API-nycklar & setup
- **Data Sources:** `DATA_SOURCES_OVERVIEW.md` - Vad hämtas?
- **Integration:** `REAL_DATA_INTEGRATION.md` - Hur det fungerar
- **Full Guide:** `LOCAL_TEST_GUIDE.md`
- **UI Guide:** `COMPLETE_DASHBOARD_GUIDE.md`

---

**Status:** ✅ Redo att testa! 🚀

**Med Mock-Data:** Fungerar direkt  
**Med Real Data:** Lägg till API-nycklar (5 min)

**Behöver hjälp?** Se `REAL_DATA_SETUP.md` för API-nycklar!
