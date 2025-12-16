/**
 * Crawl4AI Service
 * AI-powered web crawling with LLM integration
 */

const CRAWL4AI_ENABLED = import.meta.env.VITE_CRAWL4AI_ENABLED === 'true';

interface Crawl4AIOptions {
  url: string;
  extractSchema?: any;
  waitFor?: string;
  timeout?: number;
  userAgent?: string;
}

interface Crawl4AIResult {
  success: boolean;
  data?: {
    content: string;
    markdown: string;
    html: string;
    metadata: any;
    links: string[];
    extractedData?: any;
  };
  error?: string;
}

/**
 * Check if Crawl4AI is available
 */
export function isCrawl4AIAvailable(): boolean {
  return CRAWL4AI_ENABLED;
}

/**
 * Crawl a website with AI-powered extraction
 */
export async function crawlWithAI(options: Crawl4AIOptions): Promise<Crawl4AIResult> {
  if (!isCrawl4AIAvailable()) {
    console.warn('Crawl4AI not enabled');
    return {
      success: false,
      error: 'Crawl4AI not enabled'
    };
  }

  try {
    // Note: Crawl4AI is typically used server-side with Python
    // This is a placeholder for the actual implementation
    // In production, this would call a backend endpoint that uses Crawl4AI
    
    const response = await fetch('/api/crawl4ai/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Crawl4AI API error: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('Crawl4AI error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract structured data from a website using AI
 */
export async function extractStructuredDataWithAI(
  url: string,
  schema: any
): Promise<any> {
  if (!isCrawl4AIAvailable()) {
    console.warn('Crawl4AI not enabled');
    return null;
  }

  try {
    const result = await crawlWithAI({
      url,
      extractSchema: schema,
      timeout: 30000
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Extraction failed');
    }

    return result.data.extractedData;
  } catch (error) {
    console.error('Structured data extraction error:', error);
    return null;
  }
}

/**
 * Crawl company website for lead information
 */
export async function crawlCompanyWebsite(url: string): Promise<{
  content: string;
  metadata: any;
  links: string[];
  contactInfo?: any;
}> {
  if (!isCrawl4AIAvailable()) {
    console.warn('Crawl4AI not enabled');
    return {
      content: '',
      metadata: {},
      links: []
    };
  }

  try {
    const schema = {
      contactInfo: {
        email: 'string',
        phone: 'string',
        address: 'string'
      },
      about: 'string',
      products: ['string'],
      services: ['string']
    };

    const result = await crawlWithAI({
      url,
      extractSchema: schema,
      timeout: 30000
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Crawling failed');
    }

    return {
      content: result.data.markdown || result.data.content || '',
      metadata: result.data.metadata || {},
      links: result.data.links || [],
      contactInfo: result.data.extractedData?.contactInfo
    };
  } catch (error) {
    console.error('Company website crawling error:', error);
    return {
      content: '',
      metadata: {},
      links: []
    };
  }
}

/**
 * Batch crawl multiple URLs
 */
export async function batchCrawl(urls: string[]): Promise<Crawl4AIResult[]> {
  if (!isCrawl4AIAvailable()) {
    return urls.map(() => ({
      success: false,
      error: 'Crawl4AI not enabled'
    }));
  }

  const promises = urls.map(url =>
    crawlWithAI({ url, timeout: 20000 })
  );

  return await Promise.all(promises);
}

/**
 * Smart crawl with automatic schema detection
 */
export async function smartCrawl(url: string): Promise<any> {
  if (!isCrawl4AIAvailable()) {
    return null;
  }

  try {
    // Let AI determine the best extraction strategy
    const result = await crawlWithAI({
      url,
      timeout: 30000
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Smart crawl failed');
    }

    return {
      content: result.data.markdown,
      metadata: result.data.metadata,
      links: result.data.links,
      analysis: result.data.extractedData
    };
  } catch (error) {
    console.error('Smart crawl error:', error);
    return null;
  }
}
