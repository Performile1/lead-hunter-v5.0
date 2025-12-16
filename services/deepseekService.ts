/**
 * DeepSeek AI Service
 * Chinese AI model for analysis and reasoning
 */

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Check if DeepSeek is available
 */
export function isDeepSeekAvailable(): boolean {
  return !!DEEPSEEK_API_KEY;
}

/**
 * Analyze with DeepSeek AI
 */
export async function analyzeWithDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  if (!isDeepSeekAvailable()) {
    throw new Error('DeepSeek API key not configured');
  }

  try {
    const messages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options?.model || 'deepseek-chat',
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens || 8000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data: DeepSeekResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('DeepSeek API Error:', error);
    
    // Check for rate limits
    if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
      throw new Error('DEEPSEEK_QUOTA_EXCEEDED');
    }
    
    throw new Error(`DeepSeek failed: ${error.message}`);
  }
}

/**
 * Analyze company data with DeepSeek
 */
export async function analyzeCompanyWithDeepSeek(
  companyName: string,
  websiteContent: string,
  additionalContext?: string
): Promise<any> {
  if (!isDeepSeekAvailable()) {
    console.warn('DeepSeek not configured');
    return null;
  }

  const systemPrompt = `Du är en expert på företagsanalys och B2B lead generation.
Analysera företagsinformation och returnera strukturerad data i JSON-format.

Returnera alltid ett JSON-objekt med följande struktur:
{
  "företagsnamn": "string",
  "bransch": "string",
  "produkter": ["string"],
  "målgrupp": "string",
  "konkurrensfördelar": ["string"],
  "teknologi_stack": ["string"],
  "kontaktinformation": {
    "email": "string",
    "telefon": "string",
    "adress": "string"
  },
  "sociala_medier": {
    "linkedin": "string",
    "facebook": "string",
    "twitter": "string"
  },
  "analys": "string"
}`;

  const userPrompt = `Analysera följande företag:

Företagsnamn: ${companyName}

Webbplatsinnehåll:
${websiteContent.substring(0, 4000)}

${additionalContext ? `Ytterligare kontext:\n${additionalContext}` : ''}

Ge en detaljerad analys av företaget och returnera strukturerad data.`;

  try {
    const result = await analyzeWithDeepSeek(systemPrompt, userPrompt, {
      temperature: 0.1,
      maxTokens: 4000
    });

    return JSON.parse(result);
  } catch (error) {
    console.error('DeepSeek company analysis error:', error);
    return null;
  }
}

/**
 * Batch analyze with DeepSeek
 */
export async function batchAnalyzeWithDeepSeek(
  items: Array<{ system: string; user: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string[]> {
  if (!isDeepSeekAvailable()) {
    throw new Error('DeepSeek not configured');
  }

  const promises = items.map(item =>
    analyzeWithDeepSeek(item.system, item.user, options)
  );

  return await Promise.all(promises);
}

/**
 * Get competitive analysis using DeepSeek
 */
export async function getCompetitiveAnalysis(
  companyName: string,
  competitors: string[]
): Promise<any> {
  if (!isDeepSeekAvailable()) {
    return null;
  }

  const systemPrompt = `Du är en expert på konkurrenanalys.
Analysera företag och deras konkurrenter och returnera strukturerad data i JSON-format.`;

  const userPrompt = `Analysera ${companyName} och dess konkurrenter: ${competitors.join(', ')}.

Returnera en JSON-struktur med:
- Styrkor och svagheter för varje företag
- Marknadsposition
- Differentieringsfaktorer
- Rekommendationer för ${companyName}`;

  try {
    const result = await analyzeWithDeepSeek(systemPrompt, userPrompt, {
      temperature: 0.2,
      maxTokens: 6000
    });

    return JSON.parse(result);
  } catch (error) {
    console.error('DeepSeek competitive analysis error:', error);
    return null;
  }
}
