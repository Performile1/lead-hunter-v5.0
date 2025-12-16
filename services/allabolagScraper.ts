/**
 * Allabolag Scraper
 * Scrapes company data from Allabolag.se including revenue and org number
 */

import { scrapeWithFirecrawl } from './firecrawlService';
import { scrapeWithOctoparse } from './octoparseService';

export interface AllabolagScrapedData {
  orgNumber: string;
  companyName: string;
  revenue: Array<{
    year: string;
    amount: number;
  }>;
  employees: number;
  address: string;
  city: string;
  postalCode: string;
  ceo: string;
  boardMembers: string[];
  foundedYear?: string;
  legalForm?: string;
}

/**
 * Scrape Allabolag using best available scraper
 */
export async function scrapeAllabolag(
  companyName: string,
  orgNumber?: string
): Promise<AllabolagScrapedData | null> {
  try {
    console.log('🔍 Scraping Allabolag for:', companyName);

    // Build URL - prefer org number if available
    let url: string;
    if (orgNumber) {
      const cleanOrg = orgNumber.replace(/[^0-9]/g, '');
      url = `https://www.allabolag.se/${cleanOrg}`;
    } else {
      url = `https://www.allabolag.se/what/${encodeURIComponent(companyName)}`;
    }

    console.log('📍 URL:', url);

    // Try Firecrawl first (best quality)
    let scrapedContent: string | null = null;
    let scrapeMethod = '';

    try {
      const firecrawlResult = await scrapeWithFirecrawl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000
      });

      if (firecrawlResult?.markdown) {
        scrapedContent = firecrawlResult.markdown;
        scrapeMethod = 'Firecrawl';
      }
    } catch (error) {
      console.log('⚠️ Firecrawl failed, trying Octoparse...');
    }

    // Fallback to Octoparse
    if (!scrapedContent) {
      try {
        const octoparseResult = await scrapeWithOctoparse(url);
        if (octoparseResult?.data) {
          scrapedContent = JSON.stringify(octoparseResult.data);
          scrapeMethod = 'Octoparse';
        }
      } catch (error) {
        console.log('⚠️ Octoparse failed');
      }
    }

    if (!scrapedContent) {
      console.error('❌ All scraping methods failed');
      return null;
    }

    console.log(`✅ Scraped with ${scrapeMethod}, parsing data...`);

    // Parse the scraped content
    const parsedData = parseAllabolagContent(scrapedContent, companyName);

    return parsedData;
  } catch (error) {
    console.error('Allabolag scraping error:', error);
    return null;
  }
}

/**
 * Parse Allabolag content to extract structured data
 */
function parseAllabolagContent(
  content: string,
  companyName: string
): AllabolagScrapedData | null {
  try {
    const data: Partial<AllabolagScrapedData> = {
      companyName: companyName,
      revenue: [],
      boardMembers: []
    };

    // Extract org number (10 digits, often formatted as XXXXXX-XXXX)
    const orgMatch = content.match(/\b(\d{6}[-\s]?\d{4})\b/);
    if (orgMatch) {
      data.orgNumber = orgMatch[1].replace(/[-\s]/g, '');
    }

    // Extract revenue data (look for patterns like "Omsättning" followed by numbers)
    // Common patterns: "Omsättning 2023: 15 000 000 kr" or "15 MSEK"
    const revenuePatterns = [
      /(?:Omsättning|Nettoomsättning)[\s:]*(\d{4})[\s:]*(\d[\d\s.,]+)[\s]*(tkr|MSEK|KSEK|kr)?/gi,
      /(\d{4})[\s]*[-–][\s]*Omsättning[\s:]*(\d[\d\s.,]+)[\s]*(tkr|MSEK|KSEK|kr)?/gi,
      /(\d{4})[\s]*\|[\s]*(\d[\d\s.,]+)[\s]*(tkr|MSEK|KSEK|kr)?/gi
    ];

    const revenueData: Array<{ year: string; amount: number }> = [];
    
    for (const pattern of revenuePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const year = match[1];
        let amount = match[2].replace(/[\s]/g, '').replace(',', '.');
        const unit = match[3]?.toLowerCase() || 'kr';

        let numAmount = parseFloat(amount);
        
        // Convert to SEK
        if (unit.includes('msek')) {
          numAmount = numAmount * 1000000;
        } else if (unit.includes('ksek') || unit.includes('tkr')) {
          numAmount = numAmount * 1000;
        }

        if (!isNaN(numAmount) && numAmount > 0) {
          revenueData.push({ year, amount: numAmount });
        }
      }
    }

    // Sort by year descending and take last 2-3 years
    data.revenue = revenueData
      .sort((a, b) => parseInt(b.year) - parseInt(a.year))
      .slice(0, 3);

    // Extract employees
    const employeeMatch = content.match(/(?:Anställda|Antal anställda)[\s:]*(\d+)/i);
    if (employeeMatch) {
      data.employees = parseInt(employeeMatch[1]);
    }

    // Extract address
    const addressMatch = content.match(/(?:Besöksadress|Postadress|Adress)[\s:]*([^\n]+)/i);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }

    // Extract postal code and city
    const postalMatch = content.match(/(\d{3}\s?\d{2})\s+([A-ZÅÄÖ][a-zåäö]+)/);
    if (postalMatch) {
      data.postalCode = postalMatch[1].replace(/\s/g, '');
      data.city = postalMatch[2];
    }

    // Extract CEO (VD)
    const ceoMatch = content.match(/(?:VD|Verkställande direktör)[\s:]*([^\n,]+)/i);
    if (ceoMatch) {
      data.ceo = ceoMatch[1].trim();
    }

    // Extract board members
    const boardPattern = /(?:Styrelseledamot|Styrelseordförande|Ledamot)[\s:]*([^\n,]+)/gi;
    let boardMatch;
    while ((boardMatch = boardPattern.exec(content)) !== null) {
      const member = boardMatch[1].trim();
      if (member && !data.boardMembers?.includes(member)) {
        data.boardMembers?.push(member);
      }
    }

    // Extract founded year
    const foundedMatch = content.match(/(?:Registrerad|Bildad|Startad)[\s:]*(\d{4})/i);
    if (foundedMatch) {
      data.foundedYear = foundedMatch[1];
    }

    // Extract legal form
    const legalFormMatch = content.match(/(?:Bolagsform|Juridisk form)[\s:]*([^\n]+)/i);
    if (legalFormMatch) {
      data.legalForm = legalFormMatch[1].trim();
    }

    // Validate required fields
    if (!data.orgNumber) {
      console.warn('⚠️ No org number found in Allabolag data');
      return null;
    }

    console.log('✅ Parsed Allabolag data:', {
      orgNumber: data.orgNumber,
      revenue: data.revenue?.length || 0,
      employees: data.employees
    });

    return data as AllabolagScrapedData;
  } catch (error) {
    console.error('Error parsing Allabolag content:', error);
    return null;
  }
}

/**
 * Search Allabolag and return top results
 */
export async function searchAllabolag(query: string): Promise<Array<{
  companyName: string;
  orgNumber: string;
  url: string;
}>> {
  try {
    const searchUrl = `https://www.allabolag.se/what/${encodeURIComponent(query)}`;
    
    console.log('🔍 Searching Allabolag:', query);

    // Scrape search results page
    const result = await scrapeWithFirecrawl(searchUrl, {
      formats: ['markdown'],
      onlyMainContent: true
    });

    if (!result?.markdown) {
      return [];
    }

    // Parse search results
    const results: Array<{ companyName: string; orgNumber: string; url: string }> = [];
    
    // Look for company links and org numbers in search results
    const linkPattern = /\[([^\]]+)\]\((https:\/\/www\.allabolag\.se\/\d+[^\)]*)\)/g;
    let match;
    
    while ((match = linkPattern.exec(result.markdown)) !== null) {
      const name = match[1];
      const url = match[2];
      const orgMatch = url.match(/\/(\d{10})/);
      
      if (orgMatch) {
        results.push({
          companyName: name,
          orgNumber: orgMatch[1],
          url: url
        });
      }
    }

    console.log(`✅ Found ${results.length} results`);
    return results.slice(0, 10); // Return top 10
  } catch (error) {
    console.error('Allabolag search error:', error);
    return [];
  }
}

/**
 * Get direct Allabolag URL for a company
 */
export function getAllabolagUrl(orgNumber?: string, companyName?: string): string {
  if (orgNumber) {
    const cleanOrg = orgNumber.replace(/[^0-9]/g, '');
    return `https://www.allabolag.se/${cleanOrg}`;
  }
  if (companyName) {
    return `https://www.allabolag.se/what/${encodeURIComponent(companyName)}`;
  }
  return 'https://www.allabolag.se';
}

/**
 * Validate scraped revenue data
 */
export function validateRevenueData(revenue: Array<{ year: string; amount: number }>): boolean {
  if (!Array.isArray(revenue) || revenue.length === 0) {
    return false;
  }

  // Check that all entries have valid year and amount
  return revenue.every(r => {
    const year = parseInt(r.year);
    return (
      year >= 1900 &&
      year <= new Date().getFullYear() &&
      r.amount > 0 &&
      r.amount < 1000000000000 // Less than 1 trillion SEK
    );
  });
}
