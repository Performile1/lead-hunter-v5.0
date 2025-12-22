import { SearchFormData, LeadData } from "../types";
import { analyzeWithGroq, isGroqAvailable } from "./groqService";
import { checkKronofogden as checkKronofogdenNew, formatKronofogdenResult } from "./kronofogdenService";
import { normalizeOrgNumber, validateOrgNumber } from "./bolagsverketService";
import { analyzeWebsiteTech } from "./techAnalysisService";
import { searchCompanyNews } from "./newsApiService";
import { analyzeCompetitiveIntelligence } from "./competitiveIntelligenceService";
import { detectTriggers } from "./triggerDetectionService";
import { searchTrustpilot, formatTrustpilotSummary } from "./trustpilotService";
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

  // --- STEP 1: CORE DATA (HYBRID: FIRECRAWL + GEMINI + GROQ) ---
  // STRATEGI:
  // 1. Firecrawl scraping av Allabolag (primär - strukturerad data)
  // 2. Crawl4AI scraping (fallback 1)
  // 3. Gemini med web search (fallback 2 - om scraping misslyckas)
  // 4. Groq analyserar scrapad data (snabb & gratis)
  
  console.log(`🔍 Steg 1: Core Data Analysis (Firecrawl + Groq)...`);
  
  let scrapedData: any = null;
  let step1Text = '';
  
  // --- TRY 1: FIRECRAWL SCRAPING ---
  if (isFirecrawlAvailable()) {
    try {
      console.log(`🔥 Försöker scrapa Allabolag med Firecrawl...`);
      const allabolagUrl = `https://www.allabolag.se/what/${encodeURIComponent(formData.companyNameOrOrg)}`;
      
      const firecrawlResult = await scrapeCompanyWebsite(allabolagUrl);
      
      if (firecrawlResult && firecrawlResult.markdown) {
        scrapedData = firecrawlResult.markdown;
        console.log(`✅ Firecrawl lyckades - ${scrapedData.length} tecken scrapad`);
        
        // Använd Groq för att analysera scrapad data
        const groqPrompt = `
        Analysera följande data från Allabolag och extrahera företagsinformation:
        
        ${scrapedData.substring(0, 4000)}
        
        Hitta och returnera:
        - Organisationsnummer (XXXXXX-XXXX format)
        - Företagsnamn
        - Adress
        - Omsättning (senaste 2 åren)
        - Juridisk status
        - Kreditbetyg
        
        Returnera ENDAST JSON enligt DEEP_STEP_1_CORE format.
        `;
        
        step1Text = await analyzeWithGroq(DEEP_STEP_1_CORE, groqPrompt, 0.1);
        console.log(`✅ Groq analyserade Firecrawl-data (${step1Text.length} tecken)`);
      }
    } catch (firecrawlError: any) {
      console.warn(`⚠️ Firecrawl misslyckades:`, firecrawlError.message);
    }
  }
  
  // --- TRY 2: CRAWL4AI SCRAPING (TODO: Implementera) ---
  if (!scrapedData) {
    console.log(`ℹ️ Crawl4AI inte implementerat ännu, hoppar över...`);
  }
  
  // --- TRY 3: GEMINI WEB SEARCH (FALLBACK) ---
  if (!step1Text) {
    try {
      console.log(`🔍 Fallback till Gemini med Web Search...`);
      
      const { generateWithRetry } = await import('./geminiService');
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!GEMINI_API_KEY) {
        throw new Error("Gemini API Key saknas. Groq Deep Analysis kräver Gemini för Steg 1 (web search).");
      }
      
      const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = "gemini-2.0-flash-exp";
      
      const step1Prompt = `
      INPUT: ${formData.companyNameOrOrg}
      INSTRUKTION: Kör STEG 1 (Core Data) enligt DEEP DIVE protokoll.
      
      VIKTIGT: 
      1. Använd Google Search för att hitta organisationsnummer (XXXXXX-XXXX) på Allabolag eller Ratsit.
      2. Du måste verifiera att organisationsnumret tillhör just "${formData.companyNameOrOrg}".
      3. KORSREFERENS (STRIKT): Om du hittar ett org.nr, bekräfta att det står bredvid texten "${formData.companyNameOrOrg}" i sökresultaten. 
      4. Om du hittar en träff på ett annat bolagsnamn (t.ex. moderbolag eller liknande namn), och inte exakt "${formData.companyNameOrOrg}", IGNORERA DET eller returnera tomt Org.nr.
      5. Returnera ENDAST JSON-objektet. Inga markdown-block (\`\`\`).
      `;
      
      const response = await generateWithRetry(ai, model, step1Prompt, {
        systemInstruction: DEEP_STEP_1_CORE,
        tools: [{ googleSearch: {} }], // Web search för org.nummer
        temperature: 0.1
      });
      
      step1Text = typeof response.text === 'function' ? response.text() : response.text;
      console.log(`✅ Gemini Steg 1 lyckades (${step1Text.length} tecken)`);
    } catch (error: any) {
      console.error(`❌ Gemini Steg 1 misslyckades:`, error.message);
      throw new Error(`Groq Deep Analysis Steg 1 misslyckades: ${error.message}`);
    }
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

  // --- STEP 3: PEOPLE & NEWS (med focusRole1, focusRole2, focusRole3) ---
  try {
    // Använd focusRole1, focusRole2, focusRole3 från formData
    const roles = [
      formData.focusRole1 || 'Logistikchef',
      formData.focusRole2 || 'VD',
      formData.focusRole3 || 'Ekonomichef'
    ].filter(r => r && r.trim().length > 0);

    const step3Prompt = `
    KONTEXT (Redan känt):
    Företag: ${currentData.companyName}
    Logistik: ${currentData.logisticsProfile}

    INSTRUKTION: Kör STEG 3 (Människor & Insikter).
    
    SÖK EFTER DESSA ROLLER (PRIORITETSORDNING):
    1. ${roles[0]}
    2. ${roles[1]}
    3. ${roles[2]}
    
    Hitta beslutsfattare för varje roll via LinkedIn-sökning.
    Sök också efter Nyheter och Omdömen om företaget.
    Returnera ENDAST JSON med nya fält.
    `;

    console.log(`🔍 Steg 3: Groq People & News Analysis...`);
    console.log(`   Söker roller: ${roles.join(', ')}`);
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

  // --- STEP 5: AI & SÄLJANALYS (COMPETITIVE INTELLIGENCE) ---
  if (currentData.websiteAnalysis) {
    try {
      console.log(`🎯 Analyzing competitive intelligence for ${currentData.companyName}`);
      
      const competitiveIntel = analyzeCompetitiveIntelligence(
        currentData.websiteAnalysis as any,
        currentData
      );
      
      currentData.competitiveIntelligence = competitiveIntel as any;
      currentData.opportunityScore = competitiveIntel.opportunity_score;
      currentData.salesPitch = competitiveIntel.sales_pitch;
      
      console.log(`✅ Competitive Intelligence: Score ${competitiveIntel.opportunity_score}/100`);
    } catch (error: any) {
      console.warn(`⚠️ Competitive Intelligence failed:`, error.message);
    }
  }

  // --- STEP 6: NEWS & TRIGGERS ---
  try {
    console.log(`📰 Fetching news for ${currentData.companyName}`);
    
    // Try NewsAPI first
    let newsArticles: any[] = [];
    try {
      newsArticles = await searchCompanyNews(currentData.companyName);
      if (newsArticles && newsArticles.length > 0) {
        console.log(`✅ NewsAPI: Found ${newsArticles.length} articles`);
      } else {
        throw new Error('No articles from NewsAPI');
      }
    } catch (newsError) {
      console.warn(`⚠️ NewsAPI failed, trying fallback sources...`);
      
      // FALLBACK: Scrape Swedish business news sites
      const newsSources = [
        { name: 'Market.se', url: `https://www.market.se/sok?q=${encodeURIComponent(currentData.companyName)}` },
        { name: 'Breakit.se', url: `https://www.breakit.se/sok?q=${encodeURIComponent(currentData.companyName)}` },
        { name: 'ehandel.se', url: `https://www.ehandel.se/?s=${encodeURIComponent(currentData.companyName)}` }
      ];
      
      for (const source of newsSources) {
        try {
          console.log(`🔍 Trying ${source.name}...`);
          
          // Use Groq to search and extract news from the source
          const newsPrompt = `
          Sök efter nyheter om företaget "${currentData.companyName}" från ${source.name}.
          
          Returnera JSON med följande struktur:
          {
            "articles": [
              {
                "title": "Rubrik",
                "description": "Kort beskrivning",
                "url": "${source.url}",
                "publishedAt": "2024-01-01",
                "source": "${source.name}"
              }
            ]
          }
          
          Om du inte hittar några nyheter, returnera tom array.
          `;
          
          const newsResponse = await analyzeWithGroq(
            "Du är en nyhetsanalytiker som söker efter företagsnyheter.",
            newsPrompt,
            0.3
          );
          
          const newsJson = extractJSON(newsResponse);
          if (newsJson && newsJson[0]?.articles?.length > 0) {
            newsArticles = newsJson[0].articles;
            console.log(`✅ ${source.name}: Found ${newsArticles.length} articles`);
            break; // Stop after first successful source
          }
        } catch (sourceError) {
          console.warn(`⚠️ ${source.name} failed:`, sourceError);
        }
      }
    }
    
    // Process news articles
    if (newsArticles && newsArticles.length > 0) {
      currentData.recentNews = newsArticles.slice(0, 5).map((article: any) => ({
        title: article.title || '',
        url: article.url || '',
        date: article.publishedAt || new Date().toISOString(),
        source: article.source?.name || article.source || 'Unknown'
      }));
      
      // Detect triggers from news
      const triggers = detectTriggers(currentData, newsArticles);
      currentData.triggers = triggers;
      
      console.log(`✅ News processed: ${currentData.recentNews.length} articles, ${triggers.length} triggers`);
    } else {
      console.log(`ℹ️ No news found for ${currentData.companyName}`);
    }
  } catch (error: any) {
    console.warn(`⚠️ News & Triggers failed:`, error.message);
  }

  // --- STEP 7: TRUSTPILOT REVIEWS (FOKUS PÅ LEVERANS) ---
  try {
    console.log(`⭐ Searching Trustpilot for ${currentData.companyName}`);
    
    const trustpilotData = await searchTrustpilot(currentData.companyName);
    
    if (trustpilotData) {
      // Spara Trustpilot-data i currentData
      currentData.trustpilotRating = trustpilotData.overallRating;
      currentData.trustpilotReviews = trustpilotData.totalReviews;
      currentData.trustpilotUrl = trustpilotData.url;
      
      // Lägg till leveransomdömen i reviews
      if (trustpilotData.deliveryReviews.length > 0) {
        const deliverySummary = formatTrustpilotSummary(trustpilotData);
        console.log(`✅ Trustpilot: ${trustpilotData.deliveryReviews.length} leveransomdömen`);
        console.log(`   Sentiment: ${trustpilotData.deliverySentiment}`);
        
        // Lägg till i recentNews för att visa i UI
        currentData.recentNews = currentData.recentNews || [];
        currentData.recentNews.push({
          title: `Trustpilot: ${trustpilotData.deliveryReviews.length} leveransomdömen (${trustpilotData.deliverySentiment})`,
          url: trustpilotData.url,
          date: new Date().toISOString(),
          source: 'Trustpilot'
        });
      } else {
        console.log(`ℹ️ Trustpilot: ${trustpilotData.totalReviews} omdömen, men inga om leverans`);
      }
    } else {
      console.log(`ℹ️ No Trustpilot data found for ${currentData.companyName}`);
    }
  } catch (error: any) {
    console.warn(`⚠️ Trustpilot search failed:`, error.message);
  }

  // --- FINALIZE ---
  currentData.analysisDate = new Date().toISOString();
  currentData.analysisStatus = "COMPLETE";
  currentData.analysisProtocol = "groq_deep";
  
  console.log(`✅ GROQ DEEP ANALYSIS COMPLETE för ${currentData.companyName}`);
  console.log(`   - Competitive Intelligence: ${currentData.opportunityScore || 0}/100`);
  console.log(`   - News Articles: ${currentData.recentNews?.length || 0}`);
  console.log(`   - Triggers: ${currentData.triggers?.length || 0}`);
  
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
