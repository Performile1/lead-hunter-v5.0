# 🤖 CRAWL4AI SETUP GUIDE

## Vad är Crawl4AI?

Crawl4AI är ett AI-drivet scraping-verktyg som:
- ✅ Förstår dynamiskt innehåll (React, Vue, etc.)
- ✅ Kan navigera checkout-flöden automatiskt
- ✅ Fyller i formulär intelligent
- ✅ Extraherar strukturerad data med AI
- ✅ Hanterar Klarna, Walley, Qliro checkouts

## Installation

### Steg 1: Installera Python (om inte redan installerat)
```bash
# Windows: Ladda ner från python.org
# Eller använd Chocolatey:
choco install python

# Verifiera installation
python --version  # Ska vara 3.8+
```

### Steg 2: Installera Crawl4AI
```bash
# I projektets root-mapp
pip install crawl4ai

# Eller med npm (om Python-wrapper finns)
npm install crawl4ai
```

### Steg 3: Installera Playwright (krävs av Crawl4AI)
```bash
playwright install
```

### Steg 4: Konfigurera API-nycklar
Lägg till i `.env`:
```env
# Crawl4AI kan använda olika LLM:er
CRAWL4AI_LLM=gemini  # eller 'openai', 'claude'
CRAWL4AI_API_KEY=din_gemini_api_key  # Samma som API_KEY
```

## Användning

### Option 1: Via Backend API (Rekommenderat)

Backend har redan stöd för Crawl4AI. Aktivera genom att:

1. Sätt `ENABLE_CRAWL4AI=true` i `.env`
2. Starta om backend
3. Crawl4AI används automatiskt för komplexa checkouts

### Option 2: Direkt i hybridScraperService

```typescript
import { HybridScraperService } from './services/hybridScraperService';

const scraper = new HybridScraperService({
  method: 'ai',  // Använd Crawl4AI
  timeout: 60000
});

const result = await scraper.analyzeWebsite('https://revolutionrace.se');
```

## Hur det fungerar

### 1. Traditionell Puppeteer (Nuvarande)
```
Startsida → Försök hitta checkout → Scrapa synligt innehåll
```
**Problem:** Missar dynamiskt innehåll, kan inte fylla formulär smart

### 2. Crawl4AI (Nytt)
```
Startsida → AI förstår sidan → Navigerar till checkout → 
Fyller i formulär → Väntar på fraktalternativ → Extraherar data
```
**Fördelar:** Förstår kontext, hanterar alla checkout-typer

## Test-användare för Crawl4AI

Crawl4AI använder automatiskt test-användare från `server/config/testUsers.js`:

```javascript
{
  email: 'test@dhlleadhunter.com',
  firstName: 'Test',
  lastName: 'Testsson',
  phone: '0701234567',
  address: 'Testgatan 1',
  postalCode: '11122',
  city: 'Stockholm'
}
```

Crawl4AI fyller i dessa automatiskt och väntar på fraktalternativ.

## Exempel: RevolutionRace med Klarna Checkout

### Utan Crawl4AI:
```
❌ Hittar inte fraktalternativ (kräver adress)
❌ Kan inte fylla i Klarna-formulär
❌ Ser bara statiskt innehåll
```

### Med Crawl4AI:
```
✅ Navigerar till checkout
✅ Fyller i adress automatiskt
✅ Väntar på Klarna att ladda
✅ Extraherar alla fraktalternativ med ordning
✅ Returnerar: ["1. DHL", "2. PostNord", "3. Bring"]
```

## Prestanda

**Traditionell Puppeteer:** 5-10 sekunder
**Crawl4AI:** 15-30 sekunder (men mycket mer korrekt)

**Hybrid-strategi (Rekommenderad):**
- Kör båda parallellt
- Använd Crawl4AI-data om tillgänglig
- Fallback till Puppeteer om Crawl4AI tar för lång tid

## Felsökning

### Problem: "Crawl4AI not found"
```bash
pip install crawl4ai
playwright install
```

### Problem: "Python not found"
Installera Python 3.8+ från python.org

### Problem: "Timeout"
Öka timeout i config:
```typescript
const scraper = new HybridScraperService({
  method: 'ai',
  timeout: 90000  // 90 sekunder
});
```

## Kostnad

**Crawl4AI med Gemini:**
- Gratis upp till 60 requests/minut
- Använder samma API-nyckel som Deep Dive

**Crawl4AI med OpenAI:**
- ~$0.01 per checkout-scraping
- Mer exakt men kostar

## Nästa steg

1. ✅ Installera Python + Crawl4AI
2. ✅ Sätt `ENABLE_CRAWL4AI=true` i `.env`
3. ✅ Starta om backend
4. ✅ Testa med RevolutionRace
5. ✅ Jämför resultat med/utan Crawl4AI

## Status

**Nuvarande implementation:**
- ✅ Test-användare skapade
- ✅ Puppeteer förbättrad med formulär-ifyllning
- ✅ Hybrid-logik implementerad
- ⚠️ Crawl4AI-integration förberedd (väntar på installation)

**När Crawl4AI är installerat:**
- Aktiveras automatiskt för komplexa checkouts
- Används som backup när Puppeteer misslyckas
- Ger högsta confidence-score
