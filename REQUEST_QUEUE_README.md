# Request Queue & Rate Limiting System

## Problem
API quota exhaustion och rate limit-fel uppstod när systemet gjorde för många requests samtidigt till olika tjänster (Gemini, Firecrawl, Octoparse, etc.).

## Lösning
Implementerat ett centraliserat request queue-system som:
- Köar alla API-requests
- Tillämpar service-specifika rate limits
- Implementerar exponential backoff vid fel
- Förhindrar concurrent request-överbelastning
- Ger realtidsövervakning av API-användning

## 🎯 Funktioner

### 1. **Automatisk Request Queuing**
Alla API-requests går genom en central kö som:
- Prioriterar requests (1-10, högre = viktigare)
- Respekterar rate limits per service
- Väntar automatiskt vid quota-fel
- Försöker igen med exponential backoff

### 2. **Service-specifika Rate Limits**

```typescript
// Exempel: Gemini
{
  requestsPerMinute: 15,    // Max 15 requests/minut
  requestsPerHour: 1500,    // Max 1500 requests/timme
  concurrentRequests: 3,    // Max 3 samtidiga requests
  minDelay: 2000           // Min 2s mellan requests
}
```

**Konfigurerade Services:**
- **Gemini**: 15/min, 1500/h, 3 concurrent, 2s delay
- **Groq**: 30/min, 14400/h, 5 concurrent, 1s delay
- **DeepSeek**: 20/min, 3000/h, 3 concurrent, 1.5s delay
- **Firecrawl**: 10/min, 500/h, 2 concurrent, 3s delay
- **Octoparse**: 5/min, 100/h, 1 concurrent, 5s delay
- **Allabolag**: 10/min, 200/h, 2 concurrent, 3s delay
- **Ratsit**: 20/min, 1000/h, 3 concurrent, 2s delay
- **Hunter.io**: 10/min, 100/h, 2 concurrent, 3s delay
- **NewsAPI**: 5/min, 100/h, 1 concurrent, 5s delay

### 3. **Intelligent Retry Logic**

```typescript
// Exponential backoff vid quota-fel
Försök 1: Vänta 5s
Försök 2: Vänta 10s
Försök 3: Vänta 20s
Max väntetid: 30s
```

### 4. **Realtidsövervakning**
Admin-panel visar:
- Antal väntande requests i kö
- Processing-status (aktiv/vilande)
- Rate limit-användning per service
- Varningar vid hög användning (>90%)

## 📦 Användning

### Wrap API Calls

**Före:**
```typescript
const result = await scrapeWithFirecrawl(url);
```

**Efter:**
```typescript
import { queueRequest } from './requestQueue';

const result = await queueRequest(
  () => scrapeWithFirecrawl(url),
  'firecrawl',  // Service name
  5,            // Priority (1-10)
  2             // Max retries
);
```

### Exempel: Allabolag Scraper

```typescript
// services/allabolagScraper.ts
import { queueRequest } from './requestQueue';

export async function scrapeAllabolag(companyName: string) {
  // Firecrawl med queue
  const firecrawlResult = await queueRequest(
    () => scrapeWithFirecrawl(url, options),
    'firecrawl',
    5,  // Normal priority
    2   // 2 retries
  );

  // Octoparse fallback med queue
  if (!firecrawlResult) {
    const octoparseResult = await queueRequest(
      () => scrapeWithOctoparse(url),
      'octoparse',
      4,  // Slightly lower priority
      2
    );
  }
}
```

### Prioritering

**Priority Levels:**
- **10**: Kritiska user-initierade requests
- **7-9**: Viktiga data-enrichment
- **5-6**: Normal batch-processing
- **3-4**: Bakgrundsuppdateringar
- **1-2**: Låg prioritet, kan vänta

## 🔧 API

### `queueRequest(fn, service, priority, maxRetries)`

**Parameters:**
- `fn`: Function som returnerar Promise
- `service`: Service name (string)
- `priority`: 1-10 (högre = viktigare)
- `maxRetries`: Max antal retry-försök

**Returns:** Promise med resultatet

**Exempel:**
```typescript
const data = await queueRequest(
  async () => {
    const response = await fetch(url);
    return response.json();
  },
  'gemini',
  7,
  3
);
```

### `getQueueStatus()`

Returnerar aktuell queue-status:
```typescript
{
  queueSize: 5,              // Antal väntande requests
  processing: true,          // Om kön processar
  serviceStats: [
    {
      service: 'gemini',
      active: 2,              // Aktiva requests
      minuteCount: 8,         // Requests senaste minuten
      hourCount: 145          // Requests senaste timmen
    }
  ]
}
```

### `clearQueue()`

Rensar hela kön (emergency stop):
```typescript
import { clearQueue } from './requestQueue';

clearQueue(); // Avbryter alla väntande requests
```

### `updateServiceLimits(service, limits)`

Uppdatera rate limits dynamiskt:
```typescript
import { updateServiceLimits } from './requestQueue';

updateServiceLimits('gemini', {
  requestsPerMinute: 20,  // Öka från 15 till 20
  minDelay: 1500          // Minska från 2000ms till 1500ms
});
```

## 🎨 Admin UI - Request Queue Monitor

**Plats:** `/admin/monitoring/queue`

**Funktioner:**
- ✅ Realtidsövervakning (auto-refresh var 2:a sekund)
- ✅ Visuella progress bars för rate limits
- ✅ Färgkodade varningar (grön/gul/röd)
- ✅ Pausa/starta auto-refresh
- ✅ Rensa kö-knapp (emergency)

**Färgkoder:**
- 🟢 **Grön**: <70% av limit
- 🟡 **Gul**: 70-90% av limit
- 🔴 **Röd**: >90% av limit

## 🚨 Felhantering

### Quota Exhausted
```typescript
try {
  const result = await queueRequest(fn, 'gemini', 5, 3);
} catch (error) {
  if (error.message.includes('quota exhausted')) {
    // Quota slut efter 3 retries
    // Använd fallback-service
    const fallback = await queueRequest(fn, 'groq', 5, 2);
  }
}
```

### Rate Limit Hit
Systemet hanterar automatiskt:
1. Detekterar 429-fel
2. Väntar med exponential backoff
3. Försöker igen upp till maxRetries
4. Kastar fel om alla försök misslyckas

### Service Unavailable
```typescript
// Automatisk fallback-kedja
try {
  return await queueRequest(() => geminiCall(), 'gemini', 5, 2);
} catch {
  try {
    return await queueRequest(() => groqCall(), 'groq', 5, 2);
  } catch {
    return await queueRequest(() => deepseekCall(), 'deepseek', 5, 2);
  }
}
```

## 📊 Övervakning

### Console Logs
```
📥 Queued firecrawl request (Queue size: 3)
🚀 Executing firecrawl request (0/2)
✅ firecrawl request completed
⏸️ Rate limit reached for gemini, waiting...
🔄 Re-queuing gemini after 5000ms (retry 1/3)
```

### Admin Dashboard
- Se antal väntande requests
- Övervaka rate limit-användning
- Identifiera flaskhalsar
- Få varningar vid hög belastning

## 🎯 Best Practices

### 1. Använd Rätt Prioritet
```typescript
// Kritisk user-request
await queueRequest(fn, 'gemini', 10, 3);

// Batch-processing
await queueRequest(fn, 'gemini', 5, 2);

// Bakgrundsuppdatering
await queueRequest(fn, 'gemini', 2, 1);
```

### 2. Välj Rätt Service
```typescript
// Snabb, gratis → Groq först
await queueRequest(fn, 'groq', 7, 2);

// Fallback till Gemini
await queueRequest(fn, 'gemini', 7, 2);

// Sista utväg → DeepSeek
await queueRequest(fn, 'deepseek', 7, 2);
```

### 3. Batch Requests
```typescript
// Dåligt: Alla samtidigt
for (const lead of leads) {
  await scrapeAllabolag(lead.name);
}

// Bra: Låt queue hantera rate limiting
const promises = leads.map(lead => 
  queueRequest(
    () => scrapeAllabolag(lead.name),
    'allabolag',
    5,
    2
  )
);
await Promise.all(promises);
```

### 4. Hantera Fel Gracefully
```typescript
const result = await queueRequest(fn, 'gemini', 5, 3)
  .catch(error => {
    console.warn('Gemini failed, using fallback');
    return queueRequest(fn, 'groq', 5, 2);
  })
  .catch(error => {
    console.error('All services failed');
    return null; // Graceful degradation
  });
```

## 🔄 Migration Guide

### Uppdatera Befintlig Kod

**1. Importera queueRequest:**
```typescript
import { queueRequest } from './requestQueue';
```

**2. Wrap API calls:**
```typescript
// Före
const result = await apiCall();

// Efter
const result = await queueRequest(
  () => apiCall(),
  'service-name',
  5,
  2
);
```

**3. Testa:**
```typescript
// Kör flera requests och verifiera att de köas
for (let i = 0; i < 20; i++) {
  queueRequest(() => apiCall(), 'gemini', 5, 2);
}

// Kontrollera status
console.log(getQueueStatus());
```

## 📈 Förväntade Resultat

### Före Request Queue
- ❌ Frekventa 429-fel
- ❌ Quota exhausted errors
- ❌ Slöseri med API-kvoter
- ❌ Dålig användarupplevelse

### Efter Request Queue
- ✅ Inga 429-fel (automatisk rate limiting)
- ✅ Effektiv kvotanvändning
- ✅ Automatiska retries
- ✅ Förutsägbar prestanda
- ✅ Bättre användarupplevelse

## 🎓 Exempel: Komplett Integration

```typescript
// services/dataOrchestrator.ts
import { queueRequest } from './requestQueue';

async function fetchFinancialData(companyName: string, orgNumber: string) {
  // Försök Allabolag först (högsta prioritet)
  try {
    return await queueRequest(
      () => fetchFromAllabolag(companyName, orgNumber),
      'allabolag',
      8,  // Hög prioritet
      2
    );
  } catch (error) {
    console.log('Allabolag failed, trying Ratsit');
  }

  // Fallback till Ratsit
  try {
    return await queueRequest(
      () => fetchFromRatsit(orgNumber),
      'ratsit',
      7,
      2
    );
  } catch (error) {
    console.log('Ratsit failed, trying UC');
  }

  // Sista fallback: UC
  return await queueRequest(
    () => fetchFromUC(orgNumber),
    'uc',
    6,
    1
  );
}
```

## 🚀 Deployment

Systemet är automatiskt aktivt när du:
1. Importerar `queueRequest` från `./services/requestQueue`
2. Wrappar dina API calls
3. Deployer till produktion

**Ingen konfiguration krävs** - standardinställningar fungerar för de flesta use cases.

## 📞 Support

Vid problem:
1. Kontrollera Request Queue Monitor i admin-panelen
2. Kolla console logs för queue-status
3. Justera rate limits om nödvändigt
4. Använd `clearQueue()` vid emergency

**Systemet är nu skyddat mot API quota exhaustion!** 🛡️
