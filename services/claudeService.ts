import Anthropic from '@anthropic-ai/sdk';

const processEnv = {
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY as string,
};

let claudeClient: Anthropic | null = null;

/**
 * Claude Service (Anthropic)
 * Använder Claude 3.5 Haiku för kostnadseffektiv analys
 * Claude 3.5 Sonnet för djupanalys
 */

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    if (!processEnv.CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY saknas i .env.local");
    }
    claudeClient = new Anthropic({
      apiKey: processEnv.CLAUDE_API_KEY
    });
  }
  return claudeClient;
}

/**
 * Analysera med Claude
 */
export async function analyzeWithClaude(
  systemPrompt: string,
  userPrompt: string,
  model: 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' = 'claude-3-5-haiku-20241022',
  temperature: number = 0.2
): Promise<string> {
  try {
    const claude = getClaudeClient();
    
    const message = await claude.messages.create({
      model: model,
      max_tokens: 8000,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    // Extrahera text från response
    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return "";
  } catch (error: any) {
    console.error("Claude API Error:", error);
    
    if (error.status === 429) {
      throw new Error("CLAUDE_QUOTA_EXCEEDED");
    }
    
    throw new Error(`Claude failed: ${error.message}`);
  }
}

/**
 * Djupanalys med Claude Sonnet (bäst på komplex reasoning)
 */
export async function deepAnalyzeWithClaude(
  systemPrompt: string,
  userPrompt: string,
  context: string[] = []
): Promise<string> {
  try {
    const claude = getClaudeClient();
    
    // Bygg kontext
    let fullPrompt = userPrompt;
    if (context.length > 0) {
      fullPrompt = `Kontext:\n${context.join('\n\n')}\n\nFråga:\n${userPrompt}`;
    }
    
    const message = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16000, // Större för djupanalys
      temperature: 0.1, // Lägre för precision
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: fullPrompt
        }
      ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return "";
  } catch (error: any) {
    console.error("Claude Deep Analysis Error:", error);
    throw error;
  }
}

/**
 * Kontrollera om Claude är tillgängligt
 */
export function isClaudeAvailable(): boolean {
  return !!processEnv.CLAUDE_API_KEY;
}

/**
 * Uppskatta kostnad för Claude-anrop
 */
export function estimateClaudeCost(tokens: number, model: string): number {
  const costs = {
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 }
  };

  const cost = costs[model as keyof typeof costs] || costs['claude-3-5-haiku-20241022'];
  return (tokens / 1_000_000) * cost.output;
}
