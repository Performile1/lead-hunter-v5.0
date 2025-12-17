# 🔍 Unified Search Strategy - Scraping + API:er

**Syfte:** En sökning som kombinerar scraping och API:er för att hämta all data  
**Strategi:** Använd scraping tills alla API:er är på plats  
**Version:** 5.0  
**Datum:** 2025-12-17

---

## 🎯 **VISION:**

### **En sökning - all data:**
```
Sök företag → Unified Search → Komplett leadkort
```

**Datakällor (i prioritetsordning):**
1. Allabolag (omsättning, ekonomi)
2. Bolagsverket (grundläggande företagsinfo)
3. Kronofogden (betalningsanmärkningar)
4. LinkedIn (kontaktpersoner: VD, CFO, Logistikchef)
5. Företagets webbplats (e-handel, teknologier, leverantörer)
6. Nyheter (expansion, tillväxt, investeringar)

---

## 📊 **NULÄGE: Hybrid Scraping + API**

### **Vad som fungerar idag:**

#### **✅ Firecrawl API (Implementerad)**
**Används för:**
- Allabolag-scraping (omsättning, kreditbetyg)
- Företagswebbplatser (struktur, innehåll)
- Nyhetsartiklar

**Status:** ✅ Fungerar, 4 endpoints implementerade

#### **✅ Gemini AI (Implementerad)**
**Används för:**
- AI-analys av företagsdata
- Opportunity score
- Sales pitch
- Triggers
- Kontaktpersoner (VD, CFO, Logistikchef)

**Status:** ✅ Fungerar, fallback till Groq

#### **✅ Groq AI (Implementerad)**
**Används för:**
- Fallback när Gemini når quota
- Snabbare analys (mindre noggrann)

**Status:** ✅ Fungerar som fallback

#### **⚠️ Puppeteer (Implementerad men ej integrerad)**
**Kan användas för:**
- Dynamiska webbplatser
- JavaScript-tunga sidor
- E-handelsplattformar
- Checkout-analys

**Status:** ⚠️ Finns i `hybridScraperService.ts` men används INTE

#### **❌ Crawl4AI (Stub)**
**Skulle kunna användas för:**
- AI-driven scraping
- Intelligent extraktion

**Status:** ❌ Kräver Python backend (inte implementerad)

---

## 🔄 **UNIFIED SEARCH FLOW:**

### **Steg 1: Grundläggande företagsinfo**
```
Input: Företagsnamn eller org.nr
↓
Bolagsverket (scraping eller API)
↓
Output: Namn, org.nr, adress, bransch
```

**Metod:** Scraping (tills Bolagsverket API finns)

---

### **Steg 2: Ekonomisk data**
```
Input: Org.nr
↓
Allabolag (Firecrawl scraping)
↓
Output: Omsättning, kreditbetyg, antal anställda
```

**Metod:** ✅ Firecrawl (implementerad i `allabolagScraper.ts`)

---

### **Steg 3: Betalningsanmärkningar**
```
Input: Org.nr
↓
Kronofogden (scraping eller API)
↓
Output: Antal anmärkningar, belopp
```

**Metod:** Scraping (tills Kronofogden API finns)

---

### **Steg 4: Kontaktpersoner**
```
Input: Företagsnamn
↓
LinkedIn (Gemini AI-sökning)
↓
Output: VD, CFO, Logistikchef (namn, titel, LinkedIn-URL)
```

**Metod:** ✅ Gemini AI (implementerad i `geminiService.ts`)

---

### **Steg 5: E-handel & Teknologier**
```
Input: Företagswebbplats
↓
Firecrawl scraping + Puppeteer
↓
Output: E-handelsplattform, checkout, leverantörer, teknologier
```

**Metod:** 
- ✅ Firecrawl för grundläggande scraping
- ⚠️ Puppeteer för dynamiska sidor (ej integrerad)

---

### **Steg 6: Nyheter**
```
Input: Företagsnamn
↓
NewsAPI eller Firecrawl
↓
Output: Senaste nyheter, expansion, investeringar
```

**Metod:** 
- ⚠️ NewsAPI (API-nyckel saknas)
- ✅ Firecrawl som fallback

---

## 🏗️ **IMPLEMENTATION PLAN:**

### **Fas 1: Förbättra befintlig scraping (2-3h)**

#### **1.1 Integrera Puppeteer i geminiService (2h)**

**Fil:** `services/geminiService.ts`

**Lägg till:**
```typescript
import { scrapeWithPuppeteer } from './hybridScraperService';

// I generateLeads-funktionen:
const scrapedData = await scrapeWithPuppeteer(companyWebsite);
const ecommerceData = {
  platform: scrapedData.ecommercePlatform,
  checkout: scrapedData.checkoutProvider,
  carriers: scrapedData.shippingProviders,
  technologies: scrapedData.technologies
};
```

**Resultat:** Bättre e-handelsdata från dynamiska sidor

---

#### **1.2 Lägg till Bolagsverket-scraping (1h)**

**Skapa:** `services/bolagsverketScraper.ts`

```typescript
export async function scrapeBolagsverket(orgNumber: string) {
  const url = `https://www.bolagsverket.se/ff/foretagsformer/aktiebolag/${orgNumber}`;
  
  const result = await scrapeWithFirecrawl(url, {
    formats: ['markdown'],
    onlyMainContent: true
  });
  
  return {
    name: extractCompanyName(result.markdown),
    orgNumber: orgNumber,
    address: extractAddress(result.markdown),
    industry: extractIndustry(result.markdown),
    registrationDate: extractRegistrationDate(result.markdown)
  };
}
```

**Resultat:** Grundläggande företagsinfo från officiell källa

---

#### **1.3 Lägg till Kronofogden-scraping (1h)**

**Skapa:** `services/kronofogdenScraper.ts`

```typescript
export async function scrapeKronofogden(orgNumber: string) {
  const url = `https://kronofogden.se/Sok-foretagsuppgifter.html?orgNr=${orgNumber}`;
  
  const result = await scrapeWithFirecrawl(url, {
    formats: ['markdown'],
    onlyMainContent: true
  });
  
  return {
    hasRemarks: checkForRemarks(result.markdown),
    remarkCount: extractRemarkCount(result.markdown),
    totalAmount: extractTotalAmount(result.markdown),
    lastChecked: new Date().toISOString()
  };
}
```

**Resultat:** Betalningsanmärkningar från officiell källa

---

### **Fas 2: Unified Search Service (3-4h)**

#### **2.1 Skapa UnifiedSearchService (2h)**

**Skapa:** `services/unifiedSearchService.ts`

```typescript
export async function unifiedSearch(query: string) {
  const results = {
    basicInfo: null,
    financialData: null,
    creditCheck: null,
    contacts: null,
    ecommerce: null,
    news: null
  };
  
  // Steg 1: Grundläggande info (Bolagsverket)
  try {
    results.basicInfo = await scrapeBolagsverket(query);
  } catch (error) {
    console.error('Bolagsverket scraping failed:', error);
  }
  
  // Steg 2: Ekonomisk data (Allabolag)
  try {
    results.financialData = await scrapeAllabolag(query);
  } catch (error) {
    console.error('Allabolag scraping failed:', error);
  }
  
  // Steg 3: Kreditcheck (Kronofogden)
  try {
    results.creditCheck = await scrapeKronofogden(query);
  } catch (error) {
    console.error('Kronofogden scraping failed:', error);
  }
  
  // Steg 4: Kontaktpersoner (Gemini AI)
  try {
    results.contacts = await findContactsWithAI(results.basicInfo.name);
  } catch (error) {
    console.error('Contact search failed:', error);
  }
  
  // Steg 5: E-handel (Puppeteer + Firecrawl)
  try {
    const website = results.basicInfo.website;
    if (website) {
      results.ecommerce = await scrapeWithPuppeteer(website);
    }
  } catch (error) {
    console.error('E-commerce scraping failed:', error);
  }
  
  // Steg 6: Nyheter (NewsAPI eller Firecrawl)
  try {
    results.news = await searchNews(results.basicInfo.name);
  } catch (error) {
    console.error('News search failed:', error);
  }
  
  return results;
}
```

**Resultat:** En funktion som hämtar ALL data från alla källor

---

#### **2.2 Integrera i geminiService (1h)**

**Fil:** `services/geminiService.ts`

**Ersätt nuvarande datahämtning med:**
```typescript
import { unifiedSearch } from './unifiedSearchService';

export async function generateLeads(formData: SearchFormData): Promise<LeadData[]> {
  const companies = formData.companies.split('\n').filter(c => c.trim());
  const leads: LeadData[] = [];
  
  for (const company of companies) {
    try {
      // Unified search hämtar ALL data
      const data = await unifiedSearch(company);
      
      // Bygg leadkort från unified data
      const lead = buildLeadCard(data);
      leads.push(lead);
      
    } catch (error) {
      console.error(`Failed to process ${company}:`, error);
    }
  }
  
  return leads;
}
```

**Resultat:** Alla leads får komplett data från alla källor

---

#### **2.3 Felhantering & Fallbacks (1h)**

**Strategi:**
```typescript
// Om Bolagsverket misslyckas → Använd Allabolag
// Om Allabolag misslyckas → Använd Google Search (Firecrawl)
// Om Kronofogden misslyckas → Markera som "Ej kontrollerad"
// Om Gemini misslyckas → Använd Groq
// Om Puppeteer misslyckas → Använd Firecrawl
// Om NewsAPI misslyckas → Använd Firecrawl news search
```

**Implementation:**
```typescript
async function getFinancialData(orgNumber: string) {
  try {
    return await scrapeAllabolag(orgNumber);
  } catch (error) {
    console.warn('Allabolag failed, trying Google Search...');
    try {
      return await searchWithFirecrawl(`${orgNumber} omsättning`);
    } catch (fallbackError) {
      console.error('All financial data sources failed');
      return null;
    }
  }
}
```

**Resultat:** Systemet fungerar även om enskilda källor misslyckas

---

### **Fas 3: API-migration (framtida)**

#### **När API:er blir tillgängliga:**

**Prioritet 1: Bolagsverket API**
- Ersätt scraping med officiellt API
- Snabbare och mer pålitligt
- Mindre risk för blockering

**Prioritet 2: Kronofogden API**
- Ersätt scraping med officiellt API
- Mer aktuell data
- Juridiskt säkrare

**Prioritet 3: UC/Ratsit API**
- Lägg till för kreditbetyg
- Komplettera Allabolag-data
- Betald tjänst

**Prioritet 4: BuiltWith/Wappalyzer API**
- Ersätt Puppeteer för teknologier
- Mer omfattande data
- Betald tjänst

---

## 📋 **DATAKÄLLOR STATUS:**

### **🟢 Fungerar (Scraping eller API):**

| Källa | Metod | Data | Status |
|-------|-------|------|--------|
| Allabolag | Firecrawl | Omsättning, kreditbetyg | ✅ Fungerar |
| Företagswebbplats | Firecrawl | Struktur, innehåll | ✅ Fungerar |
| LinkedIn | Gemini AI | Kontaktpersoner | ✅ Fungerar |
| AI-analys | Gemini/Groq | Opportunity score, pitch | ✅ Fungerar |

### **🟡 Delvis implementerad:**

| Källa | Metod | Data | Status |
|-------|-------|------|--------|
| E-handel | Puppeteer | Plattform, checkout | ⚠️ Finns men ej integrerad |
| Nyheter | NewsAPI | Senaste nyheter | ⚠️ API-nyckel saknas |

### **🔴 Saknas (Behöver implementeras):**

| Källa | Metod | Data | Prioritet |
|-------|-------|------|-----------|
| Bolagsverket | Scraping | Grundläggande info | 🔴 Hög |
| Kronofogden | Scraping | Betalningsanmärkningar | 🔴 Hög |
| UC/Ratsit | API | Kreditbetyg (betald) | 🟡 Medel |
| BuiltWith | API | Teknologier (betald) | 🟢 Låg |
| Wappalyzer | API | Teknologier (betald) | 🟢 Låg |

---

## 🎯 **REKOMMENDERAD IMPLEMENTATION:**

### **Vecka 1: Förbättra scraping (6-7h)**

**Dag 1-2:**
- ✅ Integrera Puppeteer i geminiService (2h)
- ✅ Skapa bolagsverketScraper.ts (1h)
- ✅ Skapa kronofogdenScraper.ts (1h)

**Dag 3:**
- ✅ Skapa unifiedSearchService.ts (2h)
- ✅ Integrera i geminiService.ts (1h)

**Dag 4:**
- ✅ Testa unified search (1h)
- ✅ Felhantering & fallbacks (1h)

**Resultat:** Komplett unified search med scraping

---

### **Vecka 2: Optimering (4-5h)**

**Dag 1:**
- ✅ Parallellisera API-anrop (2h)
- ✅ Lägg till caching (1h)

**Dag 2:**
- ✅ Förbättra felhantering (1h)
- ✅ Lägg till progress indicators (1h)

**Resultat:** Snabbare och mer robust

---

### **Framtid: API-migration (när tillgängligt)**

**När Bolagsverket API finns:**
- Ersätt scraping med API (1h)

**När Kronofogden API finns:**
- Ersätt scraping med API (1h)

**När budget finns för betalda API:er:**
- Lägg till UC/Ratsit (2h)
- Lägg till BuiltWith/Wappalyzer (2h)

---

## 💡 **FÖRDELAR MED UNIFIED SEARCH:**

### **För användare:**
- ✅ En sökning - all data
- ✅ Snabbare (parallella anrop)
- ✅ Mer komplett information
- ✅ Automatisk fallback vid fel

### **För utveckling:**
- ✅ Enklare att underhålla
- ✅ Enklare att lägga till nya källor
- ✅ Enklare att migrera till API:er
- ✅ Bättre felhantering

### **För systemet:**
- ✅ Mindre kod-duplicering
- ✅ Konsekvent dataformat
- ✅ Enklare att testa
- ✅ Bättre prestanda

---

## 🚀 **NÄSTA STEG:**

### **Prioritet 1: Implementera unified search (6-7h)**

1. **Integrera Puppeteer** (2h)
2. **Skapa Bolagsverket-scraper** (1h)
3. **Skapa Kronofogden-scraper** (1h)
4. **Skapa UnifiedSearchService** (2h)
5. **Integrera i geminiService** (1h)

### **Prioritet 2: Testa & optimera (2-3h)**

1. **Testa med riktiga företag** (1h)
2. **Förbättra felhantering** (1h)
3. **Lägg till progress indicators** (1h)

### **Prioritet 3: Dokumentera (1h)**

1. **Uppdatera README.md** (30 min)
2. **Skapa API-dokumentation** (30 min)

---

## 📊 **SAMMANFATTNING:**

### **Nuläge:**
- ✅ Firecrawl fungerar (Allabolag, webbplatser)
- ✅ Gemini AI fungerar (kontaktpersoner, analys)
- ⚠️ Puppeteer finns men ej integrerad
- ❌ Bolagsverket-scraping saknas
- ❌ Kronofogden-scraping saknas

### **Mål:**
- ✅ En unified search som hämtar ALL data
- ✅ Scraping tills API:er finns
- ✅ Automatisk fallback vid fel
- ✅ Enkel att migrera till API:er

### **Tid:**
- **Fas 1:** 6-7h (Implementera unified search)
- **Fas 2:** 2-3h (Testa & optimera)
- **Fas 3:** Framtida (API-migration när tillgängligt)

**Total:** ~9-10h för komplett unified search med scraping

---

**Version:** 5.0  
**Status:** Strategi klar, redo för implementation  
**Nästa:** Implementera Fas 1 (6-7h)

