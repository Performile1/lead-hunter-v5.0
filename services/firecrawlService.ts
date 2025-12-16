/**
 * Firecrawl Service
 * Intelligent web scraping and crawling with AI
 */

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY || '';
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v0';

interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: any;
    links?: string[];
  };
}

interface FirecrawlCrawlResult {
  success: boolean;
  jobId?: string;
  data?: any[];
}

/**
 * Check if Firecrawl is available
 */
export function isFirecrawlAvailable(): boolean {
  return !!FIRECRAWL_API_KEY;
}

/**
 * Scrape a single URL with Firecrawl
 */
export async function scrapeWithFirecrawl(url: string, options?: {
  formats?: ('markdown' | 'html' | 'rawHtml')[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
}): Promise<FirecrawlScrapeResult> {
  if (!isFirecrawlAvailable()) {
    throw new Error('Firecrawl API key not configured');
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats: options?.formats || ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
        includeTags: options?.includeTags,
        excludeTags: options?.excludeTags
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firecrawl scrape error:', error);
    throw error;
  }
}

/**
 * Crawl an entire website with Firecrawl
 */
export async function crawlWithFirecrawl(url: string, options?: {
  maxDepth?: number;
  limit?: number;
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
}): Promise<FirecrawlCrawlResult> {
  if (!isFirecrawlAvailable()) {
    throw new Error('Firecrawl API key not configured');
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        crawlerOptions: {
          maxDepth: options?.maxDepth || 2,
          limit: options?.limit || 10,
          allowBackwardLinks: options?.allowBackwardLinks ?? false,
          allowExternalLinks: options?.allowExternalLinks ?? false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firecrawl crawl error:', error);
    throw error;
  }
}

/**
 * Get crawl job status
 */
export async function getFirecrawlJobStatus(jobId: string): Promise<any> {
  if (!isFirecrawlAvailable()) {
    throw new Error('Firecrawl API key not configured');
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firecrawl job status error:', error);
    throw error;
  }
}

/**
 * Scrape company website for lead analysis
 */
export async function scrapeCompanyWebsite(url: string): Promise<{
  content: string;
  metadata: any;
  links: string[];
}> {
  if (!isFirecrawlAvailable()) {
    console.warn('Firecrawl not configured');
    return { content: '', metadata: {}, links: [] };
  }

  try {
    const result = await scrapeWithFirecrawl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      excludeTags: ['script', 'style', 'nav', 'footer']
    });

    if (!result.success || !result.data) {
      throw new Error('Firecrawl scraping failed');
    }

    return {
      content: result.data.markdown || result.data.html || '',
      metadata: result.data.metadata || {},
      links: result.data.links || []
    };
  } catch (error) {
    console.error('Company website scraping error:', error);
    return { content: '', metadata: {}, links: [] };
  }
}

/**
 * Extract structured data from website using Firecrawl
 */
export async function extractStructuredData(url: string, schema: any): Promise<any> {
  if (!isFirecrawlAvailable()) {
    throw new Error('Firecrawl API key not configured');
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats: ['extract'],
        extract: {
          schema: schema
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data?.extract || {};
  } catch (error) {
    console.error('Firecrawl structured extraction error:', error);
    throw error;
  }
}
