# 🛠️ Implementeringsguide: Multi-LLM & API-integration

## Snabbstart: Lägg till Groq (GRATIS fallback)

### Steg 1: Installera Groq SDK

```bash
npm install groq-sdk
```

### Steg 2: Lägg till Groq API-nyckel i .env.local

```env
GEMINI_API_KEY=din_gemini_nyckel
GROQ_API_KEY=din_groq_nyckel  # Hämta från https://console.groq.com/
```

### Steg 3: Skapa Groq Service

Skapa ny fil: `services/groqService.ts`

```typescript
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Använder Groq (Llama 3.1 70B) för snabb analys
 * GRATIS upp till 14,400 requests/dag
 */
export async function analyzeWithGroq(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.2
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: "llama-3.1-70b-versatile", // Snabbaste modellen
      temperature: temperature,
      max_tokens: 8000,
      response_format: { type: "json_object" } // Tvingar JSON-output
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("Groq API Error:", error);
    throw new Error(`Groq failed: ${error.message}`);
  }
}

/**
 * Batch-analys med Groq (extremt snabb)
 */
export async function batchAnalyzeWithGroq(
  items: Array<{ system: string; user: string }>,
  temperature: number = 0.2
): Promise<string[]> {
  const promises = items.map(item => 
    analyzeWithGroq(item.system, item.user, temperature)
  );
  
  return await Promise.all(promises);
}
```

### Steg 4: Uppdatera geminiService.ts med Fallback

Lägg till i `services/geminiService.ts`:

```typescript
import { analyzeWithGroq } from './groqService';

// Lägg till i generateWithRetry-funktionen (efter rad 659):

if (isQuota) {
  // --- GROQ FALLBACK (NY KOD) ---
  if (currentConfig.tools && currentConfig.tools.length > 0) {
    console.warn("Grounding Quota hit. Trying Groq fallback...");
    
    try {
      // Groq har ingen web search, så vi använder den för ren LLM-analys
      const groqResponse = await analyzeWithGroq(
        currentConfig.systemInstruction || "",
        prompt,
        currentConfig.temperature || 0.2
      );
      
      // Returnera i samma format som Gemini
      return {
        text: groqResponse,
        candidates: []
      };
    } catch (groqError) {
      console.warn("Groq fallback failed:", groqError);
      // Fortsätt till nästa fallback...
    }
  }
  
  // ... resten av din befintliga kod
}
```

---

## Lägg till Bolagsverket API (GRATIS)

### Steg 1: Skapa Bolagsverket Service

Skapa ny fil: `services/bolagsverketService.ts`

```typescript
/**
 * Bolagsverket Öppna Data API
 * GRATIS och officiell källa för företagsdata
 */

export interface BolagsverketCompany {
  organisationsnummer: string;
  namn: string;
  juridiskForm: string;
  registreringsdatum: string;
  avregistreringsdatum?: string;
  status: "Aktiv" | "Avregistrerad" | "Konkurs" | "Likvidation";
  adress: {
    utdelningsadress: string;
    postnummer: string;
    postort: string;
  };
}

/**
 * Hämtar företagsdata från Bolagsverket
 */
export async function getCompanyFromBolagsverket(
  orgNr: string
): Promise<BolagsverketCompany | null> {
  try {
    // Rensa org.nr till format XXXXXX-XXXX
    let cleanOrg = orgNr.replace(/[^0-9]/g, '');
    
    // Ta bort 16-prefix om det finns
    if (cleanOrg.length === 12 && cleanOrg.startsWith('16')) {
      cleanOrg = cleanOrg.substring(2);
    }
    
    if (cleanOrg.length !== 10) {
      console.warn("Invalid org.nr format:", orgNr);
      return null;
    }
    
    const formattedOrg = `${cleanOrg.substring(0, 6)}-${cleanOrg.substring(6)}`;
    
    // Bolagsverket API endpoint
    const url = `https://data.bolagsverket.se/api/bolag/${formattedOrg}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log("Company not found in Bolagsverket:", formattedOrg);
        return null;
      }
      throw new Error(`Bolagsverket API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Mappa till vårt format
    return {
      organisationsnummer: formattedOrg,
      namn: data.namn || "",
      juridiskForm: data.juridiskForm || "",
      registreringsdatum: data.registreringsdatum || "",
      avregistreringsdatum: data.avregistreringsdatum,
      status: mapStatus(data),
      adress: {
        utdelningsadress: data.adress?.utdelningsadress || "",
        postnummer: data.adress?.postnummer || "",
        postort: data.adress?.postort || ""
      }
    };
    
  } catch (error: any) {
    console.error("Bolagsverket API Error:", error);
    return null;
  }
}

/**
 * Mappar Bolagsverkets status till vårt format
 */
function mapStatus(data: any): "Aktiv" | "Avregistrerad" | "Konkurs" | "Likvidation" {
  if (data.avregistreringsdatum) return "Avregistrerad";
  if (data.konkurs) return "Konkurs";
  if (data.likvidation) return "Likvidation";
  return "Aktiv";
}

/**
 * Söker företag baserat på namn (fuzzy search)
 */
export async function searchCompaniesByName(
  companyName: string,
  limit: number = 10
): Promise<BolagsverketCompany[]> {
  try {
    const url = `https://data.bolagsverket.se/api/sok?namn=${encodeURIComponent(companyName)}&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return data.resultat?.map((item: any) => ({
      organisationsnummer: item.organisationsnummer,
      namn: item.namn,
      juridiskForm: item.juridiskForm,
      registreringsdatum: item.registreringsdatum,
      status: mapStatus(item),
      adress: {
        utdelningsadress: item.adress?.utdelningsadress || "",
        postnummer: item.adress?.postnummer || "",
        postort: item.adress?.postort || ""
      }
    })) || [];
    
  } catch (error) {
    console.error("Bolagsverket search error:", error);
    return [];
  }
}
```

### Steg 2: Integrera i Deep Dive

Uppdatera `generateDeepDiveSequential` i `geminiService.ts`:

```typescript
export const generateDeepDiveSequential = async (
  formData: SearchFormData, 
  onPartialUpdate: (lead: LeadData) => void
): Promise<LeadData> => {
  // ... befintlig kod ...

  // EFTER STEP 1 (rad ~820), lägg till:
  
  // --- BOLAGSVERKET VERIFICATION ---
  if (currentData.orgNumber) {
    console.log("Verifying with Bolagsverket...");
    const bvData = await getCompanyFromBolagsverket(currentData.orgNumber);
    
    if (bvData) {
      // Uppdatera med VERIFIERAD data från Bolagsverket
      currentData = {
        ...currentData,
        companyName: bvData.namn, // Officiellt namn
        orgNumber: bvData.organisationsnummer,
        address: `${bvData.adress.utdelningsadress}, ${bvData.adress.postnummer} ${bvData.adress.postort}`,
        legalStatus: bvData.status,
        // Lägg till badge för verifierad data
        source: 'ai' // Kan lägga till 'verified' flag
      };
      
      console.log("✅ Verified with Bolagsverket:", bvData.namn);
    } else {
      console.warn("⚠️ Could not verify with Bolagsverket");
    }
  }
  
  // ... fortsätt med Step 2 & 3 ...
};
```

---

## Lägg till OpenAI GPT-4o (BETALD, men bättre kvalitet)

### Steg 1: Installera OpenAI SDK

```bash
npm install openai
```

### Steg 2: Lägg till i .env.local

```env
OPENAI_API_KEY=din_openai_nyckel
```

### Steg 3: Skapa OpenAI Service

Skapa ny fil: `services/openaiService.ts`

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Använder GPT-4o-mini för kostnadseffektiv analys
 * Kostnad: $0.15/1M input tokens, $0.60/1M output tokens
 */
export async function analyzeWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.2,
  model: string = "gpt-4o-mini"
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: temperature,
      response_format: { type: "json_object" }
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(`OpenAI failed: ${error.message}`);
  }
}

/**
 * Använder GPT-4o med web search via Tavily
 */
export async function analyzeWithOpenAIAndSearch(
  systemPrompt: string,
  userPrompt: string,
  searchQuery: string,
  temperature: number = 0.2
): Promise<string> {
  // Först: Sök med Tavily
  const searchResults = await searchWithTavily(searchQuery);
  
  // Sedan: Analysera med GPT-4o
  const enrichedPrompt = `
${userPrompt}

SÖKRESULTAT:
${searchResults}
`;

  return await analyzeWithOpenAI(systemPrompt, enrichedPrompt, temperature, "gpt-4o-mini");
}

/**
 * Tavily Search API (optimerad för LLM)
 */
async function searchWithTavily(query: string): Promise<string> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  
  if (!TAVILY_API_KEY) {
    console.warn("Tavily API key missing, skipping search");
    return "";
  }
  
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5
      })
    });
    
    const data = await response.json();
    
    // Formatera resultat för LLM
    return data.results?.map((r: any) => 
      `Källa: ${r.title}\nURL: ${r.url}\nInnehåll: ${r.content}\n---`
    ).join("\n") || "";
    
  } catch (error) {
    console.error("Tavily search error:", error);
    return "";
  }
}
```

---

## Multi-LLM Orchestrator (Smart routing)

Skapa ny fil: `services/llmOrchestrator.ts`

```typescript
import { analyzeWithGroq } from './groqService';
import { analyzeWithOpenAI } from './openaiService';
import { generateWithRetry } from './geminiService';

export type LLMProvider = 'gemini' | 'groq' | 'openai';

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  requiresWebSearch?: boolean;
  priority?: 'speed' | 'quality' | 'cost';
}

export interface LLMResponse {
  text: string;
  provider: LLMProvider;
  cost?: number; // Uppskattad kostnad i USD
  duration?: number; // Millisekunder
}

/**
 * Smart LLM Router - väljer bästa modell baserat på uppgift
 */
export async function analyzeSmart(request: LLMRequest): Promise<LLMResponse> {
  const startTime = Date.now();
  
  // Välj provider baserat på krav
  const provider = selectProvider(request);
  
  try {
    let text: string;
    
    switch (provider) {
      case 'groq':
        text = await analyzeWithGroq(
          request.systemPrompt,
          request.userPrompt,
          request.temperature || 0.2
        );
        break;
        
      case 'openai':
        text = await analyzeWithOpenAI(
          request.systemPrompt,
          request.userPrompt,
          request.temperature || 0.2
        );
        break;
        
      case 'gemini':
      default:
        // Använd befintlig Gemini-logik
        const response = await generateWithRetry(
          // ... din befintliga Gemini-kod
        );
        text = response.text || "";
        break;
    }
    
    const duration = Date.now() - startTime;
    
    return {
      text,
      provider,
      duration,
      cost: estimateCost(provider, text)
    };
    
  } catch (error: any) {
    console.error(`${provider} failed, trying fallback...`);
    
    // Fallback-kedja
    if (provider === 'gemini') {
      return await analyzeSmart({ ...request, priority: 'cost' }); // Försök Groq
    } else if (provider === 'groq') {
      return await analyzeSmart({ ...request, priority: 'quality' }); // Försök OpenAI
    }
    
    throw error;
  }
}

/**
 * Väljer bästa provider baserat på krav
 */
function selectProvider(request: LLMRequest): LLMProvider {
  // Om web search krävs -> Gemini (har grounding)
  if (request.requiresWebSearch) {
    return 'gemini';
  }
  
  // Om hastighet prioriteras -> Groq
  if (request.priority === 'speed') {
    return 'groq';
  }
  
  // Om kvalitet prioriteras -> OpenAI
  if (request.priority === 'quality') {
    return 'openai';
  }
  
  // Om kostnad prioriteras -> Groq (gratis)
  if (request.priority === 'cost') {
    return 'groq';
  }
  
  // Default: Gemini (balanserad)
  return 'gemini';
}

/**
 * Uppskattar kostnad baserat på tokens
 */
function estimateCost(provider: LLMProvider, text: string): number {
  const tokens = Math.ceil(text.length / 4); // Rough estimate
  
  switch (provider) {
    case 'groq':
      return 0; // Gratis
    case 'openai':
      return (tokens / 1_000_000) * 0.60; // GPT-4o-mini output
    case 'gemini':
      return (tokens / 1_000_000) * 0.30; // Gemini Flash output
    default:
      return 0;
  }
}
```

---

## Användningsexempel

### Exempel 1: Snabb batch-analys med Groq

```typescript
// I App.tsx eller där ni gör batch-sökning:

import { analyzeWithGroq } from './services/groqService';

async function quickBatchAnalysis(companies: string[]) {
  const results = await Promise.all(
    companies.map(async (company) => {
      const prompt = `Analysera företaget: ${company}. Returnera JSON med segment (TS/FS/KAM).`;
      return await analyzeWithGroq(
        "Du är en B2B-analytiker. Returnera endast JSON.",
        prompt
      );
    })
  );
  
  return results.map(r => JSON.parse(r));
}
```

### Exempel 2: Kvalitetsanalys med OpenAI

```typescript
import { analyzeWithOpenAI } from './services/openaiService';

async function deepQualityAnalysis(lead: LeadData) {
  const prompt = `
Analysera detta företag och skapa en personlig icebreaker:

Företag: ${lead.companyName}
Bransch: ${lead.segment}
Nyheter: ${lead.latestNews}

Returnera JSON med fält: icebreaker_text, risk_assessment, opportunity_score
`;

  const result = await analyzeWithOpenAI(
    "Du är en senior säljanalytiker.",
    prompt,
    0.7 // Högre temperature för kreativitet
  );
  
  return JSON.parse(result);
}
```

### Exempel 3: Smart routing med orchestrator

```typescript
import { analyzeSmart } from './services/llmOrchestrator';

async function analyzeCompany(companyName: string, needsWebSearch: boolean) {
  const response = await analyzeSmart({
    systemPrompt: "Du är en företagsanalytiker.",
    userPrompt: `Analysera: ${companyName}`,
    requiresWebSearch: needsWebSearch,
    priority: needsWebSearch ? 'quality' : 'speed'
  });
  
  console.log(`Analyzed with ${response.provider} in ${response.duration}ms`);
  console.log(`Estimated cost: $${response.cost}`);
  
  return JSON.parse(response.text);
}
```

---

## Kostnadsoptimering

### Strategi 1: Använd rätt modell för rätt uppgift

```typescript
const taskRouting = {
  // GRATIS - Groq
  'segment_classification': 'groq',
  'json_parsing': 'groq',
  'simple_analysis': 'groq',
  
  // BILLIGT - Gemini Flash
  'web_search': 'gemini',
  'data_extraction': 'gemini',
  
  // KVALITET - GPT-4o-mini
  'icebreaker_generation': 'openai',
  'sentiment_analysis': 'openai',
  'risk_assessment': 'openai'
};
```

### Strategi 2: Caching (ni har redan!)

Er befintliga cache-strategi är utmärkt. Fortsätt med det!

### Strategi 3: Batch-processing

```typescript
// Använd Groq för batch (500+ tokens/sekund!)
async function batchProcess(items: string[]) {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => analyzeWithGroq("System", item))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

---

## Testning

### Test 1: Jämför LLM-kvalitet

```typescript
async function compareLLMs(companyName: string) {
  const prompt = `Analysera företaget ${companyName} och returnera JSON med segment.`;
  
  const [geminiResult, groqResult, openaiResult] = await Promise.all([
    analyzeWithGemini(prompt),
    analyzeWithGroq("System", prompt),
    analyzeWithOpenAI("System", prompt)
  ]);
  
  console.log("Gemini:", geminiResult);
  console.log("Groq:", groqResult);
  console.log("OpenAI:", openaiResult);
}
```

### Test 2: Benchmark hastighet

```typescript
async function benchmarkSpeed() {
  const testPrompt = "Analysera företaget IKEA. Returnera JSON.";
  
  console.time("Gemini");
  await analyzeWithGemini(testPrompt);
  console.timeEnd("Gemini");
  
  console.time("Groq");
  await analyzeWithGroq("System", testPrompt);
  console.timeEnd("Groq"); // Förväntat: 10-50ms (extremt snabb!)
  
  console.time("OpenAI");
  await analyzeWithOpenAI("System", testPrompt);
  console.timeEnd("OpenAI");
}
```

---

## Nästa Steg

1. ✅ Implementera Groq-fallback (2 timmar)
2. ✅ Lägg till Bolagsverket API (1 dag)
3. ✅ Testa multi-LLM orchestrator (1 dag)
4. ✅ Utvärdera UC/Allabolag API (kontakta för demo)
5. ✅ Optimera kostnader baserat på användning

**Vill du att jag implementerar någon av dessa lösningar direkt i er kod?** 🚀
