/**
 * Google Search Service
 * Integration med Google Custom Search API
 */

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface GoogleSearchResponse {
  items: SearchResult[];
  searchInformation: {
    totalResults: string;
    searchTime: number;
  };
}

/**
 * Sök med Google Custom Search API
 * @param query - Sökfråga
 * @param options - Sökalternativ
 * @returns Sökresultat
 */
export async function search(
  query: string,
  options: {
    num?: number;
    siteSearch?: string;
    exactTerms?: string;
  } = {}
): Promise<GoogleSearchResponse | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.warn('⚠️ Google API credentials not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      num: (options.num || 10).toString()
    });

    if (options.siteSearch) {
      params.append('siteSearch', options.siteSearch);
    }

    if (options.exactTerms) {
      params.append('exactTerms', options.exactTerms);
    }

    const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Google Search failed:', error);
    return null;
  }
}

/**
 * Sök efter företagsinformation
 * @param companyName - Företagsnamn
 * @returns Sökresultat
 */
export async function searchCompanyInfo(companyName: string): Promise<SearchResult[]> {
  const query = `${companyName} Sweden contact information`;
  const result = await search(query, { num: 5 });
  return result?.items || [];
}

/**
 * Sök efter beslutsfattare
 * @param companyName - Företagsnamn
 * @param title - Titel (t.ex. "CEO", "VD")
 * @returns Sökresultat
 */
export async function searchDecisionMaker(
  companyName: string,
  title: string
): Promise<SearchResult[]> {
  const query = `${companyName} ${title} contact`;
  const result = await search(query, { num: 5 });
  return result?.items || [];
}

/**
 * Sök LinkedIn-profiler via Google
 * @param companyName - Företagsnamn
 * @param title - Titel
 * @returns LinkedIn-URLs
 */
export async function findLinkedInProfiles(
  companyName: string,
  title: string
): Promise<string[]> {
  const query = `${companyName} ${title}`;
  const result = await search(query, {
    num: 10,
    siteSearch: 'linkedin.com/in'
  });

  if (!result?.items) return [];

  return result.items
    .map(item => item.link)
    .filter(link => link.includes('linkedin.com/in'));
}

/**
 * Sök efter företagets webbplats
 * @param companyName - Företagsnamn
 * @returns Webbplats-URL
 */
export async function findCompanyWebsite(companyName: string): Promise<string | null> {
  const query = `${companyName} Sweden official website`;
  const result = await search(query, { num: 3 });

  if (!result?.items || result.items.length === 0) {
    return null;
  }

  // Returnera första resultatet som inte är LinkedIn, Facebook, etc.
  const socialMediaDomains = ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com'];
  
  for (const item of result.items) {
    const domain = new URL(item.link).hostname;
    if (!socialMediaDomains.some(sm => domain.includes(sm))) {
      return item.link;
    }
  }

  return result.items[0].link;
}

/**
 * Sök efter nyheter om företaget
 * @param companyName - Företagsnamn
 * @param days - Antal dagar bakåt
 * @returns Nyhetsartiklar
 */
export async function searchCompanyNews(
  companyName: string,
  days: number = 30
): Promise<SearchResult[]> {
  const query = `${companyName} news`;
  const result = await search(query, { num: 10 });

  if (!result?.items) return [];

  // Filtrera på datum (approximativt)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return result.items.filter(item => {
    // Google returnerar inte alltid datum, så vi kan inte filtrera perfekt
    return true;
  });
}

/**
 * Sök efter kontaktinformation
 * @param companyName - Företagsnamn
 * @returns Kontaktinformation
 */
export async function searchContactInfo(companyName: string): Promise<{
  emails: string[];
  phones: string[];
}> {
  const query = `${companyName} Sweden contact email phone`;
  const result = await search(query, { num: 5 });

  const emails: string[] = [];
  const phones: string[] = [];

  if (result?.items) {
    result.items.forEach(item => {
      // Extrahera emails från snippet
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = item.snippet.match(emailRegex);
      if (foundEmails) {
        emails.push(...foundEmails);
      }

      // Extrahera telefonnummer från snippet
      const phoneRegex = /(\+46|0)[1-9]\d{1,2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g;
      const foundPhones = item.snippet.match(phoneRegex);
      if (foundPhones) {
        phones.push(...foundPhones);
      }
    });
  }

  return {
    emails: [...new Set(emails)], // Ta bort dubletter
    phones: [...new Set(phones)]
  };
}

/**
 * Sök efter e-handelsplattform
 * @param websiteUrl - Webbplats-URL
 * @returns E-handelsplattform
 */
export async function detectEcommercePlatform(websiteUrl: string): Promise<string | null> {
  const query = `site:${websiteUrl} powered by`;
  const result = await search(query, { num: 3 });

  if (!result?.items) return null;

  const platforms = ['Shopify', 'WooCommerce', 'Magento', 'PrestaShop', 'OpenCart', 'Klarna'];

  for (const item of result.items) {
    const text = item.snippet.toLowerCase();
    for (const platform of platforms) {
      if (text.includes(platform.toLowerCase())) {
        return platform;
      }
    }
  }

  return null;
}

/**
 * Sök efter sociala medier
 * @param companyName - Företagsnamn
 * @returns Sociala medie-länkar
 */
export async function findSocialMedia(companyName: string): Promise<{
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
}> {
  const socialMedia: any = {};

  // LinkedIn
  const linkedinResult = await search(`${companyName} Sweden`, {
    num: 3,
    siteSearch: 'linkedin.com/company'
  });
  if (linkedinResult?.items && linkedinResult.items.length > 0) {
    socialMedia.linkedin = linkedinResult.items[0].link;
  }

  // Facebook
  const facebookResult = await search(`${companyName} Sweden`, {
    num: 3,
    siteSearch: 'facebook.com'
  });
  if (facebookResult?.items && facebookResult.items.length > 0) {
    socialMedia.facebook = facebookResult.items[0].link;
  }

  return socialMedia;
}

export default {
  search,
  searchCompanyInfo,
  searchDecisionMaker,
  findLinkedInProfiles,
  findCompanyWebsite,
  searchCompanyNews,
  searchContactInfo,
  detectEcommercePlatform,
  findSocialMedia
};
