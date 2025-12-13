import OpenAI from 'openai';

const processEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
};

let openaiClient: OpenAI | null = null;

/**
 * OpenAI Service
 * Använder GPT-4o och GPT-4o-mini för högkvalitativ analys
 */

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!processEnv.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY saknas i .env.local");
    }
    openaiClient = new OpenAI({
      apiKey: processEnv.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

/**
 * Analysera med OpenAI GPT-4o-mini (kostnadseffektiv)
 */
export async function analyzeWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini',
  temperature: number = 0.2
): Promise<string> {
  try {
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: temperature,
      response_format: { type: "json_object" }
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    
    if (error.status === 429) {
      throw new Error("OPENAI_QUOTA_EXCEEDED");
    }
    
    throw new Error(`OpenAI failed: ${error.message}`);
  }
}

/**
 * Analysera med web search (kräver Tavily API)
 */
export async function analyzeWithOpenAIAndSearch(
  systemPrompt: string,
  userPrompt: string,
  searchQuery: string
): Promise<string> {
  try {
    // Först: Sök med Tavily
    const searchResults = await searchWithTavily(searchQuery);
    
    // Sedan: Analysera med OpenAI
    const enhancedPrompt = `${userPrompt}\n\nSökresultat:\n${JSON.stringify(searchResults)}`;
    
    return await analyzeWithOpenAI(systemPrompt, enhancedPrompt, 'gpt-4o-mini');
  } catch (error: any) {
    console.error("OpenAI + Search Error:", error);
    throw error;
  }
}

/**
 * Tavily Search API (för web search)
 */
async function searchWithTavily(query: string): Promise<any> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  
  if (!TAVILY_API_KEY) {
    console.warn("TAVILY_API_KEY saknas - skippar web search");
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: 'basic',
        max_results: 5
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Tavily Search Error:", error);
    return [];
  }
}

/**
 * Kontrollera om OpenAI är tillgängligt
 */
export function isOpenAIAvailable(): boolean {
  return !!processEnv.OPENAI_API_KEY;
}

/**
 * Uppskatta kostnad för OpenAI-anrop
 */
export function estimateOpenAICost(tokens: number, model: string): number {
  const costs = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 }
  };

  const cost = costs[model as keyof typeof costs] || costs['gpt-4o-mini'];
  return (tokens / 1_000_000) * cost.output;
}
