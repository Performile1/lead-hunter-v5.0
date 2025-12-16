/**
 * Tandem.ai Service
 * AI collaboration and multi-agent analysis
 */

const TANDEM_AI_API_KEY = import.meta.env.VITE_TANDEM_AI_API_KEY || '';
const TANDEM_AI_BASE_URL = 'https://api.tandem.ai/v1';

interface TandemAiAgent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
}

interface TandemAiTask {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

/**
 * Check if Tandem.ai is available
 */
export function isTandemAiAvailable(): boolean {
  return !!TANDEM_AI_API_KEY;
}

/**
 * Create a collaborative analysis task with multiple AI agents
 */
export async function createCollaborativeAnalysis(
  task: string,
  agents: string[],
  context?: any
): Promise<TandemAiTask> {
  if (!isTandemAiAvailable()) {
    throw new Error('Tandem.ai API key not configured');
  }

  try {
    const response = await fetch(`${TANDEM_AI_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TANDEM_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task,
        agents,
        context
      })
    });

    if (!response.ok) {
      throw new Error(`Tandem.ai API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Tandem.ai task creation error:', error);
    throw error;
  }
}

/**
 * Get task status and results
 */
export async function getTandemAiTaskStatus(taskId: string): Promise<TandemAiTask> {
  if (!isTandemAiAvailable()) {
    throw new Error('Tandem.ai API key not configured');
  }

  try {
    const response = await fetch(`${TANDEM_AI_BASE_URL}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${TANDEM_AI_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Tandem.ai API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Tandem.ai task status error:', error);
    throw error;
  }
}

/**
 * Multi-agent lead analysis
 */
export async function multiAgentLeadAnalysis(
  companyName: string,
  companyData: any
): Promise<any> {
  if (!isTandemAiAvailable()) {
    console.warn('Tandem.ai not configured');
    return null;
  }

  try {
    // Create a collaborative task with multiple specialized agents
    const task = await createCollaborativeAnalysis(
      `Analyze ${companyName} for B2B lead qualification`,
      [
        'financial-analyst',
        'market-researcher',
        'tech-analyst',
        'sales-strategist'
      ],
      {
        company: companyName,
        data: companyData
      }
    );

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const status = await getTandemAiTaskStatus(task.id);

      if (status.status === 'completed') {
        return status.result;
      }

      if (status.status === 'failed') {
        throw new Error('Tandem.ai analysis failed');
      }

      // Wait 3 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }

    throw new Error('Tandem.ai analysis timeout');
  } catch (error) {
    console.error('Multi-agent analysis error:', error);
    return null;
  }
}

/**
 * Get available AI agents
 */
export async function getTandemAiAgents(): Promise<TandemAiAgent[]> {
  if (!isTandemAiAvailable()) {
    return [];
  }

  try {
    const response = await fetch(`${TANDEM_AI_BASE_URL}/agents`, {
      headers: {
        'Authorization': `Bearer ${TANDEM_AI_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Tandem.ai API error: ${response.status}`);
    }

    const data = await response.json();
    return data.agents || [];
  } catch (error) {
    console.error('Tandem.ai agents list error:', error);
    return [];
  }
}

/**
 * Collaborative decision making
 */
export async function collaborativeDecision(
  question: string,
  options: string[],
  context?: any
): Promise<{
  decision: string;
  reasoning: string;
  confidence: number;
}> {
  if (!isTandemAiAvailable()) {
    throw new Error('Tandem.ai not configured');
  }

  try {
    const task = await createCollaborativeAnalysis(
      `Make a decision: ${question}`,
      ['decision-maker', 'analyst', 'strategist'],
      {
        options,
        context
      }
    );

    // Wait for completion
    let attempts = 0;
    while (attempts < 20) {
      const status = await getTandemAiTaskStatus(task.id);

      if (status.status === 'completed') {
        return status.result;
      }

      if (status.status === 'failed') {
        throw new Error('Decision making failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Decision making timeout');
  } catch (error) {
    console.error('Collaborative decision error:', error);
    throw error;
  }
}

/**
 * Synthesize insights from multiple sources
 */
export async function synthesizeInsights(
  sources: Array<{ name: string; data: any }>
): Promise<any> {
  if (!isTandemAiAvailable()) {
    return null;
  }

  try {
    const task = await createCollaborativeAnalysis(
      'Synthesize insights from multiple data sources',
      ['data-analyst', 'insight-generator', 'synthesizer'],
      { sources }
    );

    // Poll for completion
    let attempts = 0;
    while (attempts < 25) {
      const status = await getTandemAiTaskStatus(task.id);

      if (status.status === 'completed') {
        return status.result;
      }

      if (status.status === 'failed') {
        throw new Error('Synthesis failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2500));
      attempts++;
    }

    throw new Error('Synthesis timeout');
  } catch (error) {
    console.error('Insight synthesis error:', error);
    return null;
  }
}
