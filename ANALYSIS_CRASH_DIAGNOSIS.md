# Lead Analysis Crash Diagnosis & Fixes

## Problem Summary

Lead-analysen kraschar och saknar kritisk data:

### ✅ Fungerar (får in data)
- Omsättning (revenue)
- Organisationsnummer (orgNumber)
- URL/Webbplats

### ❌ Saknas/Kraschar (får INTE in data)
1. **Soliditet** - Från Allabolag
2. **Kassalikviditet** - Från Allabolag
3. **Kronofogden-data** - API finns men ingen nyckel konfigurerad
4. **Checkout scraping** - Implementerad men kraschar ofta
5. **NewsAPI & AI-analys** - API finns men data kommer inte in i analysen
6. **LinkedIn kontaktpersoner** - Endast placeholder, ingen faktisk implementation

---

## Detaljerad Analys

### 1. SOLIDITET & KASSALIKVIDITET (Allabolag)

**Problem:**
- `allabolagScraper.ts` scrapar INTE soliditet eller kassalikviditet
- Endast revenue, employees, address, CEO, board members

**Nuvarande kod i `allabolagScraper.ts` (rad 111-229):**
```typescript
function parseAllabolagContent(content: string, companyName: string) {
  // ✅ Extraherar: orgNumber, revenue, employees, address, CEO, board
  // ❌ Extraherar INTE: soliditet, kassalikviditet, resultat, eget kapital
}
```

**Lösning:**
Lägg till parsing för:
- Soliditet (equity ratio)
- Kassalikviditet (cash liquidity)
- Resultat (profit/loss)
- Eget kapital (equity)
- Skuldsättningsgrad (debt ratio)

**Var data finns på Allabolag:**
```
Soliditet: XX%
Kassalikviditet: XX%
Resultat: XX MSEK
Eget kapital: XX MSEK
```

---

### 2. KRONOFOGDEN API

**Problem:**
- API-integration finns i `dataSourceServices.ts` (rad 113-153)
- Men INGEN API-nyckel konfigurerad
- Returnerar alltid `null`

**Nuvarande kod:**
```typescript
const KRONOFOGDEN_API_KEY = import.meta.env.VITE_KRONOFOGDEN_API_KEY || '';

export async function fetchFromKronofogden(orgNumber: string) {
  if (!KRONOFOGDEN_API_KEY) {
    console.warn('Kronofogden API key not configured');
    return null; // ❌ Returnerar alltid null
  }
  // ...
}
```

**Alternativa lösningar:**

#### Option A: Kreditupplysning.se API (Gratis/Billig)
```typescript
// Gratis API för Kronofogden-data
const response = await fetch(
  `https://api.kreditupplysning.se/v1/kronofogden/${orgNumber}`
);
```

#### Option B: Scraping från Kronofogden.se
```typescript
// Scrapa direkt från Kronofogden.se (offentlig data)
const url = `https://kronofogden.se/foretagssokning?orgnr=${orgNumber}`;
const scrapedData = await scrapeWithFirecrawl(url);
```

#### Option C: UC/Bisnode API (Betald)
```typescript
// Professionell kreditupplysning
const response = await fetch(
  `https://api.uc.se/v1/company/${orgNumber}/credit-report`,
  { headers: { 'Authorization': `Bearer ${UC_API_KEY}` }}
);
```

---

### 3. CHECKOUT SCRAPING

**Problem:**
- Implementerad i `checkoutDetectionService.js`
- Försöker: Firecrawl → Puppeteer → Gemini
- Men kraschar ofta pga:
  - Timeout (15 sekunder)
  - Checkout kräver ofta inloggning
  - Dynamiskt innehåll laddas inte

**Nuvarande flöde:**
```javascript
// 1. Firecrawl (primär) - ofta timeout
// 2. Puppeteer (backup) - kräver headless browser
// 3. Gemini (fallback) - AI-gissning, låg confidence
```

**Förbättringar:**

#### A. Öka timeout och retry
```javascript
const CHECKOUT_TIMEOUT = 30000; // 30 sekunder istället för 15
const MAX_RETRIES = 3;
```

#### B. Testa flera checkout-URLer
```javascript
const checkoutUrls = [
  `${url}/checkout`,
  `${url}/kassa`,
  `${url}/cart`,
  `${url}/varukorg`,
  `${url}/cart/checkout`,
  `${url}/checkout/shipping`,
  `${url}/kassa/frakt`
];
```

#### C. Scrapa från produktsidor istället
```javascript
// Fraktalternativ visas ofta på produktsidor
const productUrls = [
  `${url}/products`,
  `${url}/shop`,
  `${url}/produkter`
];
```

#### D. Använd Gemini för att hitta checkout-URL först
```javascript
const prompt = `Analysera ${url} och hitta checkout/kassa-URL`;
const checkoutUrl = await findCheckoutUrl(url);
```

---

### 4. NEWSAPI & AI-ANALYS

**Problem:**
- NewsAPI är konfigurerad (`newsApiService.ts`)
- Men data kommer INTE in i slutlig analys
- Anledning: Data hämtas men INTE mergad i resultat

**Nuvarande kod i `dataOrchestrator.ts`:**
```typescript
case 'newsapi':
  return await fetchCompanyNews(companyName); // ✅ Hämtar data

// Men sedan...
// ❌ Data används INTE i AI-analysen
```

**Problem i `geminiService.ts`:**
```typescript
// Nyheter hämtas men skickas INTE till Gemini
const analysisPrompt = `
  Företag: ${companyName}
  Omsättning: ${revenue}
  // ❌ SAKNAS: Nyheter, sentiment, marknadsposition
`;
```

**Lösning:**
Lägg till nyheter i AI-prompten:
```typescript
const newsData = await fetchCompanyNews(companyName);
const analysisPrompt = `
  Företag: ${companyName}
  Omsättning: ${revenue}
  
  NYHETER (senaste 30 dagarna):
  ${newsData.articles.map(a => `- ${a.title} (${a.source})`).join('\n')}
  
  Analysera företagets marknadsposition baserat på nyheterna.
`;
```

---

### 5. LINKEDIN KONTAKTPERSONER

**Problem:**
- `linkedinService.ts` är ENDAST placeholder
- Returnerar alltid tom array `[]`
- LinkedIn API kräver OAuth och är mycket begränsat

**Nuvarande kod:**
```typescript
export async function searchDecisionMakers(companyName: string) {
  console.log(`🔍 Searching LinkedIn for decision makers at ${companyName}`);
  return []; // ❌ Returnerar alltid tom array
}
```

**Alternativa lösningar:**

#### Option A: Scraping med Bright Data / ScrapingBee
```typescript
const BRIGHT_DATA_API = 'https://api.brightdata.com/linkedin';
const response = await fetch(
  `${BRIGHT_DATA_API}/search?company=${companyName}&title=CEO,VD,COO`
);
```

#### Option B: Hunter.io för email + LinkedIn URL
```typescript
// Hunter.io ger emails OCH LinkedIn-profiler
const response = await fetch(
  `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_KEY}`
);
// Returnerar: emails, names, LinkedIn URLs
```

#### Option C: Apollo.io API (Bäst för B2B)
```typescript
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const response = await fetch('https://api.apollo.io/v1/people/search', {
  method: 'POST',
  headers: { 'X-Api-Key': APOLLO_API_KEY },
  body: JSON.stringify({
    organization_name: companyName,
    person_titles: ['CEO', 'VD', 'COO', 'Logistikchef']
  })
});
```

#### Option D: Scrapa från företagets "Om oss" sida
```typescript
const aboutUrls = [
  `${url}/about`,
  `${url}/om-oss`,
  `${url}/team`,
  `${url}/kontakt`
];

// Använd Gemini för att extrahera kontaktpersoner
const prompt = `
  Extrahera alla kontaktpersoner från denna sida:
  ${scrapedContent}
  
  Format: Namn, Titel, Email (om tillgänglig)
`;
```

---

## Prioriterad Åtgärdsplan

### 🔴 KRITISKT (Implementera först)

1. **Lägg till Soliditet & Kassalikviditet i Allabolag-scraper**
   - Uppdatera `parseAllabolagContent()` i `allabolagScraper.ts`
   - Lägg till regex för soliditet, kassalikviditet, resultat

2. **Fixa NewsAPI-integration i AI-analys**
   - Uppdatera `geminiService.ts` för att inkludera nyheter i prompt
   - Lägg till sentiment-analys baserat på nyheter

3. **Implementera Kronofogden scraping fallback**
   - Scrapa från Kronofogden.se (offentlig data)
   - Eller använd Kreditupplysning.se API (gratis)

### 🟡 VIKTIGT (Implementera nästa)

4. **Förbättra Checkout Scraping**
   - Öka timeout till 30 sekunder
   - Testa flera checkout-URLer
   - Scrapa från produktsidor som fallback

5. **Implementera LinkedIn/Kontaktpersons-scraping**
   - Använd Hunter.io eller Apollo.io
   - Scrapa från "Om oss" sidor
   - Extrahera med Gemini

### 🟢 BRA ATT HA (Implementera senare)

6. **Lägg till fler datakällor**
   - Ratsit scraping (soliditet, kreditbetyg)
   - Bolagsverket API (styrelse, ägare)
   - Google Places API (recensioner, öppettider)

---

## Anti-Hallucination & Anti-Laziness Åtgärder

### Problem: AI "hittar på" data som inte finns

**Lösningar:**

1. **Validera all data innan den sparas**
```typescript
function validateFinancialData(data: any) {
  if (!data.revenue || data.revenue.length === 0) {
    return { valid: false, error: 'No revenue data' };
  }
  if (data.soliditet && (data.soliditet < 0 || data.soliditet > 100)) {
    return { valid: false, error: 'Invalid soliditet value' };
  }
  return { valid: true };
}
```

2. **Kräv källreferenser**
```typescript
interface DataWithSource {
  value: any;
  source: 'allabolag' | 'ratsit' | 'scraping' | 'ai-inference';
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}
```

3. **Markera AI-genererad data tydligt**
```typescript
if (data.source === 'ai-inference') {
  data.label = '⚠️ AI-estimat (ej verifierad)';
}
```

4. **Kör cross-validation**
```typescript
// Jämför data från flera källor
const allabolagRevenue = await fetchFromAllabolag(company);
const ratsitRevenue = await fetchFromRatsit(company);

if (Math.abs(allabolagRevenue - ratsitRevenue) > 0.2 * allabolagRevenue) {
  console.warn('⚠️ Revenue mismatch between sources!');
}
```

---

## Nästa Steg

1. Implementera Soliditet & Kassalikviditet scraping
2. Fixa NewsAPI-integration
3. Lägg till Kronofogden scraping
4. Förbättra Checkout detection
5. Implementera kontaktpersons-scraping
6. Testa och verifiera alla datakällor

**Mål:** 100% data coverage utan hallucinationer eller laziness.
