/**
 * Website Scraper Service
 * Scrapa företagshemsidor för logistik-relaterad information
 * Ny strategi: Firecrawl (primär) → Puppeteer (backup) → Gemini (fallback)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { detectCheckoutCarriers } from './checkoutDetectionService.js';

/**
 * Scrapa webbplats för logistik-information
 * @param {string} url - URL till webbplatsen
 * @returns {Promise<Object>} - Scraping-resultat
 */
export async function scrapeWebsite(url) {
  console.log(`🔍 Scraping website: ${url}`);
  
  const analysis = {
    url,
    scraped_at: new Date().toISOString(),
    has_checkout: false,
    checkout_providers: [],
    shipping_providers: [],
    shipping_providers_with_position: [],
    international_shipping: false,
    technologies: [],
    product_categories: [],
    ecommerce_platform: null,
    financial_metrics: null,
    detection_method: null,
    confidence: 'low'
  };

  try {
    // 1. Scrapa med Cheerio (snabbt, statiskt innehåll)
    const staticAnalysis = await scrapeStatic(url);
    Object.assign(analysis, staticAnalysis);

    // 2. Ny checkout detection: Firecrawl → Puppeteer → Gemini (med timeout)
    console.log('🎯 Starting advanced checkout detection...');
    try {
      const checkoutAnalysis = await withTimeout(
        detectCheckoutCarriers(url),
        20000, // 20 sekunder timeout
        'Checkout detection'
      );
      Object.assign(analysis, checkoutAnalysis);
    } catch (error) {
      console.error('Checkout detection timeout:', error);
      analysis.detection_method = 'timeout';
      analysis.confidence = 'low';
      analysis.error = 'Timeout after 20s';
    }

    // 3. Upptäck teknologier
    analysis.technologies = await detectTechnologies(url);

    console.log(`✅ Scraping complete. Method: ${analysis.detection_method}, Confidence: ${analysis.confidence}`);

  } catch (error) {
    console.error('Website scraping failed:', error);
  }

  return analysis;
}

/**
 * Scrapa statiskt innehåll
 */
async function scrapeStatic(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const analysis = {
      shipping_providers: [],
      technologies: [],
      product_categories: []
    };

    // Leta efter transportörer i texten
    const bodyText = $('body').text().toLowerCase();
    const carriers = [
      'dhl', 'postnord', 'bring', 'schenker', 'fedex', 
      'ups', 'budbee', 'instabox', 'best transport'
    ];

    carriers.forEach(carrier => {
      if (bodyText.includes(carrier)) {
        analysis.shipping_providers.push(carrier.toUpperCase());
      }
    });

    // Upptäck e-handelsplattform
    if (bodyText.includes('shopify') || $('script[src*="shopify"]').length > 0) {
      analysis.ecommerce_platform = 'Shopify';
    } else if (bodyText.includes('woocommerce') || $('script[src*="woocommerce"]').length > 0) {
      analysis.ecommerce_platform = 'WooCommerce';
    } else if (bodyText.includes('magento')) {
      analysis.ecommerce_platform = 'Magento';
    }

    // Kolla internationell frakt
    if (bodyText.includes('international shipping') || 
        bodyText.includes('worldwide shipping') ||
        bodyText.includes('global shipping')) {
      analysis.international_shipping = true;
    }

    return analysis;

  } catch (error) {
    console.error('Static scraping failed:', error);
    return {};
  }
}

// Gamla Puppeteer-funktioner har flyttats till checkoutDetectionService.js
// och används nu som backup-metod i den nya strategin

/**
 * Upptäck teknologier
 */
async function detectTechnologies(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const technologies = [];

    // Kolla scripts och meta-tags
    if ($('script[src*="react"]').length > 0 || response.data.includes('react')) {
      technologies.push('React');
    }
    if ($('script[src*="vue"]').length > 0 || response.data.includes('vue')) {
      technologies.push('Vue.js');
    }
    if ($('script[src*="angular"]').length > 0) {
      technologies.push('Angular');
    }
    if ($('script[src*="jquery"]').length > 0) {
      technologies.push('jQuery');
    }
    if (response.data.includes('wp-content') || response.data.includes('wordpress')) {
      technologies.push('WordPress');
    }

    return technologies;

  } catch (error) {
    console.error('Technology detection failed:', error);
    return [];
  }
}

export default {
  scrapeWebsite
};
