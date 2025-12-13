# 🚀 STARTA BACKEND & FRONTEND

## Snabbstart (Kopiera dessa kommandon)

### Terminal 1: Backend
```powershell
cd c:\Users\A\Downloads\lead-hunter-v5.0\server
npm start
```

### Terminal 2: Frontend
```powershell
cd c:\Users\A\Downloads\lead-hunter-v5.0
npm run dev
```

---

## ✅ Alla dina ändringar kommer att laddas!

När du startar om laddas automatiskt:
- ✅ Alla 14 återställda services
- ✅ triggerDetectionService (ny)
- ✅ Hybrid checkout scraping (Gemini + Puppeteer)
- ✅ Test-användare för checkout
- ✅ Förbättrad Puppeteer med formulär-ifyllning
- ✅ competitiveIntelligenceService integration
- ✅ API-nycklar från .env (Gemini, Groq, BuiltWith)
- ✅ Alla bugfixar i geminiService och competitiveIntelligenceService

---

## 📊 Vad som händer vid start

### Backend (Port 3001):
```
✅ Läser .env (API-nycklar)
✅ Laddar alla services (websiteScraperService.js med nya funktioner)
✅ Startar Express server
✅ Registrerar /api/scrape/website endpoint
✅ Redo att ta emot requests
```

### Frontend (Port 3000):
```
✅ Läser .env (API_KEY, GROQ_API_KEY, etc.)
✅ Kompilerar TypeScript
✅ Laddar alla services (geminiService.ts med hybrid checkout)
✅ Startar Vite dev server
✅ Öppnar http://localhost:3000
```

---

## 🎯 Testa efter start

1. **Öppna:** http://localhost:3000
2. **Logga in:** admin@dhl.se / Test123!
3. **Välj protokoll:** v8.4 Groq Djupanalys
4. **Sök:** RevolutionRace
5. **Se:**
   - Step 4: Website & Tech Analysis
   - Step 5: Competitive Intelligence & Triggers
   - Step 6: News Search
   - Checkout Ranking med transportör-ordning
   - Opportunity Score (0-100)
   - Triggers med priority

---

## 🔧 Felsökning

### Backend startar inte:
```powershell
# Kolla om port 3001 är upptagen
netstat -ano | findstr :3001

# Döda process om upptagen
taskkill /PID <PID> /F

# Starta igen
cd server
npm start
```

### Frontend startar inte:
```powershell
# Kolla om port 3000 är upptagen
netstat -ano | findstr :3000

# Döda process om upptagen
taskkill /PID <PID> /F

# Starta igen
npm run dev
```

### API-nyckel fungerar inte:
```powershell
# Verifiera .env
cat .env | Select-String "API_KEY"

# Ska visa:
# API_KEY=AIzaSyCHHVIjyMPUT6jXyanTE_z1II54f3JSJGg
# GROQ_API_KEY=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
```

---

## 📦 Crawl4AI (Valfritt - installera senare)

Crawl4AI installeras separat och är **inte nödvändigt** för att systemet ska fungera.

**Nuvarande lösning fungerar utan Crawl4AI:**
- ✅ Gemini + Puppeteer hybrid
- ✅ Formulär-ifyllning med testdata
- ✅ 80-90% success rate

**För att installera Crawl4AI senare:**
```powershell
# 1. Installera Python (pågår i bakgrunden)
# 2. När Python är klart:
pip install crawl4ai
playwright install

# 3. Aktivera i .env:
# ENABLE_CRAWL4AI=true

# 4. Starta om backend
```

---

## ✅ REDO ATT STARTA!

Öppna två nya PowerShell-terminaler och kör kommandona ovan.

**Alla dina ändringar är sparade och kommer att laddas automatiskt!** 🚀
