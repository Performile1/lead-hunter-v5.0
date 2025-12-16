/**
 * Browse.ai Service
 * Automated web scraping with pre-built robots
 */

const BROWSE_AI_API_KEY = import.meta.env.VITE_BROWSE_AI_API_KEY || '';
const BROWSE_AI_BASE_URL = 'https://api.browse.ai/v2';

interface BrowseAiRobotTask {
  id: string;
  status: 'running' | 'successful' | 'failed';
  capturedData?: any;
}

/**
 * Check if Browse.ai is available
 */
export function isBrowseAiAvailable(): boolean {
  return !!BROWSE_AI_API_KEY;
}

/**
 * Run a Browse.ai robot to scrape a website
 */
export async function runBrowseAiRobot(
  robotId: string,
  inputParameters: Record<string, any>
): Promise<any> {
  if (!isBrowseAiAvailable()) {
    throw new Error('Browse.ai API key not configured');
  }

  try {
    const response = await fetch(`${BROWSE_AI_BASE_URL}/robots/${robotId}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BROWSE_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputParameters })
    });

    if (!response.ok) {
      throw new Error(`Browse.ai API error: ${response.status}`);
    }

    const task: BrowseAiRobotTask = await response.json();
    
    // Poll for completion
    return await pollBrowseAiTask(robotId, task.id);
  } catch (error) {
    console.error('Browse.ai error:', error);
    throw error;
  }
}

/**
 * Poll Browse.ai task until completion
 */
async function pollBrowseAiTask(robotId: string, taskId: string, maxAttempts = 30): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BROWSE_AI_BASE_URL}/robots/${robotId}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${BROWSE_AI_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Browse.ai polling error: ${response.status}`);
      }

      const task: BrowseAiRobotTask = await response.json();

      if (task.status === 'successful') {
        return task.capturedData;
      }

      if (task.status === 'failed') {
        throw new Error('Browse.ai task failed');
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Browse.ai polling error:', error);
      throw error;
    }
  }

  throw new Error('Browse.ai task timeout');
}

/**
 * Scrape company information using Browse.ai
 */
export async function scrapeCompanyWithBrowseAi(companyUrl: string): Promise<{
  contactInfo?: any;
  products?: any[];
  about?: string;
}> {
  if (!isBrowseAiAvailable()) {
    console.warn('Browse.ai not configured');
    return {};
  }

  try {
    // Use a pre-configured robot ID for company scraping
    // This would be set up in Browse.ai dashboard
    const robotId = 'company-scraper-robot-id'; // Replace with actual robot ID
    
    const data = await runBrowseAiRobot(robotId, {
      url: companyUrl
    });

    return {
      contactInfo: data.contactInfo,
      products: data.products,
      about: data.about
    };
  } catch (error) {
    console.error('Browse.ai company scraping error:', error);
    return {};
  }
}

/**
 * Get list of available robots
 */
export async function getBrowseAiRobots(): Promise<any[]> {
  if (!isBrowseAiAvailable()) {
    return [];
  }

  try {
    const response = await fetch(`${BROWSE_AI_BASE_URL}/robots`, {
      headers: {
        'Authorization': `Bearer ${BROWSE_AI_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Browse.ai API error: ${response.status}`);
    }

    const data = await response.json();
    return data.robots || [];
  } catch (error) {
    console.error('Browse.ai robots list error:', error);
    return [];
  }
}
