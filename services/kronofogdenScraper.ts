/**
 * Kronofogden Scraper
 * Scrapes debt information from Kronofogden.se (public data)
 * Fallback when Kronofogden API is not available
 */

import { scrapeWithFirecrawl } from './firecrawlService';
import { queueRequest } from './requestQueue';

export interface KronofogdenScrapedData {
  orgNumber: string;
  companyName: string;
  hasDebt: boolean;
  totalDebt?: number;
  numberOfCases?: number;
  latestCase?: {
    date: string;
    amount: number;
    status: string;
  };
  paymentRemarks: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Scrape Kronofogden data for a company
 */
export async function scrapeKronofogden(
  companyName: string,
  orgNumber: string
): Promise<KronofogdenScrapedData | null> {
  try {
    console.log('🔍 Scraping Kronofogden for:', companyName, orgNumber);

    const cleanOrg = orgNumber.replace(/[^0-9]/g, '');
    
    // Kronofogden search URL
    const url = `https://kronofogden.se/Sok.html?q=${cleanOrg}`;
    
    console.log('📍 Kronofogden URL:', url);

    // Scrape with Firecrawl
    const scrapedContent = await queueRequest(
      () => scrapeWithFirecrawl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000
      }),
      'firecrawl',
      5,
      2
    );

    if (!scrapedContent?.markdown) {
      console.log('⚠️ No content from Kronofogden');
      return createEmptyResult(orgNumber, companyName);
    }

    console.log('✅ Scraped Kronofogden, parsing data...');

    // Parse the scraped content
    const parsedData = parseKronofogdenContent(
      scrapedContent.markdown,
      companyName,
      orgNumber
    );

    return parsedData;
  } catch (error) {
    console.error('Kronofogden scraping error:', error);
    return createEmptyResult(orgNumber, companyName);
  }
}

/**
 * Parse Kronofogden content to extract debt information
 */
function parseKronofogdenContent(
  content: string,
  companyName: string,
  orgNumber: string
): KronofogdenScrapedData {
  const data: KronofogdenScrapedData = {
    orgNumber,
    companyName,
    hasDebt: false,
    paymentRemarks: false,
    riskLevel: 'low'
  };

  const contentLower = content.toLowerCase();

  // Check if company has any cases
  const noCasesPatterns = [
    /inga träffar/i,
    /inga ärenden/i,
    /inga skulder/i,
    /0 träffar/i,
    /no results/i
  ];

  const hasNoCases = noCasesPatterns.some(pattern => pattern.test(content));

  if (hasNoCases) {
    console.log('✅ No Kronofogden cases found (good!)');
    return data;
  }

  // Look for debt indicators
  const debtIndicators = [
    /skuld/i,
    /betalningsanmärkning/i,
    /utmätning/i,
    /indrivning/i,
    /konkurs/i
  ];

  const hasDebtIndicators = debtIndicators.some(pattern => pattern.test(content));

  if (hasDebtIndicators) {
    data.hasDebt = true;
    data.paymentRemarks = true;
    console.log('⚠️ Debt indicators found');
  }

  // Extract number of cases
  const casesMatch = content.match(/(\d+)\s*(?:ärenden|träffar|cases)/i);
  if (casesMatch) {
    data.numberOfCases = parseInt(casesMatch[1]);
    console.log(`📊 Found ${data.numberOfCases} cases`);
  }

  // Extract total debt amount
  const debtPatterns = [
    /(?:totalt|summa|belopp)[\s:]*(\d[\d\s.,]+)[\s]*(kr|SEK|kronor)/gi,
    /(\d[\d\s.,]+)[\s]*(kr|SEK)[\s]*(?:i skuld|skuld)/gi
  ];

  for (const pattern of debtPatterns) {
    const match = pattern.exec(content);
    if (match) {
      const amount = match[1].replace(/[\s]/g, '').replace(',', '.');
      const numAmount = parseFloat(amount);
      
      if (!isNaN(numAmount) && numAmount > 0) {
        data.totalDebt = numAmount;
        console.log(`💰 Total debt: ${numAmount} SEK`);
        break;
      }
    }
  }

  // Extract latest case information
  const dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    data.latestCase = {
      date: dateMatch[1],
      amount: data.totalDebt || 0,
      status: 'active'
    };
  }

  // Determine risk level
  if (data.numberOfCases && data.numberOfCases > 0) {
    if (data.numberOfCases >= 5 || (data.totalDebt && data.totalDebt > 100000)) {
      data.riskLevel = 'high';
    } else if (data.numberOfCases >= 2 || (data.totalDebt && data.totalDebt > 10000)) {
      data.riskLevel = 'medium';
    } else {
      data.riskLevel = 'low';
    }
  }

  console.log('✅ Kronofogden risk level:', data.riskLevel);

  return data;
}

/**
 * Create empty result when no data found
 */
function createEmptyResult(
  orgNumber: string,
  companyName: string
): KronofogdenScrapedData {
  return {
    orgNumber,
    companyName,
    hasDebt: false,
    paymentRemarks: false,
    riskLevel: 'low'
  };
}

/**
 * Alternative: Use Kreditupplysning.se API (free tier)
 */
export async function fetchFromKreditupplysning(
  orgNumber: string
): Promise<KronofogdenScrapedData | null> {
  try {
    // Note: This is a placeholder for Kreditupplysning.se API
    // You would need to sign up for their API and get a key
    
    const KREDITUPPLYSNING_API_KEY = process.env.KREDITUPPLYSNING_API_KEY;
    
    if (!KREDITUPPLYSNING_API_KEY) {
      console.warn('Kreditupplysning API key not configured');
      return null;
    }

    const response = await fetch(
      `https://api.kreditupplysning.se/v1/company/${orgNumber}/debt`,
      {
        headers: {
          'Authorization': `Bearer ${KREDITUPPLYSNING_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Kreditupplysning API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      orgNumber,
      companyName: data.name || '',
      hasDebt: data.hasDebt || false,
      totalDebt: data.totalDebt || 0,
      numberOfCases: data.numberOfCases || 0,
      paymentRemarks: data.paymentRemarks || false,
      riskLevel: data.riskLevel || 'low',
      latestCase: data.latestCase
    };
  } catch (error) {
    console.error('Kreditupplysning API error:', error);
    return null;
  }
}
