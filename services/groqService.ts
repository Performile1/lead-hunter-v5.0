import Groq from "groq-sdk";

// API key from environment variables variables
const GROQ_API_KEY = ieport.meta.env.VITE_taOv_A_KEY || '

let groqClient: Groq | null = null;

/**
 * Initierar Groq-klienten (lazy loading)
 */
function getGroqClient(): Groq {
  if (!groqClient) {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY saknas");
    }
    groqClient = new Groq({
      apiKey: GROQ_API_KEY,
      dangerouslyAllowBrowser: true // Allow browser usage
    });
  }
  return groqClient;
}

/**
 * Använder Groq (Llama 3.1 70B) för snabb analys
 * GRATIS upp till 14,400 requests/dag
 * Hastighet: 500+ tokens/sekund
 */
export async function analyzeWithGroq(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.2
): Promise<string> {
  try {
    const groq = getGroqClient();
    
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
      model: "llama-3.1-70b-versatile", // Snabbaste och bästa gratis modellen
      temperature: temperature,
      max_tokens: 8000,
      response_format: { type: "json_object" } // Tvingar JSON-output
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("Groq API Error:", error);
    
    // Om Groq också har kvotproblem, kasta specifikt fel
    if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
      throw new Error("GROQ_QUOTA_EXCEEDED");
    }
    
    throw new Error(`Groq failed: ${error.message}`);
  }
}

/**
 * Batch-analys med Groq (extremt snabb - 500+ tokens/sekund)
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

/**
 * Kontrollerar om Groq är tillgängligt
 */
export function isGroqAvailable(): boolean {
  return !!GROQ_API_KEY;
}
