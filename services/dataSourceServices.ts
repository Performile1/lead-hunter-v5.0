/**
 * Data Source Services
 * Integration with Swedish business data sources
 */

import { scrapeAllabolag, AllabolagScrapedData } from './allabolagScraper';

// ============= ALLABOLAG =============
export interface AllabolagData {
  orgNumber: string;
  companyName: string;
  revenue: number[];
  employees: number;
  address: string;
  city: string;
  postalCode: string;
  ceo: string;
  boardMembers: string[];
}

export async function fetchFromAllabolag(companyName: string, orgNumber?: string): Promise<AllabolagData | null> {
  try {
    console.log('📊 Fetching from Allabolag:', companyName);
    
    // Use the new scraper
    const scrapedData = await scrapeAllabolag(companyName, orgNumber);
    
    if (!scrapedData) {
      return null;
    }

    // Convert scraped data to AllabolagData format
    return {
      orgNumber: scrapedData.orgNumber,
      companyName: scrapedData.companyName,
      revenue: scrapedData.revenue.map(r => r.amount),
      employees: scrapedData.employees || 0,
      address: scrapedData.address || '',
      city: scrapedData.city || '',
      postalCode: scrapedData.postalCode || '',
      ceo: scrapedData.ceo || '',
      boardMembers: scrapedData.boardMembers || []
    };
  } catch (error) {
    console.error('Allabolag error:', error);
    return null;
  }
}

// ============= RATSIT =============
const RATSIT_API_KEY = import.meta.env.VITE_RATSIT_API_KEY || '';

export interface RatsitData {
  orgNumber: string;
  companyName: string;
  revenue: number[];
  creditRating: string;
  address: string;
  phone: string;
  employees: number;
}

export async function fetchFromRatsit(orgNumber: string): Promise<RatsitData | null> {
  if (!RATSIT_API_KEY) {
    console.warn('Ratsit API key not configured');
    return null;
  }

  try {
    console.log('💳 Fetching from Ratsit API:', orgNumber);
    
    const response = await fetch(`https://api.ratsit.se/v1/company/${orgNumber}`, {
      headers: {
        'Authorization': `Bearer ${RATSIT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ratsit API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      orgNumber: data.organizationNumber,
      companyName: data.name,
      revenue: data.financials?.revenue || [],
      creditRating: data.creditRating,
      address: data.address,
      phone: data.phone,
      employees: data.employees
    };
  } catch (error) {
    console.error('Ratsit error:', error);
    return null;
  }
}

// ============= BOLAGSVERKET =============
export interface BolagsverketData {
  orgNumber: string;
  companyName: string;
  legalForm: string;
  registrationDate: string;
  address: string;
  board: Array<{
    name: string;
    role: string;
  }>;
  status: string;
}

export async function fetchFromBolagsverket(orgNumber: string): Promise<BolagsverketData | null> {
  try {
    console.log('🏛️ Fetching from Bolagsverket:', orgNumber);
    
    // Bolagsverket scraping
    const url = `https://bolagsverket.se/ff/foretagsformer/aktiebolag/arsredovisning/${orgNumber}`;
    
    // TODO: Implement scraping with Firecrawl/Octoparse
    return null;
  } catch (error) {
    console.error('Bolagsverket error:', error);
    return null;
  }
}

// ============= KRONOFOGDEN =============
export interface KronofogdenData {
  orgNumber: string;
  hasDebt: boolean;
  debtAmount?: number;
  cases: Array<{
    caseNumber: string;
    amount: number;
    date: string;
  }>;
}

export async function fetchFromKronofogden(orgNumber: string): Promise<KronofogdenData | null> {
  try {
    console.log('⚖️ Checking Kronofogden:', orgNumber);
    
    // Kronofogden API/scraping
    const url = `https://kronofogden.se/Sok.html?q=${orgNumber}`;
    
    // TODO: Implement scraping
    return null;
  } catch (error) {
    console.error('Kronofogden error:', error);
    return null;
  }
}

// ============= SCB (Statistiska Centralbyrån) =============
export interface SCBData {
  orgNumber: string;
  industry: string;
  industryCode: string;
  employees: number;
  region: string;
}

export async function fetchFromSCB(orgNumber: string): Promise<SCBData | null> {
  try {
    console.log('📈 Fetching from SCB:', orgNumber);
    
    // SCB data scraping
    // TODO: Implement
    return null;
  } catch (error) {
    console.error('SCB error:', error);
    return null;
  }
}

// ============= UC (Upplysningscentralen) =============
export interface UCData {
  orgNumber: string;
  creditRating: string;
  creditScore: number;
  paymentRemarks: boolean;
  riskClass: string;
}

export async function fetchFromUC(orgNumber: string): Promise<UCData | null> {
  try {
    console.log('💰 Fetching credit report from UC:', orgNumber);
    
    // UC API integration
    // TODO: Implement if API key available
    return null;
  } catch (error) {
    console.error('UC error:', error);
    return null;
  }
}

// ============= BUILTWITH =============
const BUILTWITH_API_KEY = import.meta.env.VITE_BUILTWITH_API_KEY || '';

export interface BuiltWithData {
  technologies: Array<{
    name: string;
    category: string;
  }>;
  ecommerce?: string;
  analytics: string[];
  hosting: string;
}

export async function fetchFromBuiltWith(domain: string): Promise<BuiltWithData | null> {
  if (!BUILTWITH_API_KEY) {
    console.warn('BuiltWith API key not configured');
    return null;
  }

  try {
    console.log('🔧 Fetching tech stack from BuiltWith:', domain);
    
    const response = await fetch(
      `https://api.builtwith.com/v20/api.json?KEY=${BUILTWITH_API_KEY}&LOOKUP=${domain}`
    );

    if (!response.ok) {
      throw new Error(`BuiltWith API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      technologies: data.technologies || [],
      ecommerce: data.ecommerce,
      analytics: data.analytics || [],
      hosting: data.hosting
    };
  } catch (error) {
    console.error('BuiltWith error:', error);
    return null;
  }
}

// ============= WAPPALYZER =============
const WAPPALYZER_API_KEY = import.meta.env.VITE_WAPPALYZER_API_KEY || '';

export interface WappalyzerData {
  technologies: Array<{
    name: string;
    categories: string[];
    version?: string;
  }>;
}

export async function fetchFromWappalyzer(url: string): Promise<WappalyzerData | null> {
  if (!WAPPALYZER_API_KEY) {
    console.warn('Wappalyzer API key not configured');
    return null;
  }

  try {
    console.log('🔍 Fetching tech stack from Wappalyzer:', url);
    
    const response = await fetch(
      `https://api.wappalyzer.com/v2/lookup/?urls=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-api-key': WAPPALYZER_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Wappalyzer API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      technologies: data[0]?.technologies || []
    };
  } catch (error) {
    console.error('Wappalyzer error:', error);
    return null;
  }
}

// ============= HUNTER.IO =============
const HUNTER_API_KEY = import.meta.env.VITE_HUNTER_API_KEY || '';

export interface HunterData {
  emails: Array<{
    value: string;
    type: string;
    confidence: number;
    firstName?: string;
    lastName?: string;
    position?: string;
  }>;
  domain: string;
}

export async function fetchFromHunter(domain: string): Promise<HunterData | null> {
  if (!HUNTER_API_KEY) {
    console.warn('Hunter.io API key not configured');
    return null;
  }

  try {
    console.log('📧 Fetching emails from Hunter.io:', domain);
    
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Hunter.io API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      emails: data.data?.emails || [],
      domain: domain
    };
  } catch (error) {
    console.error('Hunter.io error:', error);
    return null;
  }
}

// ============= NEWS API =============
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';

export interface NewsData {
  articles: Array<{
    title: string;
    description: string;
    url: string;
    publishedAt: string;
    source: string;
  }>;
}

export async function fetchCompanyNews(companyName: string): Promise<NewsData | null> {
  if (!NEWS_API_KEY) {
    console.warn('NewsAPI key not configured');
    return null;
  }

  try {
    console.log('📰 Fetching news from NewsAPI:', companyName);
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(companyName)}&language=sv&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    return {
      articles: data.articles?.slice(0, 5) || []
    };
  } catch (error) {
    console.error('NewsAPI error:', error);
    return null;
  }
}

// ============= VALIDATION HELPERS =============

/**
 * Validate org number format (Swedish)
 */
export function validateOrgNumber(orgNumber: string): boolean {
  const cleaned = orgNumber.replace(/[^0-9]/g, '');
  return cleaned.length === 10;
}

/**
 * Validate revenue data (anti-hallucination)
 */
export function validateRevenue(revenue: any): number | null {
  if (typeof revenue === 'number' && revenue > 0 && revenue < 100000000000) {
    return revenue;
  }
  if (typeof revenue === 'string') {
    const parsed = parseInt(revenue.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 100000000000) {
      return parsed;
    }
  }
  return null;
}

/**
 * Validate address format
 */
export function validateAddress(address: string): boolean {
  return address && address.length > 5 && /[0-9]/.test(address);
}
