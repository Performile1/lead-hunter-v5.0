/**
 * Timeout Handler Service
 * Hanterar timeouts för långsamma API-anrop (checkout, news, LinkedIn)
 */

import { logger } from '../utils/logger.js';

/**
 * Kör funktion med timeout
 */
export async function withTimeout(promise, timeoutMs = 15000, taskName = 'Task') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${taskName} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Kör flera tasks parallellt med individuella timeouts
 */
export async function runTasksWithTimeout(tasks, timeoutMs = 15000) {
  const results = await Promise.allSettled(
    tasks.map(task => 
      withTimeout(task.fn(), timeoutMs, task.name)
        .catch(error => {
          logger.warn(`Task ${task.name} failed:`, error.message);
          return { error: error.message, success: false };
        })
    )
  );

  return results.map((result, index) => ({
    name: tasks[index].name,
    status: result.status,
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}

/**
 * Retry med exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        logger.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Scrapa checkout med timeout och retry
 */
export async function scrapeCheckoutWithTimeout(url, timeoutMs = 15000) {
  try {
    const { detectCheckoutCarriers } = await import('./checkoutDetectionService.js');
    
    const result = await withTimeout(
      detectCheckoutCarriers(url),
      timeoutMs,
      'Checkout scraping'
    );
    
    return result;
  } catch (error) {
    logger.error('Checkout scraping timeout:', error);
    return {
      success: false,
      error: 'Timeout',
      shipping_providers: [],
      has_checkout: false,
      detection_method: 'timeout'
    };
  }
}

/**
 * Sök nyheter med timeout
 */
export async function searchNewsWithTimeout(companyName, timeoutMs = 10000) {
  try {
    const result = await withTimeout(
      searchNews(companyName),
      timeoutMs,
      'News search'
    );
    
    return result;
  } catch (error) {
    logger.error('News search timeout:', error);
    return {
      success: false,
      error: 'Timeout',
      articles: []
    };
  }
}

async function searchNews(companyName) {
  // Implementera nyhetssökning här
  // Använd Google News API eller liknande
  return {
    success: true,
    articles: []
  };
}

/**
 * Sök LinkedIn med timeout
 */
export async function searchLinkedInWithTimeout(companyName, timeoutMs = 10000) {
  try {
    const result = await withTimeout(
      searchLinkedIn(companyName),
      timeoutMs,
      'LinkedIn search'
    );
    
    return result;
  } catch (error) {
    logger.error('LinkedIn search timeout:', error);
    return {
      success: false,
      error: 'Timeout',
      profiles: []
    };
  }
}

async function searchLinkedIn(companyName) {
  // Implementera LinkedIn-sökning här
  return {
    success: true,
    profiles: []
  };
}

/**
 * Kör lead-analys med timeouts för alla steg
 */
export async function analyzeLeadWithTimeouts(lead) {
  logger.info(`🔍 Analyzing lead ${lead.company_name} with timeouts`);

  const tasks = [
    {
      name: 'Checkout scraping',
      fn: () => scrapeCheckoutWithTimeout(lead.domain || lead.website_url, 15000)
    },
    {
      name: 'News search',
      fn: () => searchNewsWithTimeout(lead.company_name, 10000)
    },
    {
      name: 'LinkedIn search',
      fn: () => searchLinkedInWithTimeout(lead.company_name, 10000)
    }
  ];

  const results = await runTasksWithTimeout(tasks, 20000);

  // Sammanställ resultat
  const analysis = {
    checkout: results.find(r => r.name === 'Checkout scraping')?.data || { error: 'Failed' },
    news: results.find(r => r.name === 'News search')?.data || { error: 'Failed' },
    linkedin: results.find(r => r.name === 'LinkedIn search')?.data || { error: 'Failed' },
    completed_at: new Date().toISOString()
  };

  logger.info(`✅ Lead analysis complete for ${lead.company_name}`);
  return analysis;
}

export default {
  withTimeout,
  runTasksWithTimeout,
  retryWithBackoff,
  scrapeCheckoutWithTimeout,
  searchNewsWithTimeout,
  searchLinkedInWithTimeout,
  analyzeLeadWithTimeouts
};
