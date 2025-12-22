import { SearchFormData, LeadData } from "../types";
import { analyzeWithGroq, isGroqAvailable } from "./groqService";
import { checkKronofogden as checkKronofogdenNew, formatKronofogdenResult } from "./kronofogdenService";
import { normalizeOrgNumber, validateOrgNumber } from "./bolagsverketService";
import { analyzeWebsiteTech } from "./techAnalysisService";
import { searchCompanyNews } from "./newsApiService";
import { API_BASE_URL } from "../src/utils/api";
import { scrapeCompanyWebsite, isFirecrawlAvailable } from "./firecrawlService";
import { DEEP_STEP_1_CORE, DEEP_STEP_2_LOGISTICS, DEEP_STEP_3_PEOPLE } from "../prompts/deepAnalysis";
import { mapAiResponseToLeadData, extractJSON, extractGroundingLinks } from "./geminiService";

/**
 * GROQ DEEP ANALYSIS - 100% Groq-baserad djupanalys
 * Använder Llama 3.3 70B för alla 3 steg
 * GRATIS upp till 14,400 requests/dag
 * 10x snabbare än Gemini
 */
export const generateDeepDiveWithGroq = async (
  formData: SearchFormData,
  onPartialUpdate: (lead: LeadData) => void
): Promise<LeadData> => {
  if (!isGroqAvailable()) {
    throw new Error("Groq API Key saknas. Välj ett annat protokoll.");
  }

  console.log(`🚀 GROQ DEEP ANALYSIS - Startar för: ${formData.companyNameOrOrg}`);
  console.log(`   Modell: Llama 3.3 70B Versatile`);
  console.log(`   Kostnad: GRATIS`);

  const delayTime = 2000; // Delay mellan steg

  // --- STEP 1: CORE DATA ---
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

  console.log(`🔍 Steg 1: Groq Core Data Analysis...`);
  
  let step1Text = '';
  try {
    step1Text = await analyzeWithGroq(DEEP_STEP_1_CORE, step1Prompt, 0.1);
    console.log(`✅ Groq Steg 1 lyckades (${step1Text.length} tecken)`);
  } catch (error: any) {
    console.error(`❌ Groq Steg 1 misslyckades:`, error.message);
    throw new Error(`Groq Deep Analysis Steg 1 misslyckades: ${error.message}`);
  }

  const step1Json = extractJSON(step1Text);
  if (!step1Json || step1Json.length === 0) {
    throw new Error("Kunde inte tolka JSON från Groq Steg 1");
  }

  let currentData = mapAiResponseToLeadData(step1Json[0], []);

  // --- VALIDERA ORG.NUMMER ---
  if (!currentData.orgNumber || currentData.orgNumber === "" || currentData.orgNumber === "SAKNAS") {
    console.error(`❌ KRITISKT: Org.nummer saknas för ${currentData.companyName}`);
    currentData.analysisStatus = "INCOMPLETE - Org.nummer saknas";
    currentData.orgNumber = "SAKNAS - Kunde inte hittas";
    return currentData;
  }

  const normalizedOrg = normalizeOrgNumber(currentData.orgNumber);
  if (!normalizedOrg || !validateOrgNumber(normalizedOrg)) {
    console.warn(`⚠️ Ogiltigt org.nummer format: ${currentData.orgNumber}`);
    if (normalizedOrg) {
      currentData.orgNumber = normalizedOrg;
      console.log(`✅ Org.nummer normaliserat till: ${normalizedOrg}`);
    } else {
      currentData.analysisStatus = "INCOMPLETE - Ogiltigt org.nummer";
      return currentData;
    }
  } else {
    currentData.orgNumber = normalizedOrg;
    console.log(`✅ Giltigt org.nummer: ${normalizedOrg}`);
  }

  // --- KRONOFOGDEN CHECK ---
  if (currentData.orgNumber && currentData.orgNumber !== "SAKNAS - Kunde inte hittas") {
    if (validateOrgNumber(currentData.orgNumber)) {
      const kronoRecord = await checkKronofogdenNew(currentData.orgNumber);
      if (kronoRecord) {
        currentData.kronofogdenCheck = formatKronofogdenResult(kronoRecord);
        if (!currentData.legalStatus.toLowerCase().includes('konkurs') && !currentData.legalStatus.toLowerCase().includes('likvidation')) {
          currentData.legalStatus = `VARNING: ${kronoRecord.status}`;
        }
        console.log(`⚠️ Kronofogden hit: ${kronoRecord.status} för ${currentData.companyName}`);
      } else {
        console.log(`✅ Inget ärende hos Kronofogden för ${currentData.companyName}`);
      }
    }
  }

  onPartialUpdate(currentData);
  await new Promise(resolve => setTimeout(resolve, delayTime));

  // --- STEP 2: LOGISTICS & TECH ---
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

    console.log(`🔍 Steg 2: Groq Logistics Analysis...`);
    const step2Text = await analyzeWithGroq(DEEP_STEP_2_LOGISTICS, step2Prompt, 0.4);
    console.log(`✅ Groq Steg 2 lyckades (${step2Text.length} tecken)`);

    const step2Json = extractJSON(step2Text);
    if (step2Json && step2Json.length > 0) {
      const step2Raw = step2Json[0];
      const step2Mapped = mapAiResponseToLeadData(step2Raw, []);

      currentData = {
        ...currentData,
        logisticsProfile: step2Mapped.logisticsProfile || currentData.logisticsProfile,
        ecommercePlatform: (step2Mapped.ecommercePlatform !== "Kunde inte hittas" ? step2Mapped.ecommercePlatform : currentData.ecommercePlatform),
        carriers: step2Mapped.carriers || currentData.carriers,
        usesDhl: step2Mapped.usesDhl || currentData.usesDhl,
        markets: step2Mapped.markets || currentData.markets,
        deliveryServices: (step2Mapped.deliveryServices.length > 0 && step2Mapped.deliveryServices[0] !== "Kunde inte hittas") ? step2Mapped.deliveryServices : currentData.deliveryServices,
        checkoutPosition: (step2Mapped.checkoutPosition !== "Kunde inte hittas" ? step2Mapped.checkoutPosition : currentData.checkoutPosition),
        multiBrands: step2Mapped.multiBrands || currentData.multiBrands,
        liquidity: (step2Mapped.liquidity !== "Kunde inte hittas" ? step2Mapped.liquidity : currentData.liquidity),
        sourceLinks: [...currentData.sourceLinks, ...(step2Mapped.sourceLinks || [])]
      };
    }
  } catch (error: any) {
    console.warn("Groq Step 2 (Logistics) failed:", error);
  }

  onPartialUpdate(currentData);
  await new Promise(resolve => setTimeout(resolve, delayTime));

  // --- STEP 3: PEOPLE & NEWS ---
  try {
    const step3Prompt = `
    KONTEXT (Redan känt):
    Företag: ${currentData.companyName}
    Logistik: ${currentData.logisticsProfile}

    INSTRUKTION: Kör STEG 3 (Människor & Insikter).
    Sök efter Beslutsfattare (Logistikchef, VD), Nyheter och Omdömen.
    Returnera ENDAST JSON med nya fält.
    `;

    console.log(`🔍 Steg 3: Groq People & News Analysis...`);
    const step3Text = await analyzeWithGroq(DEEP_STEP_3_PEOPLE, step3Prompt, 0.2);
    console.log(`✅ Groq Steg 3 lyckades (${step3Text.length} tecken)`);

    const step3Json = extractJSON(step3Text);
    if (step3Json && step3Json.length > 0) {
      const step3Raw = step3Json[0];
      const step3Mapped = mapAiResponseToLeadData(step3Raw, []);

      currentData = {
        ...currentData,
        decisionMakers: step3Mapped.decisionMakers.length > 0 ? step3Mapped.decisionMakers : currentData.decisionMakers,
        recentNews: step3Mapped.recentNews || currentData.recentNews,
        reviews: step3Mapped.reviews || currentData.reviews,
        sourceLinks: [...currentData.sourceLinks, ...(step3Mapped.sourceLinks || [])]
      };
    }
  } catch (error: any) {
    console.warn("Groq Step 3 (People) failed:", error);
  }

  // --- STEP 4: WEBSITE SCRAPING ---
  if (currentData.websiteUrl && currentData.websiteUrl.length > 0) {
    try {
      console.log(`🕷️ Step 4: Website scraping (Firecrawl -> Puppeteer)...`);
      
      let websiteData: any = { shipping_providers: [], shipping_providers_with_position: [] };
      let scrapingSource = 'none';
      
      const techStack = await analyzeWebsiteTech(currentData.websiteUrl).catch(err => {
        console.warn('Tech analysis failed:', err);
        return null;
      });

      // 1. TRY FIRECRAWL FIRST
      if (isFirecrawlAvailable()) {
        console.log('🔥 Trying Firecrawl...');
        try {
          const firecrawlData = await scrapeCompanyWebsite(currentData.websiteUrl);
          const content = firecrawlData.content.toLowerCase();
          const providers = ['dhl', 'postnord', 'bring', 'schenker', 'ups', 'fedex', 'budbee', 'instabox'];
          const foundProviders = providers.filter(p => content.includes(p));
          
          websiteData = {
            shipping_providers: foundProviders,
            shipping_providers_with_position: foundProviders.map((name, index) => ({ name, position: index + 1 })),
            content: firecrawlData.content,
            metadata: firecrawlData.metadata
          };
          scrapingSource = 'firecrawl';
          console.log(`✅ Firecrawl successful: ${foundProviders.length} providers found`);
        } catch (firecrawlErr) {
          console.warn('⚠️ Firecrawl failed:', firecrawlErr);
        }
      }

      // 2. TRY BACKEND PUPPETEER
      if (scrapingSource === 'none') {
        console.log('🎭 Trying Backend Puppeteer...');
        try {
          const scrapingResponse = await fetch(`${API_BASE_URL}/scrape/website`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: currentData.websiteUrl }),
          });
          
          if (scrapingResponse.ok) {
            websiteData = await scrapingResponse.json();
            scrapingSource = 'puppeteer';
            console.log('✅ Backend Puppeteer successful');
          }
        } catch (puppeteerErr) {
          console.warn('⚠️ Puppeteer error:', puppeteerErr);
        }
      }

      console.log(`📊 Scraping completed via: ${scrapingSource}`);

      // Merge scraping data
      if (websiteData.shipping_providers && websiteData.shipping_providers.length > 0) {
        if (websiteData.shipping_providers_with_position && websiteData.shipping_providers_with_position.length > 0) {
          const carriersWithPos = websiteData.shipping_providers_with_position
            .map((c: any) => `${c.position}. ${c.name}`)
            .join(", ");
          currentData.carriers = carriersWithPos;
        } else {
          const scrapedCarriers = websiteData.shipping_providers.join(", ");
          if (!currentData.carriers || currentData.carriers === "Kunde inte hittas") {
            currentData.carriers = scrapedCarriers;
          }
        }
      }

      if (websiteData.ecommerce_platform && websiteData.ecommerce_platform !== "Kunde inte hittas") {
        currentData.ecommercePlatform = websiteData.ecommerce_platform;
      }

      console.log(`✅ Website scraping completed for ${currentData.companyName}`);
      onPartialUpdate(currentData);
      
    } catch (error: any) {
      console.warn(`⚠️ Website scraping failed for ${currentData.websiteUrl}:`, error.message);
    }
  }

  // --- FINALIZE ---
  currentData.analysisDate = new Date().toISOString();
  currentData.analysisStatus = "COMPLETE";
  currentData.analysisProtocol = "groq_deep";
  
  console.log(`✅ GROQ DEEP ANALYSIS COMPLETE för ${currentData.companyName}`);
  
  return currentData;
};

/**
 * GROQ QUICK SCAN - Snabb översikt med Groq
 * Endast Steg 1 (grunddata) för snabb screening
 * GRATIS och EXTREMT SNABB
 */
export const generateQuickScanWithGroq = async (
  formData: SearchFormData,
  onPartialUpdate: (lead: LeadData) => void
): Promise<LeadData> => {
  if (!isGroqAvailable()) {
    throw new Error("Groq API Key saknas. Välj ett annat protokoll.");
  }

  console.log(`⚡ GROQ QUICK SCAN - Startar för: ${formData.companyNameOrOrg}`);
  console.log(`   Modell: Llama 3.3 70B Versatile`);
  console.log(`   Kostnad: GRATIS`);

  const quickPrompt = `
  INPUT: ${formData.companyNameOrOrg}
  INSTRUKTION: Snabb översikt av företaget.
  
  Hämta:
  1. Organisationsnummer (XXXXXX-XXXX)
  2. Omsättning (senaste året)
  3. Adress
  4. Webbplats
  5. Juridisk status
  6. Antal anställda
  
  Returnera ENDAST JSON-objektet. Inga markdown-block.
  `;

  console.log(`🔍 Groq Quick Scan...`);
  
  let quickText = '';
  try {
    quickText = await analyzeWithGroq(DEEP_STEP_1_CORE, quickPrompt, 0.1);
    console.log(`✅ Groq Quick Scan lyckades (${quickText.length} tecken)`);
  } catch (error: any) {
    console.error(`❌ Groq Quick Scan misslyckades:`, error.message);
    throw new Error(`Groq Quick Scan misslyckades: ${error.message}`);
  }

  const quickJson = extractJSON(quickText);
  if (!quickJson || quickJson.length === 0) {
    throw new Error("Kunde inte tolka JSON från Groq Quick Scan");
  }

  let currentData = mapAiResponseToLeadData(quickJson[0], []);

  // Validera org.nummer
  if (currentData.orgNumber && currentData.orgNumber !== "SAKNAS") {
    const normalizedOrg = normalizeOrgNumber(currentData.orgNumber);
    if (normalizedOrg && validateOrgNumber(normalizedOrg)) {
      currentData.orgNumber = normalizedOrg;
    }
  }

  currentData.analysisDate = new Date().toISOString();
  currentData.analysisStatus = "QUICK_SCAN";
  currentData.analysisProtocol = "groq_fast";
  
  console.log(`✅ GROQ QUICK SCAN COMPLETE för ${currentData.companyName}`);
  
  onPartialUpdate(currentData);
  return currentData;
};
