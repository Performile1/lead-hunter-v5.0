# 🎯 Prompt-optimering med nya API:er

**Datum:** 2025-12-17  
**Syfte:** Analysera och optimera prompts för nya API-uppsättningen  
**Status:** Analys komplett

---

## 📊 **NYA API:ER SOM NU ÄR TILLGÄNGLIGA:**

### **AI-modeller:**
1. ✅ **Gemini** (Google) - Primär AI
2. ✅ **Groq** (Llama 3.3 70B) - Fallback/Snabb
3. ✅ **DeepSeek** - Backup AI

### **Data & Scraping:**
4. ✅ **Firecrawl** - Web scraping
5. ✅ **NewsAPI** - Nyheter

### **Sök & Index:**
6. ✅ **Algolia** - Sökfunktionalitet

---

## 🔍 **PROMPT-ANALYS:**

### **1. Deep Analysis Prompts (deepAnalysis.ts)**

#### **STEG 1: CORE DATA**
**Nuvarande fokus:**
- Org.nr (KRITISKT)
- Ekonomi (Allabolag/Ratsit)
- Kreditvärdighet
- Juridisk status

**✅ FUNGERAR BRA MED:**
- Gemini (noggrann org.nr-sökning)
- Firecrawl (Allabolag-scraping)

**🔧 OPTIMERINGAR:**

**A. Lägg till Firecrawl-instruktioner:**
```typescript
**DATAKÄLLOR (PRIORITET):**
1. Använd Firecrawl API för Allabolag-scraping
2. Sök direkt på: https://www.allabolag.se/[org-nr]
3. Fallback: Google-sökning om Firecrawl misslyckas
```

**B. Förbättra org.nr-sökning:**
```typescript
**ORG.NR SÖKSTRATEGI (UPPDATERAD):**
1. Firecrawl: Scrapa Allabolag direkt
2. Google: "[Företagsnamn] allabolag organisationsnummer"
3. Ratsit: "[Företagsnamn] ratsit"
4. Bolagsverket: "[Företagsnamn] bolagsverket"
```

---

#### **STEG 2: LOGISTICS**
**Nuvarande fokus:**
- E-handelsplattform
- Transportörer
- Fysiska butiker
- Kassalikviditet

**✅ FUNGERAR BRA MED:**
- Gemini (teknisk analys)
- Firecrawl (webbplats-scraping)

**🔧 OPTIMERINGAR:**

**A. Lägg till Firecrawl för webbplats-analys:**
```typescript
**WEBBPLATS-ANALYS (UPPDATERAD):**
1. Använd Firecrawl för att scrapa företagets webbplats
2. Leta efter /leverans, /frakt, /kopvillkor sidor
3. Extrahera transportör-information från footer/villkor
4. Identifiera e-handelsplattform från källkod
```

**B. Förbättra transportör-detektion:**
```typescript
**TRANSPORTÖR-SÖKNING (FÖRBÄTTRAD):**
1. Firecrawl: Scrapa /leverans och /frakt sidor
2. Sök efter nyckelord: "DHL", "Postnord", "Budbee", "Instabox"
3. Kontrollera footer för logotyper
4. Sök i köpvillkor för leveranspartners
```

---

#### **STEG 3: PEOPLE**
**Nuvarande fokus:**
- Beslutsfattare (LinkedIn)
- Nyheter
- Kundomdömen

**✅ FUNGERAR BRA MED:**
- Gemini (LinkedIn-sökning)
- NewsAPI (nyheter)

**🔧 OPTIMERINGAR:**

**A. Integrera NewsAPI:**
```typescript
**NYHETER (UPPDATERAD MED NEWSAPI):**
1. Använd NewsAPI för att söka företagsnyheter
2. Sök på: "[Företagsnamn] + expansion OR tillväxt OR investering"
3. Filtrera på svenska källor: Breakit, DI, Ehandel.se
4. Fallback: Google News-sökning
5. Returnera senaste 3 nyheterna med URL
```

**B. Förbättra LinkedIn-sökning:**
```typescript
**LINKEDIN-SÖKNING (FÖRBÄTTRAD):**
1. Sök på: "[Företagsnamn] [Titel] site:linkedin.com/in/"
2. Prioritet: Logistikchef > VD > E-handelschef
3. Verifiera att personen arbetar på rätt företag
4. Returnera ENDAST exakta URLs
```

---

### **2. Quick Scan Prompts (quickScan.ts)**

#### **BATCH QUICK SCAN**
**Nuvarande fokus:**
- Snabb identifiering
- Minst 1 kontaktperson
- Ekonomi från Allabolag

**✅ FUNGERAR BRA MED:**
- Groq (snabb analys)
- Firecrawl (snabb scraping)

**🔧 OPTIMERINGAR:**

**A. Använd Groq för hastighet:**
```typescript
**MODELL-VAL:**
- Använd Groq (Llama 3.3 70B) för Quick Scan
- Snabbare än Gemini
- Tillräckligt noggrann för grunddata
```

**B. Optimera Firecrawl-användning:**
```typescript
**SNABB SCRAPING:**
1. Firecrawl: Scrapa endast Allabolag-sidan
2. Extrahera: Org.nr, Omsättning, Status
3. Skippa djupare analys
4. Max 10 sekunder per företag
```

---

#### **BATCH DEEP ANALYSIS**
**Nuvarande fokus:**
- Djup analys på flera företag
- Kvalitet över hastighet

**✅ FUNGERAR BRA MED:**
- Gemini (noggrann analys)
- Firecrawl (komplett scraping)
- NewsAPI (nyheter)

**🔧 OPTIMERINGAR:**

**A. Parallellisera API-anrop:**
```typescript
**PARALLELL PROCESSING:**
1. Kör Firecrawl + NewsAPI samtidigt
2. Gemini-analys efter data hämtats
3. Spara 50% tid per företag
```

---

### **3. Batch Prospecting (batchProspecting.ts)**

#### **BATCH PROSPECTING**
**Nuvarande fokus:**
- Hitta aktiva företag
- Geografisk filtrering
- Branschfiltrering

**✅ FUNGERAR BRA MED:**
- Gemini (intelligent filtrering)
- Firecrawl (masscraping)

**🔧 OPTIMERINGAR:**

**A. Förbättra geografisk sökning:**
```typescript
**GEOGRAFISK SÖKNING (UPPDATERAD):**
1. Firecrawl: Scrapa Allabolag per ort
2. Sök på: "https://www.allabolag.se/[ort]/[bransch]"
3. Filtrera på aktiva bolag
4. Exkludera konkurs/likvidation
```

**B. Lägg till Algolia för snabb sökning:**
```typescript
**ALGOLIA INTEGRATION (NY):**
1. Indexera alla hittade företag i Algolia
2. Snabb sökning på ort + bransch
3. Filtrera på segment (TS/FS/KAM)
4. Undvik dubbletter
```

---

## 🚀 **REKOMMENDERADE ÄNDRINGAR:**

### **Prioritet 1: Integrera Firecrawl i alla prompts (2h)**

**Lägg till i varje prompt:**
```typescript
**DATAKÄLLOR (PRIORITET):**
1. Firecrawl API - Primär scraping-källa
2. Google Search - Fallback
3. Direkta API:er - När tillgängliga
```

---

### **Prioritet 2: Lägg till NewsAPI i STEG 3 (1h)**

**Uppdatera DEEP_STEP_3_PEOPLE:**
```typescript
**NYHETER (MED NEWSAPI):**
1. Använd NewsAPI för företagsnyheter
2. Sök på: "[Företagsnamn]"
3. Filtrera: Senaste 30 dagarna
4. Källor: Svenska affärsmedier
5. Returnera: Rubrik, URL, Datum
```

---

### **Prioritet 3: Optimera modell-val per prompt (30 min)**

**Modell-strategi:**
```typescript
// Quick Scan → Groq (snabb)
const model = 'groq';

// Deep Analysis → Gemini (noggrann)
const model = 'gemini';

// Batch Prospecting → Gemini (intelligent filtrering)
const model = 'gemini';

// Fallback → DeepSeek
const fallbackModel = 'deepseek';
```

---

### **Prioritet 4: Lägg till Algolia för caching (2h)**

**Implementera:**
```typescript
// Indexera alla leads i Algolia
await algolia.saveObjects(leads);

// Snabb sökning
const results = await algolia.search(query, {
  filters: 'ort:Stockholm AND segment:KAM'
});
```

---

## 📋 **UPPDATERADE PROMPTS:**

### **DEEP_STEP_1_CORE (Uppdaterad):**

**Lägg till efter rad 15:**
```typescript
**DATAKÄLLOR & METOD:**
1. **Firecrawl API (PRIMÄR):**
   - Scrapa Allabolag direkt: https://www.allabolag.se/[org-nr]
   - Extrahera: Org.nr, Omsättning, Status, Kreditbetyg
   - Timeout: 10 sekunder
2. **Google Search (FALLBACK):**
   - Använd endast om Firecrawl misslyckas
   - Sök på: "[Företagsnamn] allabolag organisationsnummer"
3. **Verifiering:**
   - Kontrollera att org.nr matchar företagsnamnet
   - Dubbelkolla juridisk status
```

---

### **DEEP_STEP_2_LOGISTICS (Uppdaterad):**

**Lägg till efter rad 83:**
```typescript
**WEBBPLATS-SCRAPING (FIRECRAWL):**
1. Scrapa företagets webbplats med Firecrawl
2. Prioriterade sidor:
   - /leverans
   - /frakt
   - /kopvillkor
   - /om-oss
3. Extrahera:
   - Transportörer (DHL, Postnord, etc.)
   - E-handelsplattform (Shopify, WooCommerce, etc.)
   - Checkout-lösning (Klarna, Svea, etc.)
4. Timeout: 15 sekunder per webbplats
```

---

### **DEEP_STEP_3_PEOPLE (Uppdaterad):**

**Lägg till efter rad 147:**
```typescript
**NYHETER (NEWSAPI):**
1. Använd NewsAPI för företagsnyheter
2. Query: "[Företagsnamn]"
3. Parametrar:
   - language: sv
   - sortBy: publishedAt
   - from: [30 dagar sedan]
4. Källor (prioritet):
   - breakit.se
   - ehandel.se
   - di.se
   - affarsvarlden.se
5. Returnera:
   - Rubrik
   - URL
   - Datum
   - Källa
6. Max 3 nyheter
7. Fallback: Google News om NewsAPI misslyckas
```

---

## 🎯 **SAMMANFATTNING:**

### **Vad som fungerar bra:**
- ✅ Grundläggande prompt-struktur
- ✅ JSON-format
- ✅ Steg-för-steg analys

### **Vad som kan förbättras:**
- 🔧 Integrera Firecrawl explicit i prompts
- 🔧 Lägg till NewsAPI för nyheter
- 🔧 Optimera modell-val (Groq vs Gemini)
- 🔧 Lägg till Algolia för caching

### **Estimerad förbättring:**
- ⚡ **Hastighet:** +40% (Groq för Quick Scan)
- 🎯 **Noggrannhet:** +25% (Firecrawl för scraping)
- 📰 **Nyheter:** +100% (NewsAPI integration)
- 🔍 **Sök:** +60% (Algolia caching)

---

## 🚀 **NÄSTA STEG:**

### **Implementera förbättringar (5-6h):**

1. **Uppdatera deepAnalysis.ts** (2h)
   - Lägg till Firecrawl-instruktioner
   - Integrera NewsAPI
   - Optimera org.nr-sökning

2. **Uppdatera quickScan.ts** (1h)
   - Lägg till Groq-optimering
   - Förbättra Firecrawl-användning

3. **Uppdatera batchProspecting.ts** (1h)
   - Lägg till Algolia-integration
   - Förbättra geografisk sökning

4. **Testa med riktiga API:er** (1h)
   - Kör Quick Scan på 10 företag
   - Kör Deep Analysis på 3 företag
   - Verifiera resultat

5. **Optimera baserat på resultat** (1h)
   - Justera timeouts
   - Förbättra felhantering
   - Finjustera prompts

---

**Total tid:** ~5-6h för komplett optimering  
**Förväntat resultat:** 40-60% förbättring i hastighet och noggrannhet

