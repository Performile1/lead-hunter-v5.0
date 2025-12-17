/**
 * AI Service with Automatic Fallback
 * Handles Gemini → Groq → DeepSeek fallback chain
 * Prevents white screen crashes from API failures
 */

import { analyzeWithGroq } from './groqService';

// API Keys
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';

export interface AIAnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
  service: 'gemini' | 'groq' | 'deepseek' | 'none';
  quotaExceeded?: boolean;
}

/**
 * Analyze with automatic fallback
 * Tries Gemini → Groq → DeepSeek in order
 */
export const analyzeWithFallback = async (
  prompt: string,
  systemInstruction?: string,
  options?: {
    preferGroq?: boolean; // For quick scans
    temperature?: number;
  }
): Promise<AIAnalysisResult> => {
  const services = options?.preferGroq 
    ? ['groq', 'gemini', 'deepseek'] 
    : ['gemini', 'groq', 'deepseek'];

  let lastError: string = '';

  for (const service of services) {
    try {
      console.log(`🤖 Trying ${service.toUpperCase()}...`);

      if (service === 'gemini' && GEMINI_API_KEY) {
        const result = await analyzeWithGemini(prompt, systemInstruction, options);
        console.log(`✅ ${service.toUpperCase()} succeeded`);
        return {
          success: true,
          data: result,
          service: 'gemini'
        };
      }

      if (service === 'groq' && GROQ_API_KEY) {
        const result = await analyzeWithGroq(prompt);
        console.log(`✅ ${service.toUpperCase()} succeeded`);
        return {
          success: true,
          data: result,
          service: 'groq'
        };
      }

      if (service === 'deepseek' && DEEPSEEK_API_KEY) {
        const result = await analyzeWithDeepSeek(prompt, systemInstruction);
        console.log(`✅ ${service.toUpperCase()} succeeded`);
        return {
          success: true,
          data: result,
          service: 'deepseek'
        };
      }

    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.warn(`⚠️ ${service.toUpperCase()} failed:`, errorMsg);
      
      lastError = errorMsg;

      // Check if quota exceeded
      if (isQuotaError(errorMsg)) {
        console.warn(`📊 ${service.toUpperCase()} quota exceeded, trying next service...`);
        continue;
      }

      // Check if rate limit
      if (isRateLimitError(errorMsg)) {
        console.warn(`⏱️ ${service.toUpperCase()} rate limited, trying next service...`);
        continue;
      }

      // Other errors - try next service
      continue;
    }
  }

  // All services failed
  console.error('❌ All AI services failed');
  return {
    success: false,
    error: lastError || 'All AI services are unavailable',
    service: 'none',
    quotaExceeded: isQuotaError(lastError)
  };
};

/**
 * Analyze with Gemini (imported to avoid circular dependency)
 */
const analyzeWithGemini = async (
  prompt: string,
  systemInstruction?: string,
  options?: { temperature?: number }
): Promise<any> => {
  // This will be imported from geminiService
  // For now, throw to force fallback during testing
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: options?.temperature || 0.1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    }
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  
  if (!response.text()) {
    throw new Error('Empty response from Gemini');
  }

  return response.text();
};

/**
 * Analyze with DeepSeek
 */
const analyzeWithDeepSeek = async (
  prompt: string,
  systemInstruction?: string
): Promise<any> => {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 8192
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

/**
 * Check if error is quota-related
 */
const isQuotaError = (error: string): boolean => {
  const quotaKeywords = [
    'quota',
    'exceeded',
    'limit',
    'too many requests',
    '429',
    'rate limit'
  ];
  
  return quotaKeywords.some(keyword => 
    error.toLowerCase().includes(keyword)
  );
};

/**
 * Check if error is rate limit
 */
const isRateLimitError = (error: string): boolean => {
  const rateLimitKeywords = [
    'rate limit',
    'too many requests',
    '429',
    'throttled'
  ];
  
  return rateLimitKeywords.some(keyword => 
    error.toLowerCase().includes(keyword)
  );
};

/**
 * Get available AI services
 */
export const getAvailableServices = (): string[] => {
  const services: string[] = [];
  
  if (GEMINI_API_KEY) services.push('Gemini');
  if (GROQ_API_KEY) services.push('Groq');
  if (DEEPSEEK_API_KEY) services.push('DeepSeek');
  
  return services;
};

/**
 * Check if any AI service is available
 */
export const isAnyServiceAvailable = (): boolean => {
  return !!(GEMINI_API_KEY || GROQ_API_KEY || DEEPSEEK_API_KEY);
};
