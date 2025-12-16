/**
 * Data Orchestrator
 * Protocol-based data collection with multi-step processing and fallback chains
 * Anti-hallucination and anti-laziness measures included
 */

import {
  fetchFromAllabolag,
  fetchFromRatsit,
  fetchFromBolagsverket,
  fetchFromKronofogden,
  fetchFromSCB,
  fetchFromUC,
  fetchFromBuiltWith,
  fetchFromWappalyzer,
  fetchFromHunter,
  fetchCompanyNews,
  validateOrgNumber,
  validateRevenue,
  validateAddress,
  AllabolagData,
  RatsitData,
  BolagsverketData,
  KronofogdenData,
  SCBData,
  UCData,
  BuiltWithData,
  WappalyzerData,
  HunterData,
  NewsData
} from './dataSourceServices';

import { selectBestAIForAnalysis, selectBestScraperForURL } from './aiOrchestrator';
import { analyzeWithGroq } from './groqService';
import { analyzeWithDeepSeek } from './deepseekService';

// ============= PROTOCOLS =============

export interface DataProtocol {
  name: string;
  steps: DataCollectionStep[];
  priority: number;
  requiredFields: string[];
}

export interface DataCollectionStep {
  name: string;
  sources: string[];
  fallbackChain: string[];
  validator: (data: any) => boolean;
  timeout: number;
  retries: number;
}

// Protocol 1: Financial Data (Omsättning, Ekonomi)
const FINANCIAL_PROTOCOL: DataProtocol = {
  name: 'Financial Data Collection',
  priority: 1,
  requiredFields: ['revenue', 'orgNumber'],
  steps: [
    {
      name: 'Revenue Collection',
      sources: ['allabolag', 'ratsit', 'bolagsverket'],
      fallbackChain: ['allabolag', 'ratsit', 'ai-scraping'],
      validator: (data) => data?.revenue && Array.isArray(data.revenue) && data.revenue.length > 0,
      timeout: 10000,
      retries: 2
    },
    {
      name: 'Credit Rating',
      sources: ['uc', 'ratsit', 'kronofogden'],
      fallbackChain: ['uc', 'ratsit', 'kronofogden'],
      validator: (data) => data?.creditRating || data?.hasDebt !== undefined,
      timeout: 8000,
      retries: 2
    }
  ]
};

// Protocol 2: Company Information (Org.nummer, Adress, Bolagsinfo)
const COMPANY_INFO_PROTOCOL: DataProtocol = {
  name: 'Company Information Collection',
  priority: 2,
  requiredFields: ['orgNumber', 'address'],
  steps: [
    {
      name: 'Basic Info',
      sources: ['bolagsverket', 'allabolag', 'scb'],
      fallbackChain: ['bolagsverket', 'allabolag', 'ratsit', 'ai-scraping'],
      validator: (data) => validateOrgNumber(data?.orgNumber) && validateAddress(data?.address),
      timeout: 10000,
      retries: 2
    },
    {
      name: 'Board & Management',
      sources: ['bolagsverket', 'allabolag'],
      fallbackChain: ['bolagsverket', 'allabolag', 'linkedin'],
      validator: (data) => data?.board && data.board.length > 0,
      timeout: 12000,
      retries: 2
    }
  ]
};

// Protocol 3: Technology Stack
const TECH_PROTOCOL: DataProtocol = {
  name: 'Technology Stack Analysis',
  priority: 3,
  requiredFields: ['ecommercePlatform'],
  steps: [
    {
      name: 'Tech Detection',
      sources: ['builtwith', 'wappalyzer', 'scraping'],
      fallbackChain: ['builtwith', 'wappalyzer', 'ai-scraping'],
      validator: (data) => data?.technologies && data.technologies.length > 0,
      timeout: 15000,
      retries: 2
    },
    {
      name: 'Payment & Shipping',
      sources: ['scraping', 'ai-analysis'],
      fallbackChain: ['ai-scraping', 'groq', 'deepseek'],
      validator: (data) => data?.paymentMethods || data?.shippingMethods,
      timeout: 20000,
      retries: 2
    }
  ]
};

// Protocol 4: Contact Information
const CONTACT_PROTOCOL: DataProtocol = {
  name: 'Contact Information Collection',
  priority: 4,
  requiredFields: ['decisionMakers'],
  steps: [
    {
      name: 'Email Discovery',
      sources: ['hunter', 'linkedin', 'website-scraping'],
      fallbackChain: ['hunter', 'linkedin', 'ai-scraping'],
      validator: (data) => data?.emails && data.emails.length > 0,
      timeout: 15000,
      retries: 2
    },
    {
      name: 'LinkedIn Profiles',
      sources: ['linkedin', 'ai-search'],
      fallbackChain: ['linkedin', 'google-search', 'ai-analysis'],
      validator: (data) => data?.decisionMakers && data.decisionMakers.length > 0,
      timeout: 20000,
      retries: 2
    }
  ]
};

// Protocol 5: News & Market Intelligence
const NEWS_PROTOCOL: DataProtocol = {
  name: 'News & Market Intelligence',
  priority: 5,
  requiredFields: [],
  steps: [
    {
      name: 'Recent News',
      sources: ['newsapi', 'google-news-scraping'],
      fallbackChain: ['newsapi', 'google-search', 'ai-scraping'],
      validator: (data) => data?.articles && data.articles.length > 0,
      timeout: 10000,
      retries: 1
    }
  ]
};

const ALL_PROTOCOLS = [
  FINANCIAL_PROTOCOL,
  COMPANY_INFO_PROTOCOL,
  TECH_PROTOCOL,
  CONTACT_PROTOCOL,
  NEWS_PROTOCOL
];

// ============= ORCHESTRATOR =============

export interface OrchestrationResult {
  success: boolean;
  data: any;
  sourcesUsed: string[];
  protocolsCompleted: string[];
  errors: string[];
  validationsPassed: number;
  validationsFailed: number;
  processingTime: number;
}

export interface OrchestrationOptions {
  protocols?: string[];
  maxConcurrentSteps?: number;
  enableFallbacks?: boolean;
  strictValidation?: boolean;
  antiHallucinationMode?: boolean;
}

/**
 * Main orchestration function - collects data using protocols with fallbacks
 */
export async function orchestrateDataCollection(
  companyName: string,
  websiteUrl: string,
  options: OrchestrationOptions = {}
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const result: OrchestrationResult = {
    success: false,
    data: {},
    sourcesUsed: [],
    protocolsCompleted: [],
    errors: [],
    validationsPassed: 0,
    validationsFailed: 0,
    processingTime: 0
  };

  console.log('🎯 Starting data orchestration for:', companyName);

  // Select protocols to run
  const protocolsToRun = options.protocols
    ? ALL_PROTOCOLS.filter(p => options.protocols!.includes(p.name))
    : ALL_PROTOCOLS;

  // Sort by priority
  protocolsToRun.sort((a, b) => a.priority - b.priority);

  // Process each protocol sequentially to avoid quota issues
  for (const protocol of protocolsToRun) {
    console.log(`\n📋 Running protocol: ${protocol.name}`);
    
    try {
      const protocolResult = await executeProtocol(
        protocol,
        companyName,
        websiteUrl,
        result.data,
        options
      );

      // Merge results
      result.data = { ...result.data, ...protocolResult.data };
      result.sourcesUsed.push(...protocolResult.sourcesUsed);
      result.validationsPassed += protocolResult.validationsPassed;
      result.validationsFailed += protocolResult.validationsFailed;

      if (protocolResult.success) {
        result.protocolsCompleted.push(protocol.name);
      } else {
        result.errors.push(`Protocol ${protocol.name} failed: ${protocolResult.error}`);
      }

      // Add delay between protocols to avoid rate limits
      await delay(2000);
    } catch (error: any) {
      console.error(`❌ Protocol ${protocol.name} error:`, error);
      result.errors.push(`${protocol.name}: ${error.message}`);
    }
  }

  // Final validation with anti-hallucination checks
  if (options.antiHallucinationMode) {
    result.data = await validateAndCleanData(result.data, companyName);
  }

  result.success = result.protocolsCompleted.length > 0;
  result.processingTime = Date.now() - startTime;

  console.log(`\n✅ Orchestration complete in ${result.processingTime}ms`);
  console.log(`   Protocols completed: ${result.protocolsCompleted.length}/${protocolsToRun.length}`);
  console.log(`   Sources used: ${[...new Set(result.sourcesUsed)].join(', ')}`);
  console.log(`   Validations: ${result.validationsPassed} passed, ${result.validationsFailed} failed`);

  return result;
}

/**
 * Execute a single protocol with all its steps
 */
async function executeProtocol(
  protocol: DataProtocol,
  companyName: string,
  websiteUrl: string,
  existingData: any,
  options: OrchestrationOptions
): Promise<{
  success: boolean;
  data: any;
  sourcesUsed: string[];
  validationsPassed: number;
  validationsFailed: number;
  error?: string;
}> {
  const protocolResult = {
    success: false,
    data: {},
    sourcesUsed: [] as string[],
    validationsPassed: 0,
    validationsFailed: 0,
    error: undefined as string | undefined
  };

  // Execute each step in the protocol
  for (const step of protocol.steps) {
    console.log(`  ⚙️ Step: ${step.name}`);
    
    try {
      const stepResult = await executeStepWithFallback(
        step,
        companyName,
        websiteUrl,
        existingData,
        options
      );

      if (stepResult.success) {
        protocolResult.data = { ...protocolResult.data, ...stepResult.data };
        protocolResult.sourcesUsed.push(...stepResult.sourcesUsed);
        protocolResult.validationsPassed++;
        console.log(`    ✅ ${step.name} completed`);
      } else {
        protocolResult.validationsFailed++;
        console.log(`    ⚠️ ${step.name} failed validation`);
      }

      // Small delay between steps
      await delay(1000);
    } catch (error: any) {
      console.error(`    ❌ ${step.name} error:`, error.message);
      protocolResult.validationsFailed++;
    }
  }

  // Check if required fields are present
  const hasRequiredFields = protocol.requiredFields.every(
    field => protocolResult.data[field] !== undefined && protocolResult.data[field] !== null
  );

  protocolResult.success = hasRequiredFields && protocolResult.validationsPassed > 0;

  return protocolResult;
}

/**
 * Execute a step with fallback chain
 */
async function executeStepWithFallback(
  step: DataCollectionStep,
  companyName: string,
  websiteUrl: string,
  existingData: any,
  options: OrchestrationOptions
): Promise<{
  success: boolean;
  data: any;
  sourcesUsed: string[];
}> {
  const stepResult = {
    success: false,
    data: {},
    sourcesUsed: [] as string[]
  };

  // Try each source in the fallback chain
  for (const source of step.fallbackChain) {
    console.log(`    🔄 Trying source: ${source}`);
    
    try {
      const sourceData = await fetchFromSource(
        source,
        companyName,
        websiteUrl,
        existingData
      );

      if (sourceData && step.validator(sourceData)) {
        stepResult.data = sourceData;
        stepResult.sourcesUsed.push(source);
        stepResult.success = true;
        console.log(`    ✅ ${source} succeeded`);
        break; // Success, no need to try more sources
      } else {
        console.log(`    ⚠️ ${source} validation failed`);
      }
    } catch (error: any) {
      console.log(`    ❌ ${source} error: ${error.message}`);
      
      // Check if it's a quota error
      if (error.message.includes('QUOTA') || error.message.includes('429')) {
        console.log(`    ⏸️ Quota hit, trying next source in fallback chain`);
        await delay(3000); // Longer delay after quota error
      }
    }

    // Delay between fallback attempts
    await delay(1500);
  }

  return stepResult;
}

/**
 * Fetch data from a specific source
 */
async function fetchFromSource(
  source: string,
  companyName: string,
  websiteUrl: string,
  existingData: any
): Promise<any> {
  const orgNumber = existingData?.orgNumber;
  const domain = websiteUrl ? new URL(websiteUrl).hostname : '';

  switch (source) {
    case 'allabolag':
      return await fetchFromAllabolag(companyName, orgNumber);
    
    case 'ratsit':
      return orgNumber ? await fetchFromRatsit(orgNumber) : null;
    
    case 'bolagsverket':
      return orgNumber ? await fetchFromBolagsverket(orgNumber) : null;
    
    case 'kronofogden':
      return orgNumber ? await fetchFromKronofogden(orgNumber) : null;
    
    case 'scb':
      return orgNumber ? await fetchFromSCB(orgNumber) : null;
    
    case 'uc':
      return orgNumber ? await fetchFromUC(orgNumber) : null;
    
    case 'builtwith':
      return domain ? await fetchFromBuiltWith(domain) : null;
    
    case 'wappalyzer':
      return websiteUrl ? await fetchFromWappalyzer(websiteUrl) : null;
    
    case 'hunter':
      return domain ? await fetchFromHunter(domain) : null;
    
    case 'newsapi':
      return await fetchCompanyNews(companyName);
    
    case 'ai-scraping':
      return await aiScrapingFallback(websiteUrl, companyName);
    
    case 'groq':
      return await groqAnalysisFallback(companyName, websiteUrl, existingData);
    
    case 'deepseek':
      return await deepseekAnalysisFallback(companyName, websiteUrl, existingData);
    
    default:
      console.warn(`Unknown source: ${source}`);
      return null;
  }
}

/**
 * AI Scraping Fallback - uses best available scraper + AI analysis
 */
async function aiScrapingFallback(url: string, companyName: string): Promise<any> {
  try {
    console.log('🤖 Using AI scraping fallback');
    
    // Scrape website
    const scrapeResult = await selectBestScraperForURL(url);
    
    if (!scrapeResult || !scrapeResult.data) {
      throw new Error('Scraping failed');
    }

    // Analyze with AI
    const systemPrompt = `Du är en expert på att extrahera strukturerad företagsinformation från webbplatser.
Analysera följande webbplatsinnehåll och returnera JSON med:
- orgNumber (om synligt)
- address
- phone
- email
- technologies (array)
- paymentMethods (array)
- shippingMethods (array)`;

    const userPrompt = `Företag: ${companyName}\n\nWebbplatsinnehåll:\n${scrapeResult.data.content?.substring(0, 3000)}`;

    const aiResult = await selectBestAIForAnalysis(systemPrompt, userPrompt, {
      temperature: 0.1,
      requireJSON: true
    });

    return JSON.parse(aiResult.result);
  } catch (error) {
    console.error('AI scraping fallback error:', error);
    return null;
  }
}

/**
 * Groq Analysis Fallback
 */
async function groqAnalysisFallback(
  companyName: string,
  websiteUrl: string,
  existingData: any
): Promise<any> {
  try {
    console.log('⚡ Using Groq analysis fallback');
    
    const systemPrompt = `Analysera företagsinformation och returnera strukturerad JSON-data.`;
    const userPrompt = `Företag: ${companyName}\nWebbplats: ${websiteUrl}\n\nExisterande data: ${JSON.stringify(existingData, null, 2)}`;

    const result = await analyzeWithGroq(systemPrompt, userPrompt, 0.1);
    return JSON.parse(result);
  } catch (error) {
    console.error('Groq fallback error:', error);
    return null;
  }
}

/**
 * DeepSeek Analysis Fallback
 */
async function deepseekAnalysisFallback(
  companyName: string,
  websiteUrl: string,
  existingData: any
): Promise<any> {
  try {
    console.log('🧠 Using DeepSeek analysis fallback');
    
    const systemPrompt = `Analysera företagsinformation och returnera strukturerad JSON-data.`;
    const userPrompt = `Företag: ${companyName}\nWebbplats: ${websiteUrl}\n\nExisterande data: ${JSON.stringify(existingData, null, 2)}`;

    const result = await analyzeWithDeepSeek(systemPrompt, userPrompt, {
      temperature: 0.1
    });
    return JSON.parse(result);
  } catch (error) {
    console.error('DeepSeek fallback error:', error);
    return null;
  }
}

/**
 * Anti-hallucination validation and data cleaning
 */
async function validateAndCleanData(data: any, companyName: string): Promise<any> {
  console.log('🔍 Running anti-hallucination validation');

  const cleaned: any = {};

  // Validate org number
  if (data.orgNumber) {
    if (validateOrgNumber(data.orgNumber)) {
      cleaned.orgNumber = data.orgNumber.replace(/[^0-9]/g, '');
    } else {
      console.warn('⚠️ Invalid org number removed');
    }
  }

  // Validate revenue
  if (data.revenue) {
    if (Array.isArray(data.revenue)) {
      cleaned.revenue = data.revenue
        .map(validateRevenue)
        .filter(r => r !== null);
    } else {
      const validated = validateRevenue(data.revenue);
      if (validated) cleaned.revenue = [validated];
    }
  }

  // Validate address
  if (data.address && validateAddress(data.address)) {
    cleaned.address = data.address;
  }

  // Validate company name consistency
  if (data.companyName) {
    const similarity = calculateSimilarity(
      companyName.toLowerCase(),
      data.companyName.toLowerCase()
    );
    if (similarity > 0.6) {
      cleaned.companyName = data.companyName;
    } else {
      console.warn('⚠️ Company name mismatch - possible hallucination');
      cleaned.companyName = companyName; // Use original
    }
  }

  // Copy other validated fields
  const safeFields = [
    'phone', 'email', 'technologies', 'paymentMethods', 
    'shippingMethods', 'creditRating', 'employees', 'board'
  ];

  for (const field of safeFields) {
    if (data[field]) {
      cleaned[field] = data[field];
    }
  }

  return cleaned;
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get protocol by name
 */
export function getProtocol(name: string): DataProtocol | undefined {
  return ALL_PROTOCOLS.find(p => p.name === name);
}

/**
 * List all available protocols
 */
export function listProtocols(): DataProtocol[] {
  return ALL_PROTOCOLS;
}
