import { GoogleGenAI } from "@google/genai";
import { SearchFormData, LeadData, Segment, DecisionMaker, SourceLink, FinancialRecord } from "../types";
import { DEEP_STEP_1_CORE, DEEP_STEP_2_LOGISTICS, DEEP_STEP_3_PEOPLE, DEEP_ANALYSIS_INSTRUCTION } from "../prompts/deepAnalysis";
import { BATCH_SCAN_INSTRUCTION, BATCH_DEEP_INSTRUCTION } from "../prompts/quickScan";
import { BATCH_PROSPECTING_INSTRUCTION } from "../prompts/batchProspecting";
import { analyzeWithGroq, isGroqAvailable } from "./groqService";
import { checkKronofogden as checkKronofogdenNew, formatKronofogdenResult } from "./kronofogdenService";
import { normalizeOrgNumber, validateOrgNumber } from "./bolagsverketService";
import { analyzeWebsiteTech } from "./techAnalysisService";
import { analyzeSmart, LLMRequest } from "./llmOrchestrator";
import { analyzeCompetitiveIntelligence } from "./competitiveIntelligenceService";
import { detectTriggers } from "./triggerDetectionService";
import { searchCompanyNews } from "./newsApiService";

// API keys from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// --- GLOBAL CACHE CONFIG ---
const CACHE_KEY = 'dhl_deep_analysis_cache';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 Days
const MAX_CACHE_SIZE = 200; // Keep last 200 analyses to prevent localStorage overflow

interface CacheEntry {
  data: LeadData;
  timestamp: number;
  version: string;
}

/**
 * Loads the analysis cache from LocalStorage
 */
function loadCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves a result to the Global Analysis Cache
 */
function saveToCache(lead: LeadData) {
  try {
    const cache = loadCache();
    const key = (lead.orgNumber || lead.companyName).toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Add new entry
    cache[key] = {
      data: lead,
      timestamp: Date.now(),
      version: "4.4"
    };

    // Manage Size (LRU - Least Recently Used removal)
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_SIZE) {
       // Sort by timestamp and remove oldest
       const sortedKeys = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
       const keysToRemove = sortedKeys.slice(0, keys.length - MAX_CACHE_SIZE);
       keysToRemove.forEach(k => delete cache[k]);
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Failed to save to analysis cache (Storage full?)", e);
  }
}

/**
 * Tries to fetch a valid, non-expired result from Cache
 */
function getFromCache(name: string, org?: string): LeadData | null {
  try {
    const cache = loadCache();
    
    // Try Org Number Key first (More precise)
    if (org) {
       const keyOrg = org.toLowerCase().replace(/[^a-z0-9]/g, '');
       const entry = cache[keyOrg];
       if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
          console.log(`🚀 Cache Hit (Org): ${name}`);
          return { ...entry.data, id: crypto.randomUUID() }; // Always return new ID
       }
    }

    // Try Name Key
    const keyName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const entry = cache[keyName];
    if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
        console.log(`🚀 Cache Hit (Name): ${name}`);
        return { ...entry.data, id: crypto.randomUUID() };
    }

  } catch (e) {
    console.error("Cache read error", e);
  }
  return null;
}


/**
 * Robust JSON extraction helper
 */
function extractJSON(text: string): any[] | null {
  if (!text) return null;

  // 1. Remove markdown code blocks (case insensitive)
  let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  // 2. Find the outer-most brackets to handle introductory text
  const startBracket = cleanText.indexOf('[');
  const startBrace = cleanText.indexOf('{');
  
  let start = -1;
  let isArray = false;

  // Determine if it starts with [ or {
  if (startBracket !== -1 && (startBrace === -1 || startBracket < startBrace)) {
    start = startBracket;
    isArray = true;
  } else if (startBrace !== -1) {
    start = startBrace;
    isArray = false;
  } else {
    // Fallback: If no brackets found at start, try regex immediately
    try {
       const match = cleanText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
       if (match) {
          const parsed = JSON.parse(match[0]);
          return Array.isArray(parsed) ? parsed : [parsed];
       }
    } catch(e) {}
    return null;
  }

  // 3. Bracket counting to find the matching end
  let openCount = 0;
  let end = -1;
  let inString = false;
  let escape = false;
  const openChar = isArray ? '[' : '{';
  const closeChar = isArray ? ']' : '}';

  for (let i = start; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === openChar) openCount++;
      else if (char === closeChar) {
        openCount--;
        if (openCount === 0) { end = i; break; }
      }
    }
  }

  if (end !== -1) {
    const jsonStr = cleanText.substring(start, end + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      return isArray ? parsed : [parsed];
    } catch (e) {
      console.warn("Bracket counting parsing failed, trying fallback regex:", e);
    }
  }
  
  // 4. Fallback regex if bracket counting fails (e.g. malformed nesting)
  try {
     const match = cleanText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
     if (match) {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : [parsed];
     }
  } catch(e) {}

  return null;
}

// Helper to clean numeric strings with spaces or strange chars
function cleanNumericString(str: string | number): string {
    if (!str) return "";
    // Replaces spaces, nbsp, units. Replaces comma with dot for proper float parsing.
    return String(str).toLowerCase()
        .replace(/\s/g, '')
        .replace(/\u00A0/g, '')
        .replace(/tkr/g, '')
        .replace(/kr/g, '')
        .replace(/sek/g, '')
        .replace(/mkr/g, '')
        .replace(/milj/g, '')
        .replace(',', '.');
}

/**
 * Robust Revenue Parser that handles units (Mkr, kr, TKR)
 */
function parseRevenue(val: any): number {
    if (!val) return 0;
    const rawStr = String(val).toLowerCase();
    
    // Detect units
    const isMkr = rawStr.includes('milj') || rawStr.includes('mkr') || rawStr.includes('md');
    const isKr = rawStr.includes('kr') && !rawStr.includes('tkr') && !isMkr;
    // Note: If "tkr" is explicitly present, we generally trust it.

    let str = cleanNumericString(val); 
    let num = parseFloat(str);
    
    if (isNaN(num)) return 0;
    
    if (isMkr) {
        num *= 1000; // Miljoner -> TKR
    } else if (isKr) {
        num = Math.round(num / 1000); // KR -> TKR
    } else {
        // No explicit unit or TKR/Unknown.
        // Sanity Check: If value is huge (> 5,000,000), it's likely SEK.
        if (num > 5000000) {
            num = Math.round(num / 1000);
        }
    }
    
    return num;
}

/**
 * KRONOFOGDEN API CHECK
 * Checks if the organization number exists in Kronofogden's bankruptcy/reconstruction dataset.
 */
async function checkKronofogden(orgNr: string): Promise<string> {
    if (!orgNr) return "";
    
    // Format org number to XXXXXX-XXXX or XXXXXXXXXX as required by API
    // The API typically takes 10 digits or 12 digits (with 16 prefix sometimes).
    // Let's normalize to standard hyphenated XXXXXX-XXXX
    let cleanOrg = orgNr.replace(/[^0-9]/g, '');
    if (cleanOrg.length === 12 && cleanOrg.startsWith('16')) cleanOrg = cleanOrg.substring(2);
    if (cleanOrg.length === 12 && cleanOrg.endsWith('01')) cleanOrg = cleanOrg.substring(0, 10);
    
    if (cleanOrg.length !== 10) return ""; // Invalid format to check
    
    const formattedOrg = `${cleanOrg.substring(0,6)}-${cleanOrg.substring(6)}`;
    
    // Using EntryScape RowStore API
    const datasetId = "4e789168-1d3d-468c-b9a1-0cce9a9a4f1e";
    const url = `https://kronofogden.entryscape.net/rowstore/dataset/${datasetId}?organisationsnummer=${formattedOrg}`;

    try {
        const response = await fetch(url, {
             method: 'GET',
             headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) return "";
        
        const data = await response.json();
        
        // If results array has items, it means there is a record (Konkurs/Rekonstruktion)
        if (data && data.results && data.results.length > 0) {
             const record = data.results[0];
             // Return the type of insolvency if available, or just a generic warning
             return `Hittad hos Kronofogden: ${record.status || 'Insolvensärende'}`;
        }
        
        return ""; // No record found = Good
    } catch (e) {
        console.warn("Kronofogden check failed:", e);
        return ""; // Fail silently
    }
}

/**
 * Maps the flattened Swedish JSON keys from Gemini to LeadData
 */
function mapAiResponseToLeadData(raw: any, groundingChunks?: any[]): LeadData {
  const mapDecisionMaker = (dmRaw: any): DecisionMaker => ({
    name: dmRaw?.namn || "Okänd",
    title: dmRaw?.titel || "Okänd titel",
    email: dmRaw?.epost || "",
    linkedin: dmRaw?.linkedin_url || "", // Map strict URL or empty
    directPhone: dmRaw?.telefon || "" // Map Direct number
  });

  const decisionMakers: DecisionMaker[] = [];
  if (raw.beslutsfattare_prio_1?.namn) decisionMakers.push(mapDecisionMaker(raw.beslutsfattare_prio_1));
  if (raw.beslutsfattare_prio_2?.namn) decisionMakers.push(mapDecisionMaker(raw.beslutsfattare_prio_2));
  if (raw.beslutsfattare_prio_3?.namn) decisionMakers.push(mapDecisionMaker(raw.beslutsfattare_prio_3));

  // Better Segment Mapping logic
  let segment: Segment = Segment.UNKNOWN;
  if (raw.segment_kod) {
    const code = raw.segment_kod.toUpperCase();
    if (code === 'TS') segment = Segment.TS;
    if (code === 'FS') segment = Segment.FS;
    if (code === 'KAM') segment = Segment.KAM;
    if (code === 'DM') segment = Segment.DM;
  } 
  
  // Handling Legacy field vs New multi-year fields
  const primaryRevenueStr = raw.ekonomi_senaste_belopp || raw.omsaettning_sek || "";
  
  // Fallback if AI missed segment_kod but we have revenue data strings
  if (segment === Segment.UNKNOWN && primaryRevenueStr) {
     const rev = String(primaryRevenueStr).toUpperCase();
     if (rev.includes("MD") || rev.includes("MILJARD")) segment = Segment.KAM;
  }

  // Construct Rating Object if data exists
  let ratingObj = undefined;
  if (raw.kund_betyg) {
    ratingObj = {
      score: raw.kund_betyg,
      count: raw.kund_antal || "",
      source: raw.kund_kalla || "Kundomdöme",
      sentiment: raw.kund_sentiment || ""
    };
  }

  // Handle Credit Rating (Robust Mapping)
  let creditLabel = raw.kredit_omdome || raw.est_kreditrating || raw.kreditbetyg || "";
  if ((!creditLabel || creditLabel.toLowerCase() === 'okänd') && raw.status_juridisk) {
     if (raw.status_juridisk.toLowerCase().includes('konkurs') || raw.status_juridisk.toLowerCase().includes('likvidation')) {
         creditLabel = "Konkurs/Risk";
     }
  }
  
  if (!creditLabel || creditLabel.trim() === "") {
      creditLabel = "Kunde inte hittas";
  }
  
  const creditDesc = raw.kredit_motivering || "";

  // ------------------------------------------------------------------
  // CALCULATE FREIGHT BUDGET MANUALLY (5% RULE) & ENFORCE SEGMENTS
  // ------------------------------------------------------------------
  let calculatedFreight = "";
  let calculatedSegment: Segment | null = null;
  let normalizedRevenueStr = "";
  let revenueCurrentVal = 0;
  
  if (primaryRevenueStr) {
    // 1. Robust Parse with Unit Detection
    let revVal = parseRevenue(primaryRevenueStr);

    if (revVal > 0) {
       revenueCurrentVal = revVal;

       // Re-format normalized revenue string for display
       normalizedRevenueStr = revVal.toLocaleString('sv-SE') + " tkr";

       // 2. Calculate 5%
       const freightVal = Math.round(revVal * 0.05);
       
       // 3. Format back to string with thousands separator + " tkr"
       calculatedFreight = freightVal.toLocaleString('sv-SE') + " tkr";

       // 4. STRICT SEGMENT ASSIGNMENT (Overrides AI)
       if (freightVal >= 5000) {
         calculatedSegment = Segment.KAM;
       } else if (freightVal >= 750) {
         calculatedSegment = Segment.FS;
       } else if (freightVal >= 250) {
         calculatedSegment = Segment.TS;
       } else {
         calculatedSegment = Segment.DM;
       }
    }
  }

  // Fallback to AI's guess if calculation failed (e.g. text was "Ej publik")
  if (!calculatedFreight && raw.est_fraktbudget_sek) {
    calculatedFreight = raw.est_fraktbudget_sek;
  }

  // Apply Calculated Segment if valid, otherwise keep AI's guess
  if (calculatedSegment) {
    segment = calculatedSegment;
  }

  // ------------------------------------------------------------------
  // FINANCIAL GROWTH CALCULATION & HISTORY POPULATION
  // ------------------------------------------------------------------
  let financialsObj: any = undefined;
  const history: FinancialRecord[] = [];

  if (revenueCurrentVal > 0) {
      // Add current year to history
      history.push({
          year: raw.ekonomi_senaste_ar || "Senaste",
          revenue: revenueCurrentVal
      });

      financialsObj = {
          yearCurrent: raw.ekonomi_senaste_ar || "Senaste",
          revenueCurrent: revenueCurrentVal,
          yearPrevious: raw.ekonomi_foregaende_ar || "",
          revenuePrevious: 0,
          growthPercent: undefined as number | undefined,
          history: history
      };

      if (raw.ekonomi_foregaende_belopp) {
          // Parse Previous Year with same robust logic
          let prevVal = parseRevenue(raw.ekonomi_foregaende_belopp);

          if (prevVal > 0) {
             financialsObj.revenuePrevious = prevVal;
             // Add previous year to history
             history.push({
                 year: raw.ekonomi_foregaende_ar || "Föregående",
                 revenue: prevVal
             });

             // Calc Growth: ((Current - Previous) / Previous) * 100
             const growth = ((revenueCurrentVal - prevVal) / prevVal) * 100;
             financialsObj.growthPercent = parseFloat(growth.toFixed(1));
          }
      }
  }

  // --- SOURCE CONSOLIDATION (STRICT CLEANING) ---
  let sourceLinks: SourceLink[] = [];
  
  // 1. Process Grounding Metadata from API
  if (groundingChunks) {
     sourceLinks = groundingChunks.map((c: any) => {
         const uri = c.web?.uri || "";
         let title = c.web?.title || "";
         let domain = "";
         
         if (uri) {
             try {
                const urlObj = new URL(uri);
                const host = urlObj.hostname;
                domain = host.replace('www.', '');
             } catch(e) {}
         }
         
         // Fix: If no title is provided by Google, try to use domain.
         if (!title || title.includes('vertexaisearch')) {
             title = domain || "Källa";
         }
         
         return {
             title: title,
             url: uri,
             domain: domain
         };
     }).filter(link => {
         // FILTER OUT BAD LINKS (Internal Google/AI Studio redirects)
         const badDomains = ['vertexaisearch', 'google.com', 'googleusercontent', 'aistudio.google', 'storage.googleapis'];
         const urlLower = link.url.toLowerCase();
         if (!link.url || link.url.length < 5) return false;
         if (badDomains.some(bad => urlLower.includes(bad))) return false;
         return true;
     });
  }

  // 2. Process Text Sources from AI Response (Legacy/Fallback)
  let rawSources: string[] = [];
  if (Array.isArray(raw.anvanda_kallor)) rawSources.push(...raw.anvanda_kallor);
  if (Array.isArray(raw.anvanda_kallor_steg2)) rawSources.push(...raw.anvanda_kallor_steg2);
  if (Array.isArray(raw.anvanda_kallor_steg3)) rawSources.push(...raw.anvanda_kallor_steg3);
  if (raw.kallor_trovardighet) rawSources.push(raw.kallor_trovardighet);

  // Clean raw sources: remove vertex URLs from text list, fix formatting
  const cleanRawSources = Array.from(new Set(rawSources))
    .filter(s => s && typeof s === 'string' && s.length > 0)
    .map(s => {
       if (s.includes('vertexaisearch') || s.includes('googleusercontent')) return ""; 
       return s.trim();
    })
    .filter(s => s.length > 0);

  // 3. MERGE LOGIC: Combine Grounding sources with Text sources
  // Prioritize grounding links, add text sources if unique domain
  const textSourceLinks = cleanRawSources.map(s => {
      let title = s;
      let url = "";
      let domain = "";
      
      if (s.startsWith('http')) {
          url = s;
          try {
              const u = new URL(s);
              domain = u.hostname.replace('www.', '');
              title = domain;
          } catch(e) {
              title = "Länk";
          }
      } else {
         domain = s;
      }
      return { title, url, domain };
  });

  const mergedLinks = [...sourceLinks];
  const existingDomains = new Set(sourceLinks.map(l => (l.domain || l.url).toLowerCase()));

  textSourceLinks.forEach(link => {
      const d = (link.domain || link.url).toLowerCase();
      // Add if unique and looks valid and NOT a bad domain
      const badDomains = ['vertexaisearch', 'google.com', 'googleusercontent'];
      if (d.length > 3 && !existingDomains.has(d) && !badDomains.some(b => d.includes(b))) {
          mergedLinks.push(link);
          existingDomains.add(d);
      }
  });
  
  sourceLinks = mergedLinks;
    
  // MAP F-TAX (Improved Logic)
  let ftax = 'Okänd';
  const rawFtax = (raw.har_f_skatt || '').toLowerCase();
  
  if (rawFtax) {
      if (rawFtax.includes('ej') || rawFtax.includes('inte') || rawFtax.includes('avreg') || rawFtax.includes('nej')) {
          ftax = 'Nej';
      } else if (rawFtax.includes('ja') || rawFtax.includes('god') || rawFtax.includes('reg')) {
          ftax = 'Ja';
      }
  }

  // --- FALLBACK VALUE LOGIC FOR MISSING DATA ---
  const fallbackStr = "Kunde inte hittas";
  
  // Delivery Services: If array is empty, return array with fallback string so chip renders
  const deliveryServices = (Array.isArray(raw.leverans_tjanster) && raw.leverans_tjanster.length > 0) 
      ? raw.leverans_tjanster 
      : [fallbackStr];

  return {
    id: crypto.randomUUID(), // Unique ID for each generated lead
    companyName: raw.foretagsnamn || "Okänt Företag",
    orgNumber: raw.org_nr || "",
    address: raw.adress || "", // Säte / Utdelningsadress
    visitingAddress: raw.besoksadress || "",
    warehouseAddress: raw.lageradress || "",
    returnAddress: raw.returadress || "",
    
    phoneNumber: raw.telefon_vaxel || "", // Map Switchboard
    
    segment: segment,
    revenue: normalizedRevenueStr || raw.omsaettning_sek || "", // Use normalized revenue if calculated
    revenueSource: raw.omsaettning_kalla || "", // Mapped
    freightBudget: calculatedFreight, // Use the manually calculated value
    
    financials: financialsObj, // New Financial Object with History

    // Legal & Credit
    legalStatus: raw.status_juridisk || "Aktivt",
    creditRatingLabel: creditLabel,
    creditRatingDescription: creditDesc,

    // New V8.1/V8.2/V8.3 Fields
    ecommercePlatform: raw.ehandel_plattform || fallbackStr,
    hasFtax: ftax,
    logisticsProfile: raw.frakt_profil || "",
    markets: raw.marknader || "", 
    multiBrands: raw.ovriga_butiker || "",
    
    // Mapped New Fields
    deliveryServices: deliveryServices,
    checkoutPosition: raw.checkout_ranking || fallbackStr,

    parentCompany: raw.dotterbolag_till || "",

    liquidity: raw.kassalikviditet || fallbackStr, 
    trendRisk: [raw.marknadsposition, raw.trend_risk].filter(Boolean).join(". ") || "",
    trigger: raw.trigger || "",
    emailStructure: raw.e_poststruktur || "",
    decisionMakers: decisionMakers,
    icebreaker: raw.icebreaker_text || "",
    latestNews: raw.senaste_nyheter || "", // News field
    latestNewsUrl: raw.senaste_nyheter_url || "", // Map news URL
    
    websiteUrl: raw.webbadress || "",
    carriers: raw.transportorer || "",
    usesDhl: raw.anvander_dhl || "Nej",
    shippingTermsLink: raw.fraktvillkor_url || "",

    rating: ratingObj,

    searchLog: {
      primaryQuery: raw.primar_sokning || "Auto",
      secondaryQuery: "",
      credibilitySource: ""
    },
    
    sourceLinks: sourceLinks, // New: Pass structured links
    analysisDate: new Date().toISOString(), // TIMESTAMP

    source: 'ai' // Default origin
  };
}

/**
 * Extracts wait time in seconds from error strings like:
 * "Återstående väntetid: 31m23.240508255s" or "31m23s"
 */
function extractWaitTime(text: string): number {
  if (!text) return 0;
  
  // Try to match standard Go duration formats
  // Match "31m23s" or "31m23.5s"
  const matchMinSec = text.match(/(\d+)m(\d+)(\.\d+)?s/);
  if (matchMinSec) {
    const minutes = parseInt(matchMinSec[1], 10);
    const seconds = parseInt(matchMinSec[2], 10);
    // Add 60s buffer to be safe
    return (minutes * 60) + seconds + 60;
  }

  // Match hours "1h5m"
  const matchHourMin = text.match(/(\d+)h(\d+)m/);
  if (matchHourMin) {
    const hours = parseInt(matchHourMin[1], 10);
    const minutes = parseInt(matchHourMin[2], 10);
    return (hours * 3600) + (minutes * 60) + 60;
  }

  return 0;
}

/**
 * Executes a Gemini request with retry logic to handle transient 500 errors.
 */
async function generateWithRetry(ai: GoogleGenAI, model: string, prompt: string, config: any, retries = 3) {
  let currentConfig = { ...config }; // Clone config to allow modification (fallback)

  // CRITICAL FIX: Ensure responseMimeType is NOT set when using tools like googleSearch.
  // The API throws 400 Invalid Argument if both are present.
  if (currentConfig.tools && currentConfig.responseMimeType === 'application/json') {
     delete currentConfig.responseMimeType;
  }

  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: currentConfig
      });
    } catch (error: any) {
      // DETECT QUOTA/OVERLOAD ERRORS (429, 503) AGGRESSIVELY
      const errString = (error.toString() || '').toLowerCase();
      const message = (error.message || '').toLowerCase();
      const status = error.status || error.response?.status || error.statusCode;

      // Log error for debugging purposes
      console.warn(`Gemini API Error (Attempt ${i + 1}):`, error);

      const isQuotaOrOverload = 
        status === 429 || 
        status === 503 ||
        errString.includes('429') || 
        errString.includes('503') ||
        message.includes('429') || 
        message.includes('503') ||
        errString.includes('quota') || 
        message.includes('quota') || 
        errString.includes('overloaded') ||
        message.includes('overloaded') ||
        errString.includes('too many requests') || 
        message.includes('too many requests') ||
        message.includes('resource exhausted') ||
        message.includes('unavailable');

      if (isQuotaOrOverload) {
        // --- GROQ FALLBACK (FIRST PRIORITY) ---
        // Try Groq first if available (gratis och snabb!)
        if (isGroqAvailable() && i === 0) {
            console.warn("🚀 Gemini Quota hit. Trying GROQ fallback (FREE & FAST)...");
            try {
                const groqResponse = await analyzeWithGroq(
                    currentConfig.systemInstruction || "",
                    prompt,
                    currentConfig.temperature || 0.2
                );
                
                // Returnera i samma format som Gemini
                return {
                    text: groqResponse,
                    candidates: [{
                        groundingMetadata: { groundingChunks: [] }
                    }]
                };
            } catch (groqError: any) {
                console.warn("Groq fallback failed:", groqError.message);
                // Fortsätt till nästa fallback...
            }
        }
        
        // --- SMART FALLBACK FOR GROUNDING QUOTA ---
        // If we hit a 429 AND we are using tools (Search Grounding), switch to Pure LLM.
        if (currentConfig.tools && currentConfig.tools.length > 0) {
            console.warn("Grounding Quota hit (429). Switching to Pure LLM Fallback (No Search).");
            delete currentConfig.tools; // Remove search tools
            
            // Re-apply JSON mimeType if it was removed earlier, as Pure LLM handles it fine
            if (!currentConfig.responseMimeType) {
                currentConfig.responseMimeType = 'application/json';
            }
            
            // Wait a short moment to clear immediate buffer then retry immediately
            await new Promise(resolve => setTimeout(resolve, 2000));
            i--; // Decrement attempt counter to give the fallback a fair chance
            continue; 
        }

        // 1. CHECK FOR SPECIFIC GROUNDING WAIT TIME (If fallback didn't work or wasn't applicable)
        const waitTime = extractWaitTime(message) || extractWaitTime(errString);
        if (waitTime > 0) {
           console.warn(`Detected Grounding Quota (Fallback failed/NA). Wait time: ${waitTime}s`);
           // Fail immediately with the specific wait time
           throw new Error(`QUOTA_GROUNDING:${waitTime}`);
        }

        // 2. Distinguish between hard Quota (Resource Exhausted) and Rate Limit
        const isResourceExhausted = message.includes('resource exhausted') || message.includes('quota');
        
        // If it's a hard daily limit, fail immediately
        if (isResourceExhausted) {
             throw new Error("QUOTA_EXHAUSTED");
        }
        
        // If it's the last retry, allow the loop to finish and throw error
        if (i === retries - 1) {
           throw new Error("RATE_LIMIT_HIT");
        }
        
        // UPDATED: Wait 10s (instead of 6s) for Rate Limits to cool down
        console.warn("429 hit. Cooling down for 10s...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }

      if (i === retries - 1) throw error;
      // Standard exponential backoff for other errors: 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error("API failed after max retries");
}

/**
 * Searches specifically for a person on LinkedIn for a given company and role.
 */
export const findPersonOnLinkedIn = async (companyName: string, role: string): Promise<DecisionMaker | null> => {
   if (!GEMINI_API_KEY) throw new Error("API Key missing");
   const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
   
   // SWITCH TO FLASH TO SAVE QUOTA
   const model = "gemini-2.5-flash"; 

   const prompt = `
   UPPGIFT: Hitta en specifik person på LinkedIn via Google Search.
   
   INPUT:
   Företag: "${companyName}"
   Sökes Roll: "${role}"

   STEG:
   1. Sök på Google efter: site:linkedin.com/in/ "${companyName}" "${role}"
   2. Identifiera den mest relevanta profilen som arbetar på bolaget.
   3. VIKTIGT: Returnera svaret som ett rent JSON-objekt. Inga markdown-block (\`\`\`).
   
   OM DU HITTAR EN TRÄFF (Exempel):
   { 
     "namn": "Anders Andersson", 
     "titel": "Logistikchef", 
     "linkedin_url": "https://www.linkedin.com/in/anders-andersson-123" 
   }

   OM DU INTE HITTAR NÅGON (Exempel):
   []
   `;

   try {
     const response = await generateWithRetry(ai, model, prompt, {
       tools: [{ googleSearch: {} }]
     });
     
     if (response && response.text) {
       const json = extractJSON(response.text);
       if (json && json.length > 0) {
         const p = json[0];
         const person = Array.isArray(p) ? p[0] : p;
         
         if (person && person.namn && person.namn !== "Okänd") {
            return {
              name: person.namn,
              title: person.titel || role,
              linkedin: person.linkedin_url || "",
              email: "",
              directPhone: ""
            };
         }
       }
     }
     return null;
   } catch (e: any) {
     if (e.message.startsWith("QUOTA_GROUNDING:") || e.message === "QUOTA_EXHAUSTED" || e.message === "RATE_LIMIT_HIT") throw e;
     console.error("LinkedIn search failed:", e);
     return null;
   }
};

/**
 * NEW SEQUENTIAL DEEP DIVE FUNCTION (3 STEPS)
 * IMPLEMENTS SMART MERGE: Preserves Core Data (Revenue, OrgNr) from Step 1 while appending Step 2 & 3.
 */
export const generateDeepDiveSequential = async (
  formData: SearchFormData, 
  onPartialUpdate: (lead: LeadData) => void
): Promise<LeadData> => {
  if (!GEMINI_API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // --- CACHE CHECK ---
  const cached = getFromCache(formData.companyNameOrOrg);
  if (cached) {
      onPartialUpdate(cached); // Show cached data immediately
      return cached; 
  }

  // DETERMINE MODEL BASED ON PROTOCOL MODE
  const useProModel = formData.batchMode === 'deep_pro';
  const model = useProModel ? "gemini-3-pro-preview" : "gemini-2.5-flash"; 
  const delayTime = useProModel ? 8000 : 2000; // Increased delay for Pro

  // --- STEP 1: CORE DATA (Mandatory) ---
  // If Step 1 fails, we throw, because we have no company identity.
  const step1Prompt = `
  INPUT: ${formData.companyNameOrOrg}
  INSTRUKTION: Kör STEG 1 (Core Data) enligt DEEP DIVE protokoll.
  
  VIKTIGT: 
  1. Hämta organisationsnummer (XXXXXX-XXXX).
  2. Du måste verifiera att organisationsnumret tillhör just "${formData.companyNameOrOrg}".
  3. KORSREFERENS (STRIKT): Om du hittar ett org.nr, bekräfta att det står bredvid texten "${formData.companyNameOrOrg}" i sökresultaten. 
  4. Om du hittar en träff på ett annat bolagsnamn (t.ex. moderbolag eller liknande namn), och inte exakt "${formData.companyNameOrOrg}", IGNORERA DET eller returnera tomt Org.nr.
  5. Returnera ENDAST JSON-objektet. Inga markdown-block (\`\`\`).
  `;

  // Start Parallel Processes: 1. AI Analysis, 2. Kronofogden Check (will wait for AI result to get org nr)
  console.log(`🔍 Startar Steg 1 analys för: ${formData.companyNameOrOrg}`);
  console.log(`   Modell: ${model}`);
  
  const step1Response = await generateWithRetry(ai, model, step1Prompt, {
    systemInstruction: DEEP_STEP_1_CORE,
    tools: [{ googleSearch: {} }],
    temperature: 0.1
  });

  console.log(`📥 Steg 1 svar mottaget`);
  
  // Extract text from response - handle both direct text and parts array
  let step1Text = step1Response.text;
  if (!step1Text && step1Response.candidates?.[0]?.content?.parts) {
    // When using grounding tools, text might be in parts array
    const parts = step1Response.candidates[0].content.parts;
    step1Text = parts.map((p: any) => p.text || '').join('');
  }
  
  console.log(`   Text längd: ${step1Text?.length || 0} tecken`);
  console.log(`   Första 200 tecken: ${step1Text?.substring(0, 200) || 'TOMT'}`);

  if (!step1Text) {
    console.error(`❌ Inget svar från Gemini API i Steg 1`);
    console.error(`   Företag: ${formData.companyNameOrOrg}`);
    console.error(`   Modell: ${model}`);
    console.error(`   Response object:`, JSON.stringify(step1Response, null, 2));
    throw new Error("Inget svar i Steg 1 - Gemini API returnerade tomt svar. Försök igen eller kontrollera API-status.");
  }
  
  const step1Json = extractJSON(step1Text);
  console.log(`📊 JSON extraherat från Steg 1:`, step1Json);
  
  if (!step1Json || step1Json.length === 0) {
    console.error(`❌ Kunde inte tolka JSON från Gemini svar`);
    console.error(`   Rå text:`, step1Response.text);
    throw new Error("Kunde inte tolka data i Steg 1 - JSON-parsing misslyckades. Kontrollera Gemini API svar.");
  }
  
  // -- ACCUMULATORS --
  const groundingChunks1 = step1Response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  let currentGrounding = [...groundingChunks1];
  
  // Map Initial Data
  let currentData = mapAiResponseToLeadData(step1Json[0], currentGrounding);
  
  // --- VALIDERA ORG.NUMMER (KRITISKT) ---
  if (!currentData.orgNumber || currentData.orgNumber === "" || currentData.orgNumber === "SAKNAS") {
      console.error(`❌ KRITISKT: Org.nummer saknas för ${currentData.companyName}`);
      console.error(`   Analysen kan inte fortsätta utan org.nummer.`);
      console.error(`   Försök söka manuellt på Allabolag.se eller Ratsit.se`);
      
      // Markera som ofullständig
      currentData.analysisStatus = "INCOMPLETE - Org.nummer saknas";
      currentData.orgNumber = "SAKNAS - Kunde inte hittas";
      
      // Returnera ofullständig data
      return currentData;
  }
  
  // Normalisera och validera org.nummer format
  const normalizedOrg = normalizeOrgNumber(currentData.orgNumber);
  if (!normalizedOrg || !validateOrgNumber(normalizedOrg)) {
      console.warn(`⚠️ Ogiltigt org.nummer format: ${currentData.orgNumber}`);
      console.warn(`   Försöker normalisera...`);
      
      if (normalizedOrg) {
          currentData.orgNumber = normalizedOrg;
          console.log(`✅ Org.nummer normaliserat till: ${normalizedOrg}`);
      } else {
          console.error(`❌ Kunde inte normalisera org.nummer: ${currentData.orgNumber}`);
          currentData.analysisStatus = "INCOMPLETE - Ogiltigt org.nummer";
          return currentData;
      }
  } else {
      currentData.orgNumber = normalizedOrg;
      console.log(`✅ Giltigt org.nummer: ${normalizedOrg}`);
  }
  
  // --- PARALLEL KRONOFOGDEN CHECK (FÖRBÄTTRAD) ---
  if (currentData.orgNumber && currentData.orgNumber !== "SAKNAS - Kunde inte hittas") {
      // Validera org.nr först
      if (validateOrgNumber(currentData.orgNumber)) {
          const kronoRecord = await checkKronofogdenNew(currentData.orgNumber);
          if (kronoRecord) {
              currentData.kronofogdenCheck = formatKronofogdenResult(kronoRecord);
              // If we found a hit in Kronofogden, force legalStatus to show it too if it says Active
              if (!currentData.legalStatus.toLowerCase().includes('konkurs') && !currentData.legalStatus.toLowerCase().includes('likvidation')) {
                  currentData.legalStatus = `VARNING: ${kronoRecord.status}`;
              }
              console.log(`⚠️ Kronofogden hit: ${kronoRecord.status} för ${currentData.companyName}`);
          } else {
              console.log(`✅ Inget ärende hos Kronofogden för ${currentData.companyName}`);
          }
      } else {
          console.warn(`⚠️ Ogiltigt org.nr: ${currentData.orgNumber}`);
      }
  }

  onPartialUpdate(currentData); // Update UI with basic data

  // --- SAFETY PAUSE 1 ---
  await new Promise(resolve => setTimeout(resolve, delayTime));

  // --- STEP 2: LOGISTICS & TECH (Smart Merge) ---
  try {
      const step2Prompt = `
      KONTEXT (Redan känt):
      Företag: ${currentData.companyName}
      Adress: ${currentData.address}
      Webb: ${currentData.websiteUrl}

      INSTRUKTION: Kör STEG 2 (Logistik & Teknik).
      Sök efter Logistikprofil, Transportörer, Leveranstjänster och E-handelsplattform.
      Returnera ENDAST JSON med nya fält. Skriv inte över tomma fält.
      `;

      const step2Response = await generateWithRetry(ai, model, step2Prompt, {
        systemInstruction: DEEP_STEP_2_LOGISTICS,
        tools: [{ googleSearch: {} }],
        temperature: 0.4
      });

      if (step2Response.text) {
        const step2Json = extractJSON(step2Response.text);
        if (step2Json && step2Json.length > 0) {
           const step2Raw = step2Json[0];
           const groundingChunks2 = step2Response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
           
           // Append new grounding chunks
           currentGrounding = [...currentGrounding, ...groundingChunks2];
           
           // SMART MERGE: We map Step 2 separately, then merge specific fields onto currentData
           // We do NOT use step2Raw to map everything because it might contain empty revenue fields that overwrite step 1.
           // Instead, we only take what Step 2 is responsible for.
           const step2Mapped = mapAiResponseToLeadData(step2Raw, []); // Map purely for Step 2 fields

           currentData = {
               ...currentData,
               // Overwrite only Step 2 specific fields if they exist
               logisticsProfile: step2Mapped.logisticsProfile || currentData.logisticsProfile,
               ecommercePlatform: (step2Mapped.ecommercePlatform !== "Kunde inte hittas" ? step2Mapped.ecommercePlatform : currentData.ecommercePlatform),
               carriers: step2Mapped.carriers || currentData.carriers,
               usesDhl: step2Mapped.usesDhl || currentData.usesDhl,
               markets: step2Mapped.markets || currentData.markets,
               deliveryServices: (step2Mapped.deliveryServices.length > 0 && step2Mapped.deliveryServices[0] !== "Kunde inte hittas") ? step2Mapped.deliveryServices : currentData.deliveryServices,
               checkoutPosition: (step2Mapped.checkoutPosition !== "Kunde inte hittas" ? step2Mapped.checkoutPosition : currentData.checkoutPosition),
               multiBrands: step2Mapped.multiBrands || currentData.multiBrands,
               liquidity: (step2Mapped.liquidity !== "Kunde inte hittas" ? step2Mapped.liquidity : currentData.liquidity),
               
               // APPEND Sources (Don't overwrite)
               sourceLinks: [...currentData.sourceLinks, ...(step2Mapped.sourceLinks || [])]
           };
        }
      }
  } catch (error: any) {
      console.warn("Step 2 (Logistics) failed:", error);
      if (error.message.includes("QUOTA") || error.message.includes("429")) return currentData;
  }
  
  // We need to update UI with merged Step 2
  // Note: We need to re-process SourceLinks from accumulated grounding chunks to ensure verified sources appear
  const groundingLinks2 = (extractGroundingLinks(currentGrounding.slice(groundingChunks1.length)) || []);
  currentData.sourceLinks = [...currentData.sourceLinks, ...groundingLinks2];
  
  onPartialUpdate(currentData);

  // --- SAFETY PAUSE 2 ---
  await new Promise(resolve => setTimeout(resolve, delayTime));

  // --- STEP 3: PEOPLE & NEWS (Smart Merge) ---
  try {
      const step3Prompt = `
      KONTEXT (Redan känt):
      Företag: ${currentData.companyName}
      Logistik: ${currentData.logisticsProfile}

      INSTRUKTION: Kör STEG 3 (Människor & Insikter).
      Sök efter Beslutsfattare (Logistikchef, VD), Nyheter och Omdömen.
      Returnera ENDAST JSON med nya fält.
      `;

      const step3Response = await generateWithRetry(ai, model, step3Prompt, {
        systemInstruction: DEEP_STEP_3_PEOPLE,
        tools: [{ googleSearch: {} }],
        temperature: 0.2
      });

      if (step3Response.text) {
          const step3Json = extractJSON(step3Response.text);
          if (step3Json && step3Json.length > 0) {
              const step3Raw = step3Json[0];
              const groundingChunks3 = step3Response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
              
              const step3Mapped = mapAiResponseToLeadData(step3Raw, []); // Map purely for Step 3 fields

              currentData = {
                  ...currentData,
                  // Merge Step 3 Fields
                  decisionMakers: step3Mapped.decisionMakers.length > 0 ? step3Mapped.decisionMakers : currentData.decisionMakers,
                  emailStructure: step3Mapped.emailStructure || currentData.emailStructure,
                  trendRisk: step3Mapped.trendRisk || currentData.trendRisk,
                  icebreaker: step3Mapped.icebreaker || currentData.icebreaker,
                  latestNews: step3Mapped.latestNews || currentData.latestNews,
                  latestNewsUrl: step3Mapped.latestNewsUrl || currentData.latestNewsUrl,
                  rating: step3Mapped.rating || currentData.rating,
                  
                  // Append Sources
                   sourceLinks: [...currentData.sourceLinks, ...(step3Mapped.sourceLinks || [])]
              };

              const groundingLinks3 = (extractGroundingLinks(groundingChunks3) || []);
              currentData.sourceLinks = [...currentData.sourceLinks, ...groundingLinks3];
          }
      }
  } catch (error: any) {
      console.warn("Step 3 (People) failed:", error);
  }

  // --- STEP 4: WEBSITE SCRAPING & TECH ANALYSIS (NEW!) ---
  // Scrape company website for detailed logistics and e-commerce data via backend API
  // AND analyze tech stack with techAnalysisService
  // PLUS ask Gemini about checkout shipping order
  if (currentData.websiteUrl && currentData.websiteUrl.length > 0) {
    try {
      console.log(`🕷️ Step 4: Website scraping + Tech analysis + Checkout order`);
      
      // HYBRID APPROACH: Gemini prompt för checkout-ordning (primär metod)
      const checkoutPrompt = `Analysera ${currentData.companyName}s checkout och leveransalternativ.

VIKTIGT: Svara ENDAST med JSON i detta exakta format:
{
  "shipping_providers": ["DHL", "PostNord", "Bring"],
  "dhl_position": 1,
  "has_dhl": true,
  "confidence": "high",
  "source": "website"
}

Frågor att besvara:
1. Vilka transportörer/fraktleverantörer erbjuder ${currentData.companyName} i sin checkout/kassa?
2. I vilken ordning visas de? (1 = först/högst upp)
3. Finns DHL med? I vilken position?
4. Hur säker är du på informationen? (high/medium/low)

Sök på: "${currentData.companyName} checkout frakt leverans" och "${currentData.websiteUrl}"

Returnera ENDAST JSON, ingen annan text.`;

      // Parallella anrop: Gemini checkout + Backend scraping + Tech analysis
      const [checkoutInfo, scrapingResponse, techStack] = await Promise.all([
        generateWithRetry(checkoutPrompt, {
          temperature: 0.1,
          maxOutputTokens: 500
        }).catch(err => {
          console.warn('Gemini checkout analysis failed:', err);
          return null;
        }),
        fetch(`${API_BASE_URL}/scrape/website`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: currentData.websiteUrl }),
        }),
        analyzeWebsiteTech(currentData.websiteUrl).catch(err => {
          console.warn('Tech analysis failed:', err);
          return null;
        })
      ]);

      if (!scrapingResponse.ok) {
        throw new Error(`Scraping API returned ${scrapingResponse.status}`);
      }

      const websiteData = await scrapingResponse.json();
      
      // Parse Gemini checkout info
      let geminiCheckoutData = null;
      if (checkoutInfo) {
        try {
          const cleanJson = checkoutInfo.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          geminiCheckoutData = JSON.parse(cleanJson);
          console.log(`✅ Gemini checkout analysis: ${geminiCheckoutData.shipping_providers?.length || 0} transportörer (${geminiCheckoutData.confidence} confidence)`);
        } catch (e) {
          console.warn('Failed to parse Gemini checkout data:', e);
        }
      }
      
      // HYBRID MERGE: Använd Gemini data om tillgänglig och hög confidence, annars Puppeteer
      let finalShippingProviders = websiteData.shipping_providers || [];
      let finalShippingWithPosition = websiteData.shipping_providers_with_position || [];
      let checkoutDataSource = 'scraping';
      
      if (geminiCheckoutData && geminiCheckoutData.shipping_providers && geminiCheckoutData.shipping_providers.length > 0) {
        if (geminiCheckoutData.confidence === 'high' || geminiCheckoutData.confidence === 'medium') {
          // Använd Gemini data (mer tillförlitlig ordning)
          finalShippingProviders = geminiCheckoutData.shipping_providers;
          finalShippingWithPosition = geminiCheckoutData.shipping_providers.map((name: string, index: number) => ({
            name,
            position: index + 1
          }));
          checkoutDataSource = `gemini (${geminiCheckoutData.confidence})`;
          console.log(`✅ Using Gemini checkout data (${geminiCheckoutData.confidence} confidence)`);
        } else if (finalShippingProviders.length === 0) {
          // Puppeteer hittade inget, använd Gemini även med low confidence
          finalShippingProviders = geminiCheckoutData.shipping_providers;
          finalShippingWithPosition = geminiCheckoutData.shipping_providers.map((name: string, index: number) => ({
            name,
            position: index + 1
          }));
          checkoutDataSource = `gemini (${geminiCheckoutData.confidence})`;
          console.log(`⚠️ Using Gemini checkout data as fallback (${geminiCheckoutData.confidence} confidence)`);
        }
      }
      
      // Override websiteData with final merged data
      websiteData.shipping_providers = finalShippingProviders;
      websiteData.shipping_providers_with_position = finalShippingWithPosition;
      websiteData.checkout_data_source = checkoutDataSource;
      
      // Merge scraping data + tech analysis into lead
      currentData.websiteAnalysis = {
        url: websiteData.url,
        scraped_at: websiteData.scraped_at,
        ecommerce_platform: websiteData.ecommerce_platform || techStack?.ecommercePlatform,
        has_checkout: websiteData.has_checkout,
        checkout_providers: websiteData.checkout_providers || techStack?.paymentProviders || [],
        shipping_providers: websiteData.shipping_providers || techStack?.shippingIntegrations || [],
        shipping_providers_with_position: websiteData.shipping_providers_with_position || [],
        international_shipping: websiteData.international_shipping,
        technologies: websiteData.technologies || techStack?.frameworks || [],
        product_categories: websiteData.product_categories,
        financial_metrics: websiteData.financial_metrics,
        // Extra tech data från techAnalysisService
        tech_stack: techStack ? {
          analytics: techStack.analytics,
          hosting: techStack.hosting,
          cdn: techStack.cdn,
          cms: techStack.cms,
          checkout_position: techStack.checkoutPosition
        } : undefined
      };

      // Update e-commerce platform if found via scraping
      if (websiteData.ecommerce_platform && websiteData.ecommerce_platform !== "Kunde inte hittas") {
        currentData.ecommercePlatform = websiteData.ecommerce_platform;
      }

      // Update carriers if found via scraping - med position
      if (websiteData.shipping_providers && websiteData.shipping_providers.length > 0) {
        // Skapa formaterad sträng med position
        if (websiteData.shipping_providers_with_position && websiteData.shipping_providers_with_position.length > 0) {
          const carriersWithPos = websiteData.shipping_providers_with_position
            .map((c: any) => `${c.position}. ${c.name}`)
            .join(", ");
          currentData.carriers = carriersWithPos;
        } else {
          const scrapedCarriers = websiteData.shipping_providers.join(", ");
          if (!currentData.carriers || currentData.carriers === "Kunde inte hittas") {
            currentData.carriers = scrapedCarriers;
          } else {
            // Merge with existing carriers
            const existingCarriers = currentData.carriers.split(",").map(c => c.trim());
            const newCarriers = websiteData.shipping_providers.filter((c: string) => !existingCarriers.includes(c));
            if (newCarriers.length > 0) {
              currentData.carriers = [...existingCarriers, ...newCarriers].join(", ");
            }
          }
        }
      }

      // Check DHL position in checkout (med källa)
      if (websiteData.shipping_providers_with_position && websiteData.shipping_providers_with_position.length > 0) {
        const dhlCarrier = websiteData.shipping_providers_with_position.find((c: any) => 
          c.name.toLowerCase().includes('dhl')
        );
        if (dhlCarrier) {
          currentData.checkoutPosition = `Position ${dhlCarrier.position} av ${websiteData.shipping_providers_with_position.length} (${checkoutDataSource})`;
          currentData.usesDhl = "Ja";
        } else {
          currentData.checkoutPosition = `DHL ej i checkout (${checkoutDataSource})`;
          currentData.usesDhl = "Nej";
        }
      } else if (websiteData.shipping_providers && websiteData.shipping_providers.length > 0) {
        const dhlIndex = websiteData.shipping_providers.findIndex((p: string) => 
          p.toLowerCase().includes('dhl')
        );
        if (dhlIndex !== undefined && dhlIndex >= 0) {
          currentData.checkoutPosition = `Position ${dhlIndex + 1} av ${websiteData.shipping_providers.length} (${checkoutDataSource})`;
          currentData.usesDhl = "Ja";
        } else {
          currentData.checkoutPosition = `DHL ej i checkout (${checkoutDataSource})`;
          currentData.usesDhl = "Nej";
        }
      }

      console.log(`✅ Website scraping completed for ${currentData.companyName}`);
      onPartialUpdate(currentData); // Update UI with scraping data
      
    } catch (error: any) {
      console.warn(`⚠️ Website scraping failed for ${currentData.websiteUrl}:`, error.message);
      // Continue even if scraping fails
    }
  }

  // --- STEP 5: COMPETITIVE INTELLIGENCE & TRIGGERS (NEW!) ---
  // Analyze competitive situation and detect sales triggers
  if (currentData.websiteAnalysis) {
    try {
      console.log(`🎯 Analyzing competitive intelligence for ${currentData.companyName}`);
      
      // Competitive Intelligence Analysis
      const competitiveIntel = analyzeCompetitiveIntelligence(
        currentData.websiteAnalysis as any,
        currentData
      );
      
      currentData.competitiveIntelligence = competitiveIntel as any;
      currentData.opportunityScore = competitiveIntel.opportunity_score;
      currentData.salesPitch = competitiveIntel.sales_pitch;
      
      console.log(`✅ Opportunity Score: ${competitiveIntel.opportunity_score}/100`);
      
      // Trigger Detection
      const triggerAnalysis = detectTriggers(currentData);
      currentData.triggers = triggerAnalysis.triggers as any;
      currentData.triggerScore = triggerAnalysis.total_trigger_score;
      currentData.priorityLevel = triggerAnalysis.priority_level;
      currentData.contactTiming = triggerAnalysis.recommended_contact_timing;
      
      console.log(`✅ Triggers detected: ${triggerAnalysis.triggers.length} (Score: ${triggerAnalysis.total_trigger_score}/100)`);
      
      onPartialUpdate(currentData); // Update UI with intelligence data
      
    } catch (error: any) {
      console.warn(`⚠️ Competitive intelligence analysis failed:`, error.message);
    }
  }

  // --- STEP 6: NEWS SEARCH (OPTIONAL) ---
  // Search for recent company news
  try {
    console.log(`📰 Searching news for ${currentData.companyName}`);
    const news = await searchCompanyNews(currentData.companyName, 30);
    if (news.length > 0) {
      currentData.latestNews = news as any;
      console.log(`✅ Found ${news.length} news articles`);
    }
  } catch (error: any) {
    console.warn(`⚠️ News search failed:`, error.message);
  }

  // Final Cleanup of Source Links (Deduplicate)
  const uniqueLinks = new Map();
  currentData.sourceLinks.forEach(l => uniqueLinks.set(l.url, l));
  currentData.sourceLinks = Array.from(uniqueLinks.values());

  saveToCache(currentData);
  return currentData; 
};

// Helper to extract links specifically from chunks without full mapping
function extractGroundingLinks(chunks: any[]): SourceLink[] {
    if (!chunks) return [];
    return chunks.map((c: any) => {
         const uri = c.web?.uri || "";
         let title = c.web?.title || "";
         let domain = "";
         if (uri) {
             try {
                const urlObj = new URL(uri);
                domain = urlObj.hostname.replace('www.', '');
             } catch(e) {}
         }
         if (!title || title.includes('vertexaisearch')) title = domain || "Källa";
         return { title, url: uri, domain };
     }).filter(link => {
         const badDomains = ['vertexaisearch', 'google.com', 'googleusercontent', 'aistudio.google', 'storage.googleapis'];
         const urlLower = link.url.toLowerCase();
         if (!link.url || link.url.length < 5) return false;
         if (badDomains.some(bad => urlLower.includes(bad))) return false;
         return true;
     });
}

export const generateLeads = async (formData: SearchFormData): Promise<LeadData[]> => {
  if (!GEMINI_API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const isSingleSearch = formData.companyNameOrOrg.trim().length > 0;
  let userPrompt = "";
  let systemInstruction = "";
  let modelName = "gemini-2.5-flash"; // Default
  let currentTemperature = 0.2; // Default

  // Determine Protocol
  const isQuickMode = formData.batchMode === 'quick';
  const isProspectingMode = formData.batchMode === 'batch_prospecting';
  const isDeepMode = formData.batchMode === 'deep' || formData.batchMode === 'deep_pro' || (!isQuickMode && !isProspectingMode);

  if (isSingleSearch) {
    // Legacy single search path
    systemInstruction = DEEP_ANALYSIS_INSTRUCTION;
    modelName = (formData.batchMode === 'deep_pro') ? "gemini-3-pro-preview" : "gemini-2.5-flash"; 
    
    userPrompt = `
    INPUT DATA: SINGLE SEARCH
    Sökobjekt: ${formData.companyNameOrOrg}
    INSTRUKTION: Utför analys enligt protokoll. Returnera JSON.
    `;

  } else {
    // --- BATCH SEARCH ---
    
    // SPLIT EXCLUSIONS INTO "STRICT BLOCKS" AND "NEGATIVE MATCHES"
    const rawExclusions = (formData.excludeCompanies || "").split(',').map(s => s.trim()).filter(Boolean);
    const negativeMatches = rawExclusions.filter(s => s.startsWith('NEGATIV MATCH:'));
    const strictBlocks = rawExclusions.filter(s => !s.startsWith('NEGATIV MATCH:'));

    const exclusionInstruction = `
      BLOCKERADE FÖRETAG (TOTALFÖRBUD): 
      ${strictBlocks.length > 0 ? strictBlocks.join(', ') : "Inga"}

      ANTI-HALLUCINATION (NEGATIVA MATCHNINGAR):
      Följande kombinationer är FELAKTIGA och får ALDRIG genereras igen:
      ${negativeMatches.map(s => s.replace('NEGATIV MATCH:', '').trim()).join('\n')}
      
      REGEL: Om du hittar ett bolagsnamn som finns i listan ovan, men med ett ANNAT org.nr än det som är blockerat -> Då får du generera det.
    `;

    // Modified Inclusion Instruction to be more forceful
    const inclusionInstruction = formData.includedKeywords 
      ? `\n\nRIKTAD SÖKNING (KRAV): Användaren söker specifikt efter: ${formData.includedKeywords}. \nPrioritera företag som matchar detta.`
      : `\n\nBRANSCH: Ingen specifik inriktning angiven. Sök brett på alla typer av aktiva aktiebolag i regionen.`;
    
    let revenueConstraint = "";
    
    // Check if 'Alla' or specific
    if (formData.financialScope === 'Alla' || !formData.financialScope) {
        revenueConstraint = "STORLEK: Sök BRETT. Inga specifika omsättningskrav, men bolaget måste vara AKTIVT.";
    } else {
        // STRICT REVENUE FILTERS FOR SPECIFIC SEGMENTS
        if (formData.financialScope === 'KAM') {
          revenueConstraint = "MÅLGRUPP (KRAV): Du MÅSTE hitta bolag med omsättning ÖVER 100 000 tkr (Stora bolag).";
        } else if (formData.financialScope === 'FS') {
          revenueConstraint = "MÅLGRUPP (KRAV): Du MÅSTE hitta bolag med omsättning mellan 15 000 tkr och 100 000 tkr (Medelstora).";
        } else if (formData.financialScope === 'TS') {
          revenueConstraint = "MÅLGRUPP (KRAV): Du MÅSTE hitta bolag med omsättning mellan 5 000 tkr och 15 000 tkr (Mindre bolag).";
        } else if (formData.financialScope === 'DM') {
          revenueConstraint = "MÅLGRUPP (KRAV): Du MÅSTE hitta bolag med omsättning under 5 000 tkr (Små bolag).";
        }
    }

    if (isProspectingMode) {
      // --- NEW PROSPECTING MODE (v6.6) ---
      // Fix for QUOTA_EXHAUSTED: Use gemini-2.5-flash (Standard) as primary
      // and implement fallback to Pure LLM (No Search) if that fails.
      systemInstruction = BATCH_PROSPECTING_INSTRUCTION;
      modelName = "gemini-2.5-flash"; 
      currentTemperature = 0.4; 
      
      userPrompt = `
      INPUT DATA: BATCH PROSPEKTERING (IDENTIFIERING)
      ------------------------------------
      Område: ${formData.geoArea}
      Sökord/Bransch (Riktad): ${formData.includedKeywords || "Alla branscher (Sök brett)"}
      Antal att hitta: ${formData.leadCount}

      ${exclusionInstruction}

      INSTRUKTION:
      1. Hitta snabbt ${formData.leadCount} AKTIVA företag i ${formData.geoArea}.
      2. MATCHNING: ${formData.includedKeywords ? `MÅSTE matcha riktad sökning: ${formData.includedKeywords}` : "Sök fritt mot alla branscher"}.
      3. ${revenueConstraint}
      4. MÅSTE exkludera blockerade företag enligt instruktion ovan.
      5. Returnera JSON-lista.
      `;

    } else {
      // --- CLASSIC BATCH (QUICK / DEEP) ---
      systemInstruction = isDeepMode ? DEEP_ANALYSIS_INSTRUCTION : BATCH_SCAN_INSTRUCTION;
      modelName = "gemini-2.5-flash"; // Default to Flash for all batch ops to save quota

      userPrompt = `
      INPUT DATA: DEL 2 (BATCH - ${isDeepMode ? 'DEEP ANALYSIS' : 'QUICK SCAN'})
      ------------------------------------
      Område: ${formData.geoArea}
      Målgrupp/Fraktsegment: ${formData.financialScope}
      Antal nya leads att hitta denna omgång: ${formData.leadCount}
      
      ${inclusionInstruction}
      ${exclusionInstruction}
      ${revenueConstraint}

      INSTRUKTION: 
      1. Hitta snabbt ${formData.leadCount} företag.
      2. Filtrera bransch/logistikbehov enligt Input Data.
      3. **EKONOMI-KRAV:** Sök verifierad omsättning på Allabolag.se för varje bolag.
      4. Kontrollera Aktiv Status vs Konkurs (KRITISKT).
      ${isDeepMode ? '5. UTFÖR FULLSTÄNDIGT SÄKERHETSPROTOKOLL.' : '5. Hitta kontaktperson.'}
      6. Returnera ENDAST JSON-lista.
      `;
    }
  }

  try {
    const requestConfig: any = {
        systemInstruction: systemInstruction,
        temperature: currentTemperature, 
        tools: [{ googleSearch: {} }] 
    };

    let response;
    
    try {
        response = await generateWithRetry(ai, modelName, userPrompt, requestConfig);
    } catch (err: any) {
        // --- SPECIFIC FALLBACK FOR v6.6 BATCH PROSPECTING QUOTA ISSUES ---
        if (isProspectingMode && (err.message.includes('QUOTA') || err.message.includes('429'))) {
             console.warn("v6.6 Quota Hit. Attempting emergency fallback to Flash Lite (No Search).");
             const fallbackConfig = { ...requestConfig };
             // Strip tools to use Pure LLM quota (cheaper/different bucket)
             delete fallbackConfig.tools;
             // Ensure JSON output is requested since tools are gone
             fallbackConfig.responseMimeType = 'application/json';
             
             // Try Flash Lite without tools - different quota bucket, very fast
             response = await generateWithRetry(ai, 'gemini-flash-lite-latest', userPrompt, fallbackConfig);
        } else {
             // Re-throw if not a prospecting quota error
             throw err;
        }
    }

    if (response && response.text) {
      const lowerText = response.text.toLowerCase();
      if (lowerText.includes("hittade inga") || lowerText.includes("no results") || lowerText.includes("inget resultat")) {
        console.warn("AI returned 'No Results' text. Returning empty list.");
        return [];
      }

      const rawData = extractJSON(response.text);
      if (rawData && rawData.length > 0) {
        // Pass grounding metadata if available (for batch searches, it's usually less relevant but good to have)
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        return rawData.map(item => mapAiResponseToLeadData(item, groundingChunks));
      } else if (rawData && rawData.length === 0) {
        return []; 
      }
      
      console.warn("JSON Extraction failed. Raw Text:", response.text);
      throw new Error("Kunde inte tolka datan från AI.");
    }
    return [];

  } catch (error: any) {
    if (error.message.startsWith("QUOTA_GROUNDING:") || error.message === "QUOTA_EXHAUSTED" || error.message === "RATE_LIMIT_HIT") throw error; 
    
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Ett fel uppstod.");
  }
};