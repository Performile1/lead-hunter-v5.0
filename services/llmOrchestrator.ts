/**
 * Multi-LLM Orchestrator
 * Smart routing mellan olika LLM-providers baserat på uppgift och tillgänglighet
 */

import { analyzeWithGroq, isGroqAvailable } from './groqService';

export type LLMProvider = 'gemini' | 'groq' | 'openai' | 'claude' | 'ollama';

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  requiresWebSearch?: boolean;
  priority?: 'speed' | 'quality' | 'cost';
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  provider: LLMProvider;
  cost?: number; // Uppskattad kostnad i USD
  duration?: number; // Millisekunder
  tokensUsed?: number;
  cached?: boolean;
}

export interface LLMStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  averageLatency: number;
  providerUsage: Record<LLMProvider, number>;
}

// Global statistik
const stats: LLMStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalCost: 0,
  averageLatency: 0,
  providerUsage: {
    gemini: 0,
    groq: 0,
    openai: 0,
    claude: 0,
    ollama: 0
  }
};

/**
 * Smart LLM Router - väljer bästa modell baserat på uppgift
 */
export async function analyzeSmart(request: LLMRequest): Promise<LLMResponse> {
  const startTime = Date.now();
  stats.totalRequests++;
  
  // Välj provider baserat på krav
  const provider = selectProvider(request);
  
  try {
    let text: string;
    let actualProvider = provider;
    
    switch (provider) {
      case 'groq':
        if (!isGroqAvailable()) {
          console.warn("Groq not available, falling back to Gemini");
          actualProvider = 'gemini';
          text = await analyzeWithGemini(request);
        } else {
          text = await analyzeWithGroq(
            request.systemPrompt,
            request.userPrompt,
            request.temperature || 0.2
          );
        }
        break;
        
      case 'gemini':
      default:
        text = await analyzeWithGemini(request);
        break;
    }
    
    const duration = Date.now() - startTime;
    const cost = estimateCost(actualProvider, text);
    
    // Uppdatera statistik
    stats.successfulRequests++;
    stats.totalCost += cost;
    stats.providerUsage[actualProvider]++;
    stats.averageLatency = (stats.averageLatency * (stats.successfulRequests - 1) + duration) / stats.successfulRequests;
    
    return {
      text,
      provider: actualProvider,
      duration,
      cost,
      tokensUsed: estimateTokens(text)
    };
    
  } catch (error: any) {
    stats.failedRequests++;
    console.error(`${provider} failed:`, error.message);
    
    // Fallback-kedja
    if (provider === 'gemini' && isGroqAvailable()) {
      console.log("Gemini failed, trying Groq fallback...");
      try {
        const text = await analyzeWithGroq(
          request.systemPrompt,
          request.userPrompt,
          request.temperature || 0.2
        );
        
        const duration = Date.now() - startTime;
        stats.successfulRequests++;
        stats.providerUsage.groq++;
        
        return {
          text,
          provider: 'groq',
          duration,
          cost: 0 // Groq är gratis
        };
      } catch (groqError) {
        console.error("Groq fallback also failed:", groqError);
      }
    }
    
    throw error;
  }
}

/**
 * Batch-analys med optimal provider-fördelning
 */
export async function analyzeBatch(
  requests: LLMRequest[],
  maxConcurrent: number = 5
): Promise<LLMResponse[]> {
  const results: LLMResponse[] = [];
  
  // Dela upp i batchar
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(req => analyzeSmart(req))
    );
    results.push(...batchResults);
    
    // Liten paus mellan batchar för att undvika rate limits
    if (i + maxConcurrent < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Väljer bästa provider baserat på krav
 */
function selectProvider(request: LLMRequest): LLMProvider {
  // Om web search krävs -> Gemini (har grounding)
  if (request.requiresWebSearch) {
    return 'gemini';
  }
  
  // Om hastighet prioriteras -> Groq (snabbast)
  if (request.priority === 'speed' && isGroqAvailable()) {
    return 'groq';
  }
  
  // Om kostnad prioriteras -> Groq (gratis)
  if (request.priority === 'cost' && isGroqAvailable()) {
    return 'groq';
  }
  
  // Om kvalitet prioriteras -> Gemini (bra balans)
  if (request.priority === 'quality') {
    return 'gemini';
  }
  
  // Default: Groq om tillgängligt (gratis), annars Gemini
  return isGroqAvailable() ? 'groq' : 'gemini';
}

/**
 * Placeholder för Gemini-analys (använder befintlig geminiService)
 */
async function analyzeWithGemini(request: LLMRequest): Promise<string> {
  // Detta skulle anropa er befintliga generateWithRetry-funktion
  // För nu, kasta ett fel som indikerar att Gemini ska användas
  throw new Error("GEMINI_REQUIRED");
}

/**
 * Uppskattar kostnad baserat på tokens
 */
function estimateCost(provider: LLMProvider, text: string): number {
  const tokens = estimateTokens(text);
  
  switch (provider) {
    case 'groq':
      return 0; // Gratis
    case 'openai':
      return (tokens / 1_000_000) * 0.60; // GPT-4o-mini output
    case 'gemini':
      return (tokens / 1_000_000) * 0.30; // Gemini Flash output
    case 'claude':
      return (tokens / 1_000_000) * 4.00; // Claude Haiku output
    default:
      return 0;
  }
}

/**
 * Uppskattar antal tokens (rough estimate)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Hämtar statistik om LLM-användning
 */
export function getLLMStats(): LLMStats {
  return { ...stats };
}

/**
 * Återställer statistik
 */
export function resetLLMStats(): void {
  stats.totalRequests = 0;
  stats.successfulRequests = 0;
  stats.failedRequests = 0;
  stats.totalCost = 0;
  stats.averageLatency = 0;
  stats.providerUsage = {
    gemini: 0,
    groq: 0,
    openai: 0,
    claude: 0
  };
}

/**
 * Formaterar statistik till läsbar text
 */
export function formatLLMStats(): string {
  const successRate = stats.totalRequests > 0 
    ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)
    : '0';
  
  return `
📊 LLM Statistik:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Totalt requests: ${stats.totalRequests}
Lyckade: ${stats.successfulRequests} (${successRate}%)
Misslyckade: ${stats.failedRequests}
Total kostnad: $${stats.totalCost.toFixed(2)}
Genomsnittlig latency: ${stats.averageLatency.toFixed(0)}ms

Provider-användning:
  • Gemini: ${stats.providerUsage.gemini} (${((stats.providerUsage.gemini / stats.totalRequests) * 100).toFixed(0)}%)
  • Groq: ${stats.providerUsage.groq} (${((stats.providerUsage.groq / stats.totalRequests) * 100).toFixed(0)}%)
  • OpenAI: ${stats.providerUsage.openai} (${((stats.providerUsage.openai / stats.totalRequests) * 100).toFixed(0)}%)
  • Claude: ${stats.providerUsage.claude} (${((stats.providerUsage.claude / stats.totalRequests) * 100).toFixed(0)}%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

/**
 * Rekommenderar bästa provider baserat på historisk prestanda
 */
export function recommendProvider(requiresWebSearch: boolean = false): LLMProvider {
  if (requiresWebSearch) return 'gemini';
  
  // Om Groq har hög success rate och är tillgängligt, rekommendera det
  if (isGroqAvailable() && stats.providerUsage.groq > 0) {
    return 'groq';
  }
  
  return 'gemini';
}
