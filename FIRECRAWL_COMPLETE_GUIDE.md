# 🔥 Firecrawl Complete Guide - Alla Endpoints

**API Key:** `fc-0fe3e552a23248159a621397d9a29b1b`  
**Status:** ✅ Alla 4 endpoints implementerade

---

## 🎯 **Översikt**

Firecrawl är en AI-powered web scraping service med 4 huvudfunktioner:

1. **Scrape** - Scrapa enskilda sidor
2. **Crawl** - Crawla hela webbplatser
3. **Extract** - Strukturerad data-extraktion
4. **Search** - Sök på webben

---

## 🔧 **Setup**

### **Steg 1: Lägg till API-nyckel**

```bash
# Öppna .env i root
notepad .env
```

```env
# Lägg till:
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
```

### **Steg 2: Starta om servern**

```bash
# Stoppa servern (Ctrl+C)
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

### **Steg 3: Verifiera**

```javascript
// I browser console (F12):
console.log(import.meta.env.VITE_FIRECRAWL_API_KEY);
// Ska visa: fc-0fe3e552a23248159a621397d9a29b1b
```

---

## 📚 **Endpoint 1: SCRAPE**

### **Användning:**
Scrapa en enskild sida och få markdown/HTML.

### **Funktion:**
```typescript
scrapeWithFirecrawl(url: string, options?: {
  formats?: ('markdown' | 'html' | 'rawHtml')[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
})
```

### **Exempel:**

#### **Enkel scraping:**
```typescript
import { scrapeWithFirecrawl } from './services/firecrawlService';

const result = await scrapeWithFirecrawl('https://www.allabolag.se/5566778899');
console.log(result.data.markdown);
```

#### **Avancerad scraping:**
```typescript
const result = await scrapeWithFirecrawl('https://example.com', {
  formats: ['markdown', 'html'],
  onlyMainContent: true,
  excludeTags: ['script', 'style', 'nav', 'footer'],
  waitFor: 2000  // Vänta 2s för dynamiskt innehåll
});
```

### **Response:**
```json
{
  "success": true,
  "data": {
    "markdown": "# Företagsnamn\n\nOmsättning: 10 MSEK...",
    "html": "<h1>Företagsnamn</h1>...",
    "metadata": {
      "title": "Företagsnamn - Allabolag",
      "description": "...",
      "language": "sv"
    },
    "links": ["https://...", "https://..."]
  }
}
```

### **Användning i Lead Hunter:**
- ✅ Allabolag scraping (`allabolagScraper.ts`)
- ✅ Website analysis (`geminiService.ts`)
- ✅ Company data extraction

---

## 🕷️ **Endpoint 2: CRAWL**

### **Användning:**
Crawla en hel webbplats och få alla sidor.

### **Funktion:**
```typescript
crawlWithFirecrawl(url: string, options?: {
  maxDepth?: number;
  limit?: number;
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
})
```

### **Exempel:**

#### **Crawla företagswebbplats:**
```typescript
import { crawlWithFirecrawl, getFirecrawlJobStatus } from './services/firecrawlService';

// Starta crawl
const crawlResult = await crawlWithFirecrawl('https://example.com', {
  maxDepth: 2,        // Max 2 nivåer djupt
  limit: 20,          // Max 20 sidor
  allowBackwardLinks: false,
  allowExternalLinks: false
});

console.log('Job ID:', crawlResult.jobId);

// Kolla status
const status = await getFirecrawlJobStatus(crawlResult.jobId);
console.log('Status:', status.status);  // 'processing' | 'completed' | 'failed'
console.log('Pages:', status.data);     // Array av scrapade sidor
```

### **Response:**
```json
{
  "success": true,
  "jobId": "crawl_abc123",
  "status": "processing"
}
```

**Status check:**
```json
{
  "status": "completed",
  "data": [
    {
      "url": "https://example.com",
      "markdown": "...",
      "metadata": {...}
    },
    {
      "url": "https://example.com/about",
      "markdown": "...",
      "metadata": {...}
    }
  ]
}
```

### **Användning i Lead Hunter:**
- Crawla hela företagswebbplatser
- Hitta alla produktsidor
- Kartlägga webbplatsstruktur
- Analysera innehåll över flera sidor

---

## 🎯 **Endpoint 3: EXTRACT**

### **Användning:**
Extrahera strukturerad data med AI-schema.

### **Funktion:**
```typescript
extractStructuredData(url: string, schema: any)
```

### **Exempel:**

#### **Extrahera företagsdata:**
```typescript
import { extractStructuredData } from './services/firecrawlService';

const schema = {
  type: 'object',
  properties: {
    companyName: { type: 'string' },
    orgNumber: { type: 'string' },
    revenue: { type: 'number' },
    employees: { type: 'number' },
    address: { type: 'string' },
    phone: { type: 'string' },
    email: { type: 'string' }
  },
  required: ['companyName', 'orgNumber']
};

const data = await extractStructuredData('https://www.allabolag.se/5566778899', schema);

console.log(data);
// {
//   companyName: "ACME AB",
//   orgNumber: "5566778899",
//   revenue: 10000000,
//   employees: 25,
//   address: "Storgatan 1, Stockholm",
//   phone: "+46 8 123 456",
//   email: "info@acme.se"
// }
```

#### **Extrahera produkter:**
```typescript
const productSchema = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
          description: { type: 'string' },
          inStock: { type: 'boolean' }
        }
      }
    }
  }
};

const products = await extractStructuredData('https://shop.example.com', productSchema);
```

### **Användning i Lead Hunter:**
- ✅ Extrahera företagsdata från Allabolag
- ✅ Hämta produktinformation från e-handel
- ✅ Strukturera kontaktinformation
- ✅ Analysera priser och erbjudanden

---

## 🔍 **Endpoint 4: SEARCH**

### **Användning:**
Sök på webben och få relevanta resultat.

### **Funktion:**
```typescript
searchWithFirecrawl(query: string, options?: {
  limit?: number;
  lang?: string;
  country?: string;
})
```

### **Exempel:**

#### **Sök företagsinformation:**
```typescript
import { searchWithFirecrawl, searchCompanyInfo } from './services/firecrawlService';

// Generell sökning
const results = await searchWithFirecrawl('ACME AB Sweden', {
  limit: 10,
  lang: 'sv',
  country: 'SE'
});

console.log(results.data);
// [
//   {
//     url: "https://www.allabolag.se/...",
//     title: "ACME AB - Allabolag",
//     description: "Företagsinformation om ACME AB...",
//     content: "..."
//   }
// ]

// Företagsspecifik sökning
const companyInfo = await searchCompanyInfo('ACME AB');
```

#### **Sök nyheter:**
```typescript
const news = await searchWithFirecrawl('ACME AB nyheter expansion', {
  limit: 5,
  lang: 'sv',
  country: 'SE'
});
```

### **Användning i Lead Hunter:**
- Hitta företagswebbplatser
- Sök efter nyheter
- Hitta kontaktinformation
- Verifiera företagsdata

---

## 🎯 **Användningsexempel i Lead Hunter**

### **1. Komplett företagsanalys:**

```typescript
import { 
  scrapeWithFirecrawl, 
  extractStructuredData, 
  searchCompanyInfo 
} from './services/firecrawlService';

async function analyzeCompany(companyName: string, orgNumber: string) {
  // 1. Sök efter företaget
  const searchResults = await searchCompanyInfo(companyName);
  const allabolagUrl = searchResults.find(r => r.url.includes('allabolag.se'))?.url;
  
  if (!allabolagUrl) {
    console.log('Företag inte hittat på Allabolag');
    return null;
  }

  // 2. Scrapa Allabolag-sidan
  const scrapeResult = await scrapeWithFirecrawl(allabolagUrl, {
    formats: ['markdown'],
    onlyMainContent: true
  });

  // 3. Extrahera strukturerad data
  const schema = {
    type: 'object',
    properties: {
      companyName: { type: 'string' },
      orgNumber: { type: 'string' },
      revenue: { type: 'array', items: { type: 'number' } },
      employees: { type: 'number' },
      ceo: { type: 'string' },
      address: { type: 'string' }
    }
  };

  const structuredData = await extractStructuredData(allabolagUrl, schema);

  return {
    ...structuredData,
    rawContent: scrapeResult.data.markdown,
    source: allabolagUrl
  };
}
```

### **2. E-handelsanalys:**

```typescript
async function analyzeEcommerce(websiteUrl: string) {
  // 1. Crawla webbplatsen
  const crawlResult = await crawlWithFirecrawl(websiteUrl, {
    maxDepth: 2,
    limit: 50
  });

  // 2. Vänta på completion
  let status;
  do {
    await new Promise(resolve => setTimeout(resolve, 5000));
    status = await getFirecrawlJobStatus(crawlResult.jobId);
  } while (status.status === 'processing');

  // 3. Analysera alla sidor
  const pages = status.data || [];
  
  // Hitta checkout-sida
  const checkoutPage = pages.find(p => 
    p.url.includes('checkout') || p.url.includes('kassa')
  );

  if (checkoutPage) {
    // 4. Extrahera leverantörer från checkout
    const schema = {
      type: 'object',
      properties: {
        shippingProviders: {
          type: 'array',
          items: { type: 'string' }
        },
        paymentMethods: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    };

    const checkoutData = await extractStructuredData(checkoutPage.url, schema);
    
    return {
      hasCheckout: true,
      shippingProviders: checkoutData.shippingProviders,
      paymentMethods: checkoutData.paymentMethods,
      totalPages: pages.length
    };
  }

  return { hasCheckout: false, totalPages: pages.length };
}
```

---

## 💰 **Kostnad & Limits**

### **Pricing:**
- **Scrape:** $0.005 per request
- **Crawl:** $0.005 per page
- **Extract:** $0.01 per request
- **Search:** $0.01 per request

### **Free Tier:**
- 500 credits/månad gratis
- 1 credit = 1 scrape/crawl page

### **Uppskattad kostnad för Lead Hunter:**

**Låg användning (10 leads/dag):**
- Scrape: 10 × $0.005 = $0.05/dag
- Extract: 10 × $0.01 = $0.10/dag
- **Total:** ~$4.50/månad

**Medel användning (50 leads/dag):**
- Scrape: 50 × $0.005 = $0.25/dag
- Extract: 50 × $0.01 = $0.50/dag
- **Total:** ~$22.50/månad

**Hög användning (200 leads/dag):**
- Scrape: 200 × $0.005 = $1.00/dag
- Extract: 200 × $0.01 = $2.00/dag
- **Total:** ~$90/månad

---

## 🚀 **Best Practices**

### **1. Använd rätt endpoint:**

```typescript
// ✅ BRA - Scrape för enskilda sidor
const data = await scrapeWithFirecrawl('https://allabolag.se/5566778899');

// ❌ DÅLIGT - Crawl för enskilda sidor (onödigt dyrt)
const data = await crawlWithFirecrawl('https://allabolag.se/5566778899');
```

### **2. Cacha resultat:**

```typescript
// ✅ BRA - Cacha Firecrawl-resultat
const cacheKey = `firecrawl_${orgNumber}`;
const cached = localStorage.getItem(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await scrapeWithFirecrawl(url);
localStorage.setItem(cacheKey, JSON.stringify(result));
```

### **3. Använd request queue:**

```typescript
// ✅ BRA - Använd request queue för rate limiting
import { queueRequest } from './requestQueue';

const result = await queueRequest(
  () => scrapeWithFirecrawl(url),
  'firecrawl',
  5,
  2
);
```

### **4. Hantera fel gracefully:**

```typescript
// ✅ BRA - Fallback vid fel
try {
  const result = await scrapeWithFirecrawl(url);
  return result.data.markdown;
} catch (error) {
  console.warn('Firecrawl failed, using fallback');
  // Fallback till annan scraping-metod
  return await scrapeWithOctoparse(url);
}
```

---

## 🔧 **Felsökning**

### **Problem: "Invalid API Key"**
**Lösning:**
```bash
# Kontrollera att nyckeln är korrekt
console.log(import.meta.env.VITE_FIRECRAWL_API_KEY);

# Starta om servern
npm run dev
```

### **Problem: "Rate limit exceeded"**
**Lösning:**
- Använd request queue (redan implementerad)
- Lägg till delay mellan requests
- Uppgradera till högre plan

### **Problem: "Scraping failed"**
**Lösning:**
```typescript
// Öka waitFor-tid för dynamiskt innehåll
const result = await scrapeWithFirecrawl(url, {
  waitFor: 5000  // Vänta 5s
});

// Eller använd crawl istället
const crawlResult = await crawlWithFirecrawl(url);
```

---

## 📊 **Sammanfattning**

### **Alla 4 endpoints implementerade:**
1. ✅ **Scrape** - `scrapeWithFirecrawl()`
2. ✅ **Crawl** - `crawlWithFirecrawl()`, `getFirecrawlJobStatus()`
3. ✅ **Extract** - `extractStructuredData()`
4. ✅ **Search** - `searchWithFirecrawl()`, `searchCompanyInfo()`

### **Nuvarande användning i Lead Hunter:**
- ✅ Allabolag scraping
- ✅ Website analysis
- ✅ Company data extraction
- ✅ E-commerce detection

### **Potential för mer:**
- Crawla hela företagswebbplatser
- Extrahera produktkataloger
- Sök efter nyheter och pressmeddelanden
- Verifiera kontaktinformation

---

**API Key:** `fc-0fe3e552a23248159a621397d9a29b1b`  
**Status:** ✅ Redo att använda!  
**Kostnad:** ~$4.50-90/månad beroende på användning
