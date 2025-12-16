/**
 * Octoparse Service
 * Cloud-based web scraping with visual workflow builder
 */

const OCTOPARSE_API_KEY = import.meta.env.VITE_OCTOPARSE_API_KEY || '';
const OCTOPARSE_BASE_URL = 'https://api.octoparse.com/v1';

interface OctoparseTask {
  taskId: string;
  taskName: string;
  status: 'Running' | 'Stopped' | 'Completed';
}

interface OctoparseTaskRun {
  taskId: string;
  runId: string;
  status: 'Running' | 'Completed' | 'Failed';
  dataRecordCount: number;
}

/**
 * Check if Octoparse is available
 */
export function isOctoparseAvailable(): boolean {
  return !!OCTOPARSE_API_KEY;
}

/**
 * Get list of tasks
 */
export async function getOctoparseTasks(): Promise<OctoparseTask[]> {
  if (!isOctoparseAvailable()) {
    throw new Error('Octoparse API key not configured');
  }

  try {
    const response = await fetch(`${OCTOPARSE_BASE_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${OCTOPARSE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Octoparse API error: ${response.status}`);
    }

    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error('Octoparse tasks error:', error);
    throw error;
  }
}

/**
 * Start a task
 */
export async function startOctoparseTask(taskId: string): Promise<OctoparseTaskRun> {
  if (!isOctoparseAvailable()) {
    throw new Error('Octoparse API key not configured');
  }

  try {
    const response = await fetch(`${OCTOPARSE_BASE_URL}/tasks/${taskId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OCTOPARSE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Octoparse API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Octoparse start task error:', error);
    throw error;
  }
}

/**
 * Get task run status
 */
export async function getOctoparseTaskStatus(taskId: string, runId: string): Promise<OctoparseTaskRun> {
  if (!isOctoparseAvailable()) {
    throw new Error('Octoparse API key not configured');
  }

  try {
    const response = await fetch(`${OCTOPARSE_BASE_URL}/tasks/${taskId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${OCTOPARSE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Octoparse API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Octoparse status error:', error);
    throw error;
  }
}

/**
 * Get task data
 */
export async function getOctoparseTaskData(taskId: string, options?: {
  offset?: number;
  size?: number;
}): Promise<any[]> {
  if (!isOctoparseAvailable()) {
    throw new Error('Octoparse API key not configured');
  }

  try {
    const params = new URLSearchParams({
      offset: String(options?.offset || 0),
      size: String(options?.size || 100)
    });

    const response = await fetch(`${OCTOPARSE_BASE_URL}/tasks/${taskId}/data?${params}`, {
      headers: {
        'Authorization': `Bearer ${OCTOPARSE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Octoparse API error: ${response.status}`);
    }

    const data = await response.json();
    return data.dataList || [];
  } catch (error) {
    console.error('Octoparse data error:', error);
    throw error;
  }
}

/**
 * Run task and wait for completion
 */
export async function runOctoparseTaskAndWait(
  taskId: string,
  maxWaitTime: number = 300000 // 5 minutes
): Promise<any[]> {
  if (!isOctoparseAvailable()) {
    throw new Error('Octoparse not configured');
  }

  try {
    // Start the task
    const taskRun = await startOctoparseTask(taskId);
    console.log(`🐙 Octoparse task started: ${taskRun.runId}`);

    // Poll for completion
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const status = await getOctoparseTaskStatus(taskId, taskRun.runId);

      if (status.status === 'Completed') {
        console.log(`✅ Octoparse task completed: ${status.dataRecordCount} records`);
        return await getOctoparseTaskData(taskId);
      }

      if (status.status === 'Failed') {
        throw new Error('Octoparse task failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Octoparse task timeout');
  } catch (error) {
    console.error('Octoparse run error:', error);
    throw error;
  }
}

/**
 * Scrape company information using Octoparse
 */
export async function scrapeCompanyWithOctoparse(
  companyUrl: string,
  taskId?: string
): Promise<any> {
  if (!isOctoparseAvailable()) {
    console.warn('Octoparse not configured');
    return null;
  }

  try {
    // If no taskId provided, use default company scraping task
    const defaultTaskId = taskId || 'company-scraper-task-id'; // Replace with actual task ID

    // Note: Octoparse tasks are pre-configured in the Octoparse dashboard
    // This will run the task and return the data
    const data = await runOctoparseTaskAndWait(defaultTaskId);

    return {
      source: 'octoparse',
      url: companyUrl,
      data: data,
      recordCount: data.length
    };
  } catch (error) {
    console.error('Octoparse company scraping error:', error);
    return null;
  }
}

/**
 * Export task data to CSV
 */
export async function exportOctoparseData(
  taskId: string,
  format: 'csv' | 'json' | 'excel' = 'json'
): Promise<Blob> {
  if (!isOctoparseAvailable()) {
    throw new Error('Octoparse not configured');
  }

  try {
    const response = await fetch(`${OCTOPARSE_BASE_URL}/tasks/${taskId}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${OCTOPARSE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Octoparse export error: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Octoparse export error:', error);
    throw error;
  }
}

/**
 * Stop a running task
 */
export async function stopOctoparseTask(taskId: string): Promise<void> {
  if (!isOctoparseAvailable()) {
    throw new Error('Octoparse not configured');
  }

  try {
    const response = await fetch(`${OCTOPARSE_BASE_URL}/tasks/${taskId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OCTOPARSE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Octoparse API error: ${response.status}`);
    }

    console.log(`🛑 Octoparse task stopped: ${taskId}`);
  } catch (error) {
    console.error('Octoparse stop task error:', error);
    throw error;
  }
}

/**
 * Clear task data
 */
export async function clearOctoparseTaskData(taskId: string): Promise<void> {
  if (!isOctoparseAvailable()) {
    throw new Error('Octoparse not configured');
  }

  try {
    const response = await fetch(`${OCTOPARSE_BASE_URL}/tasks/${taskId}/data`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${OCTOPARSE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Octoparse API error: ${response.status}`);
    }

    console.log(`🗑️ Octoparse task data cleared: ${taskId}`);
  } catch (error) {
    console.error('Octoparse clear data error:', error);
    throw error;
  }
}
