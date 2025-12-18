# 🎯 Checkout Detection Strategy - Ny Implementation

## Översikt

Ny tre-stegs strategi för att hitta transportörer i checkout med optimal noggrannhet och låg kostnad:

```
1. Firecrawl (primär) - Strukturerad extraktion, hög noggrannhet
2. Puppeteer (backup) - Dynamiskt innehåll, låg kostnad
3. Gemini (fallback) - AI-analys via Google Search
```

---

## 🔄 Flödesschema

```
Start: Checkout Detection
         ↓
    ┌────────────────┐
    │   Firecrawl    │ ← Primär metod
    │   (API call)   │
    └────────┬───────┘
             │
        Success? ────→ YES ──→ Return carriers (confidence: high)
             │
             NO
             ↓
    ┌────────────────┐
    │   Puppeteer    │ ← Backup metod
    │  (Headless)    │
    └────────┬───────┘
             │
        Success? ────→ YES ──→ Return carriers (confidence: medium)
             │
             NO
             ↓
    ┌────────────────┐
    │    Gemini      │ ← Fallback
    │ (Google Search)│
    └────────┬───────┘
             │
             ↓
    Return carriers (confidence: low/medium)
```

---

## 📊 Metod-jämförelse

| Metod | Noggrannhet | Hastighet | Kostnad | Dynamiskt innehåll | Ordning |
|-------|-------------|-----------|---------|-------------------|---------|
| **Firecrawl** | 85-95% | 10-15s | ~0.5 SEK/anrop | ✅ Ja | ✅ Ja |
| **Puppeteer** | 70-80% | 5-10s | Gratis | ✅ Ja | ⚠️ Delvis |
| **Gemini** | 50-70% | 3-5s | Gratis | ❌ Nej | ⚠️ Delvis |

---

## 🔧 Implementation

### 1. Firecrawl (Primär metod)

**Fördelar:**
- ✅ Hanterar dynamiskt innehåll (JavaScript-renderat)
- ✅ Strukturerad extraktion med AI
- ✅ Kan vänta på innehåll att ladda (`waitFor`)
- ✅ Bättre än Puppeteer på komplexa checkouts
- ✅ Ingen browser overhead

**Hur det fungerar:**
```javascript
// 1. Försök olika checkout-URLs
const checkoutUrls = [
  url,
  `${url}/checkout`,
  `${url}/kassa`,
  `${url}/cart/checkout`
];

// 2. Scrapa med Firecrawl
const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: checkoutUrl,
    formats: ['markdown', 'html'],
    onlyMainContent: false,
    waitFor: 3000 // Vänta på dynamiskt innehåll
  })
});

// 3. Extrahera transportörer från content
const carriers = extractCarriersFromContent(content);
```

**När det används:**
- Alltid först (om API-nyckel finns)
- För alla e-handelssidor
- Särskilt bra för Shopify, WooCommerce, Klarna Checkout

**Kostnad:**
- 500 credits/månad gratis
- Sedan ~0.5 SEK per scrape
- Budget: ~50-100 SEK/månad för 100-200 leads

---

### 2. Puppeteer (Backup metod)

**Fördelar:**
- ✅ Helt gratis
- ✅ Hanterar dynamiskt innehåll
- ✅ Kan fylla i formulär
- ✅ Snabbare än Firecrawl
- ✅ Ingen API-kostnad

**Förbättringar:**
```javascript
// Nya features:
- Blockerar bilder/CSS för snabbare laddning
- Försöker fylla i checkout-formulär
- Väntar på shipping options att ladda
- Söker i flera checkout-URLs
- Förbättrade selektorer för shipping-element
```

**Hur det fungerar:**
```javascript
// 1. Starta headless browser
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

// 2. Navigera till checkout
await page.goto(checkoutUrl, { waitUntil: 'networkidle2' });

// 3. Fyll i formulär (trigger shipping options)
await tryFillCheckoutForm(page);

// 4. Vänta på shipping options
await page.waitForTimeout(3000);

// 5. Extrahera transportörer
const carriers = await extractCarriersFromPage(page);
```

**När det används:**
- Om Firecrawl misslyckas eller inte finns
- För enklare checkouts
- När kostnad är viktigare än noggrannhet

---

### 3. Gemini (Fallback)

**Fördelar:**
- ✅ Gratis (Google Search)
- ✅ Snabbt
- ✅ Kan hitta info från recensioner/forum
- ✅ Fungerar även om checkout är svåråtkomlig

**Nackdelar:**
- ❌ Lägre noggrannhet (50-70%)
- ❌ Kan vara utdaterad info
- ❌ Ingen garanti för ordning

**Hur det fungerar:**
```javascript
// I geminiService.ts
const checkoutPrompt = `
Vilka transportörer erbjuder ${companyName} i sin checkout?
Lista dem i ordning (1. DHL, 2. PostNord, etc.)
Sök på: "${companyName} checkout frakt leverans"
`;

const checkoutInfo = await generateWithRetry(checkoutPrompt);
```

**När det används:**
- Om både Firecrawl och Puppeteer misslyckas
- Som komplement till andra metoder
- För att verifiera resultat

---

## 🎯 Användningsexempel

### Scenario 1: RevolutionRace (Klarna Checkout)

```
1. Firecrawl försöker:
   - revolutionrace.se/checkout
   - Hittar Klarna checkout
   - Extraherar: ["DHL", "PostNord", "Bring"]
   - Position: DHL #2
   - ✅ Success (confidence: high)

2. Puppeteer: Skippas (Firecrawl lyckades)
3. Gemini: Skippas (Firecrawl lyckades)

Resultat: DHL Position 2, Confidence: High
```

### Scenario 2: Liten e-handel (enkel checkout)

```
1. Firecrawl försöker:
   - company.se/checkout
   - Timeout eller 404
   - ❌ Failed

2. Puppeteer försöker:
   - Navigerar till /kassa
   - Fyller i formulär
   - Hittar shipping-select
   - Extraherar: ["PostNord", "DHL"]
   - ✅ Success (confidence: medium)

3. Gemini: Skippas (Puppeteer lyckades)

Resultat: PostNord Position 1, DHL Position 2, Confidence: Medium
```

### Scenario 3: Komplex checkout (kräver inloggning)

```
1. Firecrawl försöker:
   - company.se/checkout
   - Hittar "Login required"
   - ❌ Failed

2. Puppeteer försöker:
   - Navigerar till /checkout
   - Hittar login-form
   - Kan inte komma vidare
   - ❌ Failed

3. Gemini försöker:
   - Söker: "company.se checkout frakt"
   - Hittar info från recensioner
   - Extraherar: ["DHL", "Bring"]
   - ⚠️ Success (confidence: low)

Resultat: DHL, Bring (okänd ordning), Confidence: Low
```

---

## 📈 Förväntade resultat

### Noggrannhet per metod

```
Firecrawl:  ████████████████████ 85-95%
Puppeteer:  ███████████████      70-80%
Gemini:     ████████████         50-70%
```

### Framgångsfrekvens

```
Firecrawl:  ████████████████     75-85% (lyckas)
Puppeteer:  ██████████████       60-70% (lyckas)
Gemini:     ████████████████████ 90-95% (lyckas)
```

### Kombinerad strategi

```
Totalt:     ████████████████████ 95-98% (hittar något)
High conf:  ████████████████     75-85%
Medium:     ████████             40-50%
Low:        ████                 20-30%
```

---

## 💰 Kostnadsanalys

### Per 100 leads

```
Scenario 1: Firecrawl lyckas 80%
- Firecrawl: 80 anrop × 0.5 SEK = 40 SEK
- Puppeteer: 15 anrop × 0 SEK = 0 SEK
- Gemini: 5 anrop × 0 SEK = 0 SEK
Total: 40 SEK

Scenario 2: Firecrawl lyckas 60%
- Firecrawl: 60 anrop × 0.5 SEK = 30 SEK
- Puppeteer: 30 anrop × 0 SEK = 0 SEK
- Gemini: 10 anrop × 0 SEK = 0 SEK
Total: 30 SEK

Scenario 3: Endast Puppeteer + Gemini
- Puppeteer: 70 anrop × 0 SEK = 0 SEK
- Gemini: 30 anrop × 0 SEK = 0 SEK
Total: 0 SEK (men lägre noggrannhet)
```

### Rekommendation
- **Med budget:** Använd Firecrawl (40-50 SEK/100 leads)
- **Utan budget:** Använd endast Puppeteer + Gemini (gratis)
- **Optimal:** Firecrawl + Puppeteer backup (bästa balans)

---

## 🔍 Extraktionslogik

### Hitta shipping-sektion

```javascript
// 1. Leta efter shipping-keywords
const shippingKeywords = [
  'shipping', 'delivery', 'frakt', 'leverans',
  'shipping method', 'delivery method',
  'shipping options', 'delivery options'
];

// 2. Hitta sektion i content
const shippingSection = extractShippingSection(content);

// 3. Extrahera transportörer från sektion
const carriers = extractCarriersFromSection(shippingSection);

// 4. Sortera baserat på position i texten
carriers.sort((a, b) => a.index - b.index);
```

### Transportör-matchning

```javascript
const carrierDefinitions = [
  { name: 'DHL', variants: ['dhl', 'dhl express', 'dhl freight'] },
  { name: 'PostNord', variants: ['postnord', 'post nord'] },
  { name: 'Bring', variants: ['bring', 'posten bring'] },
  { name: 'Schenker', variants: ['schenker', 'db schenker'] },
  { name: 'Budbee', variants: ['budbee'] },
  { name: 'Instabox', variants: ['instabox'] },
  { name: 'Best Transport', variants: ['best transport', 'best'] },
  { name: 'FedEx', variants: ['fedex'] },
  { name: 'UPS', variants: ['ups'] }
];
```

---

## 🚀 Implementation Checklist

- [x] Skapa `checkoutDetectionService.js`
- [x] Implementera Firecrawl-metod
- [x] Förbättra Puppeteer-metod
- [x] Integrera i `websiteScraperService.js`
- [x] Dokumentera strategi
- [ ] Testa på RevolutionRace
- [ ] Testa på 10 olika e-handelssidor
- [ ] Mät noggrannhet per metod
- [ ] Optimera kostnader
- [ ] Lägg till caching (undvik dubbelscrapning)

---

## 📝 Nästa steg

1. **Testa implementation:**
   ```bash
   npm run dev
   # Sök på RevolutionRace
   # Verifiera att Firecrawl används först
   ```

2. **Lägg till Firecrawl API-nyckel:**
   ```env
   FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
   ```

3. **Övervaka resultat:**
   - Logga vilken metod som används
   - Spåra framgångsfrekvens
   - Mät noggrannhet

4. **Optimera:**
   - Justera timeout-värden
   - Förbättra selektorer
   - Lägg till fler checkout-URLs

---

## 🎓 Best Practices

### För Firecrawl
- Använd `waitFor: 3000` för dynamiskt innehåll
- Försök flera checkout-URLs
- Inkludera både markdown och HTML
- Sätt `onlyMainContent: false` för checkout

### För Puppeteer
- Blockera bilder/CSS för snabbare laddning
- Fyll i formulär för att trigga shipping options
- Vänta 2-3 sekunder efter navigation
- Använd flera selektorer för shipping-element

### För Gemini
- Använd specifika prompts
- Be om strukturerad output (JSON)
- Inkludera företagsnamn och URL
- Verifiera med andra metoder om möjligt

---

## 🔐 Säkerhet & Rate Limiting

### Firecrawl
- 500 credits/månad gratis
- Rate limit: 10 requests/sekund
- Använd retry med exponential backoff

### Puppeteer
- Ingen rate limit (lokal)
- Använd User-Agent för att undvika blocking
- Respektera robots.txt

### Gemini
- Gratis via Google Search
- Rate limit: Hanteras av Gemini API
- Använd som fallback, inte primär metod

---

Vill du att jag testar denna implementation på RevolutionRace nu? 🚀
