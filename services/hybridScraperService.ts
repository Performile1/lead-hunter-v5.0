/**
 * Hybrid Scraper Service
 * Kombinerar traditionell Puppeteer/Playwright scraping med AI-powered Crawl4AI
 * Användaren kan välja metod i admin-panelen
 */

import puppeteer from 'puppeteer';
// Crawl4AI will be imported dynamically to avoid errors if not installed

interface ScraperConfig {
  method: 'traditional' | 'ai' | 'hybrid';
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
  cacheDuration: number; // hours
  userAgent: string;
  headless: boolean;
}

interface WebsiteAnalysis {
  // E-handel
  ecommerce_platform?: string;
  has_checkout: boolean;
  checkout_providers: string[];
  
  // Transportörer
  shipping_providers: Array<{
    name: string;
    type: 'competitor' | 'dhl' | 'other';
    position_in_checkout?: number;
  }>;
  has_dhl: boolean;
  dhl_position?: number;
  
  // Marknader
  markets: string[];
  international_shipping: boolean;
  
  // Leveransvillkor
  delivery_options: string[];
  free_shipping_threshold?: number;
  standard_shipping_cost?: number;
  
  // Teknologi
  technologies_used: string[];
  
  // Metadata
  scraping_method: 'traditional' | 'ai' | 'hybrid';
  scraped_at: string;
  confidence_score: number;
}

export class HybridScraperService {
  private config: ScraperConfig;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor(config?: Partial<ScraperConfig>) {
    this.config = {
      method: config?.method || 'traditional',
      timeout: config?.timeout || 30000,
      retries: config?.retries || 3,
      cacheEnabled: config?.cacheEnabled !== false,
      cacheDuration: config?.cacheDuration || 24,
      userAgent: config?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      headless: config?.headless !== false
    };
    this.cache = new Map();
  }

  /**
   * Main scraping method - routes to appropriate scraper based on config
   */
  async analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(url);
      if (cached) {
        console.log(`[HybridScraper] Using cached data for ${url}`);
        return cached;
      }
    }

    let result: WebsiteAnalysis;

    switch (this.config.method) {
      case 'ai':
        result = await this.scrapeWithAI(url);
        break;
      case 'hybrid':
        result = await this.scrapeHybrid(url);
        break;
      case 'traditional':
      default:
        result = await this.scrapeTraditional(url);
        break;
    }

    // Cache result
    if (this.config.cacheEnabled) {
      this.saveToCache(url, result);
    }

    return result;
  }

  /**
   * Traditional Puppeteer-based scraping
   */
  private async scrapeTraditional(url: string): Promise<WebsiteAnalysis> {
    console.log(`[Traditional] Scraping ${url}`);
    
    const browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.config.userAgent);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      // Detect e-commerce platform
      const ecommercePlatform = await this.detectEcommercePlatform(page);

      // Find shipping providers
      const shippingProviders = await this.findShippingProviders(page);

      // Detect technologies
      const technologies = await this.detectTechnologies(page);

      // Find markets
      const markets = await this.findMarkets(page);

      // Check for DHL
      const hasDHL = shippingProviders.some(p => 
        p.name.toLowerCase().includes('dhl')
      );
      const dhlPosition = hasDHL 
        ? shippingProviders.findIndex(p => p.name.toLowerCase().includes('dhl')) + 1
        : undefined;

      const result: WebsiteAnalysis = {
        ecommerce_platform: ecommercePlatform,
        has_checkout: true,
        checkout_providers: [],
        shipping_providers: shippingProviders,
        has_dhl: hasDHL,
        dhl_position: dhlPosition,
        markets: markets,
        international_shipping: markets.length > 1,
        delivery_options: shippingProviders.map(p => p.name),
        technologies_used: technologies,
        scraping_method: 'traditional',
        scraped_at: new Date().toISOString(),
        confidence_score: 0.7
      };

      return result;
    } finally {
      await browser.close();
    }
  }

  /**
   * AI-powered scraping with Crawl4AI
   */
  private async scrapeWithAI(url: string): Promise<WebsiteAnalysis> {
    console.log(`[AI] Scraping ${url} with Crawl4AI`);
    
    // TODO: Implement when Crawl4AI is ready
    // const crawler = new Crawl4AI({
    //   llm: 'gpt-4',
    //   timeout: this.config.timeout
    // });

    // const result = await crawler.crawl(url, {
    //   extractionSchema: {
    //     ecommerce_platform: 'string',
    //     shipping_providers: 'array of shipping options',
    //     has_dhl: 'boolean',
    //     markets: 'array of countries',
    //     technologies_used: 'array of technologies'
    //   }
    // });

    // For now, fallback to traditional
    console.log('[AI] Crawl4AI not yet configured, falling back to traditional');
    return this.scrapeTraditional(url);
  }

  /**
   * Hybrid approach - use both methods and combine results
   */
  private async scrapeHybrid(url: string): Promise<WebsiteAnalysis> {
    console.log(`[Hybrid] Scraping ${url} with both methods`);
    
    const [traditional, ai] = await Promise.allSettled([
      this.scrapeTraditional(url),
      this.scrapeWithAI(url)
    ]);

    // Combine results, preferring AI data when available
    const traditionalData = traditional.status === 'fulfilled' ? traditional.value : null;
    const aiData = ai.status === 'fulfilled' ? ai.value : null;

    if (!traditionalData && !aiData) {
      throw new Error('Both scraping methods failed');
    }

    // Merge results
    const result: WebsiteAnalysis = {
      ...(traditionalData || aiData)!,
      scraping_method: 'hybrid',
      confidence_score: aiData ? 0.9 : 0.7
    };

    return result;
  }

  /**
   * Helper: Detect e-commerce platform
   */
  private async detectEcommercePlatform(page: any): Promise<string | undefined> {
    const platform = await page.evaluate(() => {
      // Check for Shopify
      if (window.Shopify || document.querySelector('[data-shopify]')) {
        return 'Shopify';
      }
      // Check for WooCommerce
      if (document.querySelector('.woocommerce')) {
        return 'WooCommerce';
      }
      // Check for Magento
      if (document.querySelector('[data-mage-init]')) {
        return 'Magento';
      }
      // Check for Klarna Checkout
      if (document.querySelector('#klarna-checkout-container')) {
        return 'Klarna Checkout';
      }
      return undefined;
    });

    return platform;
  }

  /**
   * Helper: Find shipping providers
   */
  private async findShippingProviders(page: any): Promise<Array<{ name: string; type: 'competitor' | 'dhl' | 'other'; position_in_checkout?: number }>> {
    const providers = await page.evaluate(() => {
      const shippingElements = Array.from(document.querySelectorAll(
        '[class*="shipping"], [class*="delivery"], [class*="frakt"]'
      ));

      const providerNames = new Set<string>();

      shippingElements.forEach(el => {
        const text = el.textContent || '';
        
        // Common Swedish shipping providers
        if (text.includes('PostNord')) providerNames.add('PostNord');
        if (text.includes('DHL')) providerNames.add('DHL');
        if (text.includes('Instabox')) providerNames.add('Instabox');
        if (text.includes('Budbee')) providerNames.add('Budbee');
        if (text.includes('Bring')) providerNames.add('Bring');
        if (text.includes('DB Schenker')) providerNames.add('DB Schenker');
        if (text.includes('UPS')) providerNames.add('UPS');
        if (text.includes('FedEx')) providerNames.add('FedEx');
      });

      return Array.from(providerNames);
    });

    return providers.map((name, index) => ({
      name,
      type: name.toLowerCase().includes('dhl') ? 'dhl' : 'competitor',
      position_in_checkout: index + 1
    }));
  }

  /**
   * Helper: Detect technologies
   */
  private async detectTechnologies(page: any): Promise<string[]> {
    const technologies = await page.evaluate(() => {
      const techs = new Set<string>();

      // Check for common technologies
      if (window.gtag || window.ga) techs.add('Google Analytics');
      if (window.fbq) techs.add('Facebook Pixel');
      if (document.querySelector('[data-cookiebot]')) techs.add('Cookiebot');
      if (window.Shopify) techs.add('Shopify');
      if (window.jQuery) techs.add('jQuery');

      return Array.from(techs);
    });

    return technologies;
  }

  /**
   * Helper: Find markets
   */
  private async findMarkets(page: any): Promise<string[]> {
    const markets = await page.evaluate(() => {
      const marketElements = Array.from(document.querySelectorAll(
        '[class*="country"], [class*="market"], select[name*="country"]'
      ));

      const countries = new Set<string>();

      marketElements.forEach(el => {
        const text = el.textContent || '';
        
        // Common markets
        if (text.includes('Sverige') || text.includes('Sweden')) countries.add('Sverige');
        if (text.includes('Norge') || text.includes('Norway')) countries.add('Norge');
        if (text.includes('Danmark') || text.includes('Denmark')) countries.add('Danmark');
        if (text.includes('Finland')) countries.add('Finland');
        if (text.includes('Tyskland') || text.includes('Germany')) countries.add('Tyskland');
      });

      return Array.from(countries);
    });

    return markets.length > 0 ? markets : ['Sverige'];
  }

  /**
   * Cache management
   */
  private getFromCache(url: string): WebsiteAnalysis | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    const maxAge = this.config.cacheDuration * 60 * 60 * 1000;

    if (age > maxAge) {
      this.cache.delete(url);
      return null;
    }

    return cached.data;
  }

  private saveToCache(url: string, data: WebsiteAnalysis): void {
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ScraperConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export default HybridScraperService;
