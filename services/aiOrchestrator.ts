/**
 * AI Services Orchestrator
 * Manages multiple AI services and selects the best one for each task
 */

import { analyzeWithGroq, isGroqAvailable } from './groqService';
import { analyzeWithDeepSeek, isDeepSeekAvailable } from './deepseekService';
import { multiAgentLeadAnalysis, isTandemAiAvailable } from './tandemAiService';
import { scrapeWithFirecrawl, isFirecrawlAvailable } from './firecrawlService';
import { scrapeCompanyWithBrowseAi, isBrowseAiAvailable } from './browseAiService';
import { crawlWithAI, isCrawl4AIAvailable } from './crawl4aiService';
import { indexLead, searchLeads, isAlgoliaAvailable } from './algoliaService';
import { LeadData } from '../types';

export interface AIServiceStatus {
  gemini: boolean;
  groq: boolean;
  deepseek: boolean;
  tandem: boolean;
  firecrawl: boolean;
  browseai: boolean;
  crawl4ai: boolean;
  algolia: boolean;
}

/**
 * Get status of all AI services
 */
export function getAIServiceStatus(): AIServiceStatus {
  return {
    gemini: !!(import.meta.env.VITE_GEMINI_API_KEY),
    groq: isGroqAvailable(),
    deepseek: isDeepSeekAvailable(),
    tandem: isTandemAiAvailable(),
    firecrawl: isFirecrawlAvailable(),
    browseai: isBrowseAiAvailable(),
    crawl4ai: isCrawl4AIAvailable(),
    algolia: isAlgoliaAvailable()
  };
}

/**
 * Select best AI service for analysis based on availability and task type
 */
export async function selectBestAIForAnalysis(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    preferredService?: 'groq' | 'deepseek' | 'gemini';
    temperature?: number;
    requireJSON?: boolean;
  }
): Promise<{ service: string; result: string }> {
  const status = getAIServiceStatus();

  // Try preferred service first
  if (options?.preferredService === 'groq' && status.groq) {
    try {
      const result = await analyzeWithGroq(systemPrompt, userPrompt, options.temperature);
      return { service: 'groq', result };
    } catch (error) {
      console.warn('Groq failed, trying fallback');
    }
  }

  if (options?.preferredService === 'deepseek' && status.deepseek) {
    try {
      const result = await analyzeWithDeepSeek(systemPrompt, userPrompt, {
        temperature: options.temperature
      });
      return { service: 'deepseek', result };
    } catch (error) {
      console.warn('DeepSeek failed, trying fallback');
    }
  }

  // Fallback chain: Groq -> DeepSeek -> Gemini
  if (status.groq) {
    try {
      const result = await analyzeWithGroq(systemPrompt, userPrompt, options?.temperature);
      return { service: 'groq', result };
    } catch (error) {
      console.warn('Groq failed');
    }
  }

  if (status.deepseek) {
    try {
      const result = await analyzeWithDeepSeek(systemPrompt, userPrompt, {
        temperature: options?.temperature
      });
      return { service: 'deepseek', result };
    } catch (error) {
      console.warn('DeepSeek failed');
    }
  }

  throw new Error('No AI services available');
}

/**
 * Select best scraping service for a URL
 */
export async function selectBestScraperForURL(url: string): Promise<{
  service: string;
  data: any;
}> {
  const status = getAIServiceStatus();

  // Priority: Firecrawl -> Octoparse -> Browse.ai -> Crawl4AI
  if (status.firecrawl) {
    try {
      console.log('🔥 Using Firecrawl for scraping');
      const result = await scrapeWithFirecrawl(url, {
        formats: ['markdown'],
        onlyMainContent: true
      });
      
      if (result.success && result.data) {
        return {
          service: 'firecrawl',
          data: {
            content: result.data.markdown,
            metadata: result.data.metadata,
            links: result.data.links
          }
        };
      }
    } catch (error) {
      console.warn('Firecrawl failed, trying fallback');
    }
  }

  if (status.octoparse) {
    try {
      console.log('🐙 Using Octoparse for scraping');
      const result = await scrapeCompanyWithOctoparse(url);
      if (result) {
        return { service: 'octoparse', data: result };
      }
    } catch (error) {
      console.warn('Octoparse failed, trying fallback');
    }
  }

  if (status.browseai) {
    try {
      console.log('🤖 Using Browse.ai for scraping');
      const data = await scrapeCompanyWithBrowseAi(url);
      return { service: 'browseai', data };
    } catch (error) {
      console.warn('Browse.ai failed, trying fallback');
    }
  }

  if (status.crawl4ai) {
    try {
      console.log('🕷️ Using Crawl4AI for scraping');
      const result = await crawlWithAI({ url, timeout: 30000 });
      
      if (result.success && result.data) {
        return {
          service: 'crawl4ai',
          data: {
            content: result.data.markdown,
            metadata: result.data.metadata,
            links: result.data.links
          }
        };
      }
    } catch (error) {
      console.warn('Crawl4AI failed');
    }
  }

  throw new Error('No scraping services available');
}

/**
 * Enhanced lead analysis using multiple AI services
 */
export async function enhancedLeadAnalysis(
  companyName: string,
  websiteUrl: string,
  existingData?: any
): Promise<any> {
  const status = getAIServiceStatus();
  const results: any = {
    companyName,
    websiteUrl,
    services_used: []
  };

  // 1. Scrape website
  try {
    const scrapeResult = await selectBestScraperForURL(websiteUrl);
    results.website_content = scrapeResult.data;
    results.services_used.push(`scraping:${scrapeResult.service}`);
  } catch (error) {
    console.warn('Website scraping failed:', error);
  }

  // 2. Use Tandem.ai for multi-agent analysis if available
  if (status.tandem && results.website_content) {
    try {
      console.log('🤝 Using Tandem.ai for multi-agent analysis');
      const tandemResult = await multiAgentLeadAnalysis(companyName, {
        website: results.website_content,
        existing: existingData
      });
      
      if (tandemResult) {
        results.multi_agent_analysis = tandemResult;
        results.services_used.push('analysis:tandem');
      }
    } catch (error) {
      console.warn('Tandem.ai analysis failed:', error);
    }
  }

  // 3. Use best AI for detailed analysis
  if (results.website_content) {
    try {
      const systemPrompt = `Du är en expert på företagsanalys. Analysera företagsinformation och returnera strukturerad JSON-data.`;
      const userPrompt = `Analysera ${companyName} baserat på följande webbplatsinnehåll:\n\n${results.website_content.content?.substring(0, 3000)}`;
      
      const aiResult = await selectBestAIForAnalysis(systemPrompt, userPrompt, {
        temperature: 0.1,
        requireJSON: true
      });
      
      results.ai_analysis = JSON.parse(aiResult.result);
      results.services_used.push(`analysis:${aiResult.service}`);
    } catch (error) {
      console.warn('AI analysis failed:', error);
    }
  }

  return results;
}

/**
 * Index lead in Algolia if available
 */
export async function indexLeadIfAvailable(lead: LeadData): Promise<void> {
  if (isAlgoliaAvailable()) {
    try {
      await indexLead(lead);
      console.log('✅ Lead indexed in Algolia');
    } catch (error) {
      console.warn('Algolia indexing failed:', error);
    }
  }
}

/**
 * Smart search across all available services
 */
export async function smartSearch(query: string, filters?: any): Promise<any[]> {
  const status = getAIServiceStatus();
  const results: any[] = [];

  // Use Algolia for fast search if available
  if (status.algolia) {
    try {
      const algoliaResults = await searchLeads(query, filters);
      results.push(...algoliaResults.map(r => ({ ...r, source: 'algolia' })));
    } catch (error) {
      console.warn('Algolia search failed:', error);
    }
  }

  // Could add other search sources here

  return results;
}

/**
 * Get recommendations for which services to use
 */
export function getServiceRecommendations(): {
  critical: string[];
  recommended: string[];
  optional: string[];
} {
  const status = getAIServiceStatus();

  return {
    critical: [
      !status.gemini && 'Gemini API (primary AI)',
      !status.groq && 'Groq API (fast fallback)'
    ].filter(Boolean) as string[],
    
    recommended: [
      !status.firecrawl && 'Firecrawl (best web scraping)',
      !status.algolia && 'Algolia (fast search)',
      !status.deepseek && 'DeepSeek (additional AI capacity)'
    ].filter(Boolean) as string[],
    
    optional: [
      !status.tandem && 'Tandem.ai (multi-agent analysis)',
      !status.browseai && 'Browse.ai (automated scraping)',
      !status.crawl4ai && 'Crawl4AI (AI-powered crawling)'
    ].filter(Boolean) as string[]
  };
}

/**
 * Health check for all services
 */
export async function healthCheckAllServices(): Promise<{
  [key: string]: { available: boolean; latency?: number };
}> {
  const status = getAIServiceStatus();
  const health: any = {};

  for (const [service, available] of Object.entries(status)) {
    health[service] = { available };
    
    if (available) {
      // Could add latency checks here
      health[service].latency = 0;
    }
  }

  return health;
}
