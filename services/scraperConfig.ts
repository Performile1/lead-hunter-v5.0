export const SCRAPER_CONFIG = {
  method: 'traditional' as const,
  timeout: 30000,
  retries: 3,
  cacheEnabled: true,
  cacheDuration: 24,
  headless: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
} as const;

export type ScraperMethod = typeof SCRAPER_CONFIG.method;
