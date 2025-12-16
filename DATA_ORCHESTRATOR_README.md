# Data Orchestrator - Komplett Guide

## Översikt
Data Orchestrator är ett protokoll-baserat system för datainsamling med flera steg, fallback-kedjor och anti-hallucination-åtgärder.

## Arkitektur

### 🎯 Protokoll-baserad Design
Systemet använder 5 huvudprotokoll som körs sekventiellt för att undvika quota-problem:

1. **Financial Protocol** (Prio 1) - Omsättning och ekonomi
2. **Company Info Protocol** (Prio 2) - Org.nummer, adress, bolagsinfo
3. **Tech Protocol** (Prio 3) - Teknisk stack, e-handel
4. **Contact Protocol** (Prio 4) - Beslutsfattare, kontaktinfo
5. **News Protocol** (Prio 5) - Nyheter och marknadsinfo

### 🔄 Fallback-kedjor
Varje protokoll har flera steg, och varje steg har en fallback-kedja:

```
Revenue Collection:
  1. Allabolag (primär)
  2. Ratsit (fallback 1)
  3. AI Scraping (fallback 2)

Tech Detection:
  1. BuiltWith (primär)
  2. Wappalyzer (fallback 1)
  3. AI Scraping (fallback 2)
```

## Datakällor

### 🇸🇪 Svenska Myndigheter & Register

#### Allabolag
- **Typ**: Web scraping
- **Data**: Omsättning (2 år), anställda, styrelse, adress
- **Kostnad**: Gratis (scraping)
- **Implementation**: `fetchFromAllabolag()`

#### Bolagsverket
- **Typ**: Web scraping / API
- **Data**: Org.nummer, bolagsform, registreringsdatum, styrelse
- **Kostnad**: Gratis (scraping)
- **Implementation**: `fetchFromBolagsverket()`

#### Kronofogden
- **Typ**: Web scraping
- **Data**: Skulder, ärenden
- **Kostnad**: Gratis
- **Implementation**: `fetchFromKronofogden()`

#### SCB (Statistiska Centralbyrån)
- **Typ**: Web scraping / API
- **Data**: Branschkod, anställda, region
- **Kostnad**: Gratis
- **Implementation**: `fetchFromSCB()`

### 💳 Kreditupplysning

#### Ratsit API
- **Typ**: REST API
- **Data**: Omsättning, kreditbetyg, adress, telefon, anställda
- **Kostnad**: Betald (API-nyckel krävs)
- **Setup**: `VITE_RATSIT_API_KEY`
- **Implementation**: `fetchFromRatsit()`

#### UC (Upplysningscentralen)
- **Typ**: REST API
- **Data**: Kreditbetyg, kreditpoäng, betalningsanmärkningar
- **Kostnad**: Betald
- **Setup**: `VITE_UC_API_KEY`
- **Implementation**: `fetchFromUC()`

### 🔧 Teknisk Stack

#### BuiltWith
- **Typ**: REST API
- **Data**: Teknologier, e-handelsplattform, analytics, hosting
- **Kostnad**: Betald
- **Setup**: `VITE_BUILTWITH_API_KEY`
- **Implementation**: `fetchFromBuiltWith()`

#### Wappalyzer
- **Typ**: REST API
- **Data**: Teknologier med versioner och kategorier
- **Kostnad**: Betald
- **Setup**: `VITE_WAPPALYZER_API_KEY`
- **Implementation**: `fetchFromWappalyzer()`

### 📧 Kontaktinformation

#### Hunter.io
- **Typ**: REST API
- **Data**: E-postadresser, namn, positioner
- **Kostnad**: Freemium (50 requests/månad gratis)
- **Setup**: `VITE_HUNTER_API_KEY`
- **Implementation**: `fetchFromHunter()`

#### LinkedIn
- **Typ**: AI-sökning via Gemini
- **Data**: Beslutsfattare, titlar, profiler
- **Kostnad**: Ingår i Gemini
- **Implementation**: Via `findPersonOnLinkedIn()`

### 📰 Nyheter

#### NewsAPI
- **Typ**: REST API
- **Data**: Artiklar, pressmeddelanden
- **Kostnad**: Freemium (100 requests/dag gratis)
- **Setup**: `VITE_NEWS_API_KEY`
- **Implementation**: `fetchCompanyNews()`

## Användning

### Basic Usage

```typescript
import { orchestrateDataCollection } from './services/dataOrchestrator';

const result = await orchestrateDataCollection(
  'Företagsnamn AB',
  'https://example.com',
  {
    protocols: ['Financial Data Collection', 'Company Information Collection'],
    enableFallbacks: true,
    antiHallucinationMode: true
  }
);

console.log('Data:', result.data);
console.log('Sources used:', result.sourcesUsed);
console.log('Protocols completed:', result.protocolsCompleted);
```

### Köra Specifika Protokoll

```typescript
// Endast ekonomisk data
const financialResult = await orchestrateDataCollection(
  companyName,
  websiteUrl,
  { protocols: ['Financial Data Collection'] }
);

// Endast teknisk stack
const techResult = await orchestrateDataCollection(
  companyName,
  websiteUrl,
  { protocols: ['Technology Stack Analysis'] }
);
```

### Lista Tillgängliga Protokoll

```typescript
import { listProtocols } from './services/dataOrchestrator';

const protocols = listProtocols();
protocols.forEach(p => {
  console.log(`${p.name} (Priority: ${p.priority})`);
  console.log(`  Required fields: ${p.requiredFields.join(', ')}`);
});
```

## Anti-Hallucination Åtgärder

### 1. Validering av Org.nummer
```typescript
validateOrgNumber(orgNumber) // Måste vara exakt 10 siffror
```

### 2. Validering av Omsättning
```typescript
validateRevenue(revenue) // Måste vara rimligt tal (0-100 miljarder)
```

### 3. Validering av Adress
```typescript
validateAddress(address) // Måste innehålla siffror och vara >5 tecken
```

### 4. Företagsnamnsjämförelse
```typescript
// Levenshtein-distans för att upptäcka hallucinerade namn
calculateSimilarity(inputName, foundName) > 0.6
```

### 5. Cross-Source Validation
Data från flera källor jämförs för att upptäcka avvikelser.

## Anti-Laziness Åtgärder

### 1. Obligatoriska Fält
Varje protokoll har `requiredFields` som MÅSTE fyllas:
```typescript
requiredFields: ['revenue', 'orgNumber']
```

### 2. Validators per Steg
Varje steg har en validator som måste returnera `true`:
```typescript
validator: (data) => data?.revenue && Array.isArray(data.revenue)
```

### 3. Retry-Mekanismer
```typescript
retries: 2 // Varje steg försöker 2 gånger vid fel
```

### 4. Timeout-Hantering
```typescript
timeout: 10000 // Max 10 sekunder per steg
```

## Quota-Hantering

### Multi-Step Processing
Protokoll körs **sekventiellt** med fördröjningar:
```typescript
// 2 sekunder mellan protokoll
await delay(2000);

// 1 sekund mellan steg
await delay(1000);

// 1.5 sekunder mellan fallback-försök
await delay(1500);

// 3 sekunder efter quota-fel
await delay(3000);
```

### Quota Error Detection
```typescript
if (error.message.includes('QUOTA') || error.message.includes('429')) {
  console.log('⏸️ Quota hit, trying next source');
  await delay(3000);
}
```

### Fallback-Kedjor
Om en källa når quota, prövas nästa automatiskt:
```
Allabolag (quota) → Ratsit → AI Scraping
```

## Exempel på Komplett Körning

```typescript
const result = await orchestrateDataCollection(
  'ACME AB',
  'https://acme.se',
  {
    enableFallbacks: true,
    antiHallucinationMode: true,
    strictValidation: true
  }
);

// Result structure:
{
  success: true,
  data: {
    orgNumber: '5566778899',
    companyName: 'ACME AB',
    revenue: [15000000, 18000000], // 2 år
    address: 'Storgatan 1, 111 22 Stockholm',
    creditRating: 'AAA',
    technologies: ['Shopify', 'Klarna', 'PostNord'],
    decisionMakers: [
      { name: 'Anna Andersson', title: 'VD', email: 'anna@acme.se' }
    ],
    news: [...]
  },
  sourcesUsed: ['allabolag', 'ratsit', 'builtwith', 'hunter', 'newsapi'],
  protocolsCompleted: [
    'Financial Data Collection',
    'Company Information Collection',
    'Technology Stack Analysis',
    'Contact Information Collection',
    'News & Market Intelligence'
  ],
  errors: [],
  validationsPassed: 12,
  validationsFailed: 2,
  processingTime: 45230
}
```

## Felsökning

### Problem: "No data collected"
**Lösning**: Kontrollera att API-nycklar är konfigurerade:
```bash
# .env
VITE_RATSIT_API_KEY=your_key
VITE_BUILTWITH_API_KEY=your_key
VITE_HUNTER_API_KEY=your_key
```

### Problem: "Validation failed"
**Lösning**: Kolla vilka valideringar som misslyckades:
```typescript
console.log('Validations failed:', result.validationsFailed);
console.log('Errors:', result.errors);
```

### Problem: "Quota exceeded"
**Lösning**: Systemet hanterar detta automatiskt med fallbacks. Om alla källor når quota:
- Öka delay mellan steg
- Kör färre protokoll samtidigt
- Använd caching

### Problem: "Hallucinated data"
**Lösning**: Aktivera strict mode:
```typescript
{ antiHallucinationMode: true, strictValidation: true }
```

## Best Practices

### 1. Använd Caching
```typescript
// Cache results för att undvika onödiga API-anrop
const cachedData = localStorage.getItem(`company_${orgNumber}`);
if (cachedData) return JSON.parse(cachedData);
```

### 2. Kör Protokoll Selektivt
```typescript
// Kör bara nödvändiga protokoll för att spara quota
const protocols = needsFinancials 
  ? ['Financial Data Collection']
  : ['Company Information Collection'];
```

### 3. Batch Processing
```typescript
// Processa flera företag med delay
for (const company of companies) {
  const result = await orchestrateDataCollection(...);
  await delay(5000); // 5 sekunder mellan företag
}
```

### 4. Error Handling
```typescript
try {
  const result = await orchestrateDataCollection(...);
  if (!result.success) {
    console.error('Orchestration failed:', result.errors);
  }
} catch (error) {
  console.error('Critical error:', error);
}
```

## API-Kostnader (Uppskattning)

| Tjänst | Kostnad | Requests/månad | Rekommendation |
|--------|---------|----------------|----------------|
| Ratsit | ~1000 SEK | 1000 | ⭐ Kritisk |
| UC | ~2000 SEK | 500 | Rekommenderad |
| BuiltWith | $295/mån | Unlimited | Rekommenderad |
| Wappalyzer | $99/mån | 10,000 | Valfri |
| Hunter.io | $49/mån | 1,000 | Rekommenderad |
| NewsAPI | Gratis | 100/dag | ⭐ Kritisk |

**Total kostnad**: ~5000-7000 SEK/månad för full funktionalitet

## Alternativa Lösningar

### Gratis Alternativ
1. **Web Scraping** istället för API:er (långsammare, mindre tillförlitligt)
2. **AI-analys** som primär källa (kräver mer tokens)
3. **Manuell datainsamling** för mindre volymer

### Hybrid-Approach (Rekommenderat)
- Använd API:er för kritisk data (omsättning, kreditbetyg)
- Använd scraping för sekundär data (teknisk stack, nyheter)
- Använd AI som fallback för allt

## Support & Dokumentation

- **Ratsit**: https://www.ratsit.se/api
- **UC**: https://www.uc.se/api
- **BuiltWith**: https://api.builtwith.com/
- **Wappalyzer**: https://www.wappalyzer.com/api/
- **Hunter.io**: https://hunter.io/api
- **NewsAPI**: https://newsapi.org/docs
