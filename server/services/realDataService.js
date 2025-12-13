import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

/**
 * Real Data Service
 * Integrerar med verkliga API:er för företagsdata
 */

export class RealDataService {
  /**
   * Hämta företagsdata från Allabolag API
   */
  static async fetchFromAllabolag(orgNumber) {
    const apiKey = process.env.ALLABOLAG_API_KEY;
    
    if (!apiKey) {
      logger.warn('Allabolag API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://api.allabolag.se/v1/company/${orgNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        logger.error(`Allabolag API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        company_name: data.name,
        org_number: data.organizationNumber,
        address: data.address?.street,
        postal_code: data.address?.postalCode,
        city: data.address?.city,
        revenue_tkr: data.financials?.revenue ? Math.round(data.financials.revenue / 1000) : null,
        employees: data.employees?.count,
        legal_status: data.legalForm,
        credit_rating: data.creditRating?.rating,
        website_url: data.website,
        phone_number: data.phone,
        email: data.email,
        decision_makers: data.officers?.map(officer => ({
          name: officer.name,
          title: officer.role,
          verified: true
        })) || []
      };
    } catch (error) {
      logger.error('Allabolag API error:', error);
      return null;
    }
  }

  /**
   * Hämta företagsdata från UC API
   */
  static async fetchFromUC(orgNumber) {
    const apiKey = process.env.UC_API_KEY;
    
    if (!apiKey) {
      logger.warn('UC API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://api.uc.se/v1/company/${orgNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        logger.error(`UC API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        company_name: data.companyName,
        org_number: data.orgNumber,
        address: data.visitingAddress?.street,
        postal_code: data.visitingAddress?.postalCode,
        city: data.visitingAddress?.city,
        revenue_tkr: data.turnover ? Math.round(data.turnover / 1000) : null,
        employees: data.numberOfEmployees,
        legal_status: data.legalForm,
        credit_rating: data.creditRating,
        kronofogden_check: data.debtCollection ? 'Varning' : 'OK',
        decision_makers: data.management?.map(person => ({
          name: person.name,
          title: person.position,
          verified: true
        })) || []
      };
    } catch (error) {
      logger.error('UC API error:', error);
      return null;
    }
  }

  /**
   * Hämta grundläggande data från Bolagsverket (gratis)
   */
  static async fetchFromBolagsverket(orgNumber) {
    try {
      // Bolagsverkets öppna API
      const response = await fetch(
        `https://data.bolagsverket.se/api/v1/company/${orgNumber}`
      );

      if (!response.ok) {
        logger.error(`Bolagsverket API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        company_name: data.name,
        org_number: data.organizationNumber,
        legal_status: data.legalForm,
        address: data.registeredAddress?.street,
        postal_code: data.registeredAddress?.postalCode,
        city: data.registeredAddress?.city
      };
    } catch (error) {
      logger.error('Bolagsverket API error:', error);
      return null;
    }
  }

  /**
   * Sök företagsnyheter med Tavily
   */
  static async searchNews(companyName) {
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey) {
      logger.warn('Tavily API key not configured');
      return [];
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          query: `${companyName} Sweden news logistics e-commerce`,
          search_depth: 'advanced',
          max_results: 5,
          include_domains: ['di.se', 'breakit.se', 'ehandel.se', 'mynewsdesk.com']
        })
      });

      if (!response.ok) {
        logger.error(`Tavily API error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      return data.results?.map(result => ({
        title: result.title,
        content: result.content,
        url: result.url,
        published_date: result.published_date,
        score: result.score
      })) || [];
    } catch (error) {
      logger.error('Tavily API error:', error);
      return [];
    }
  }

  /**
   * Kombinera data från flera källor
   */
  static async fetchCompanyData(orgNumber, companyName) {
    logger.info(`Fetching real data for: ${companyName} (${orgNumber})`);

    const results = {
      source: 'real_api',
      timestamp: new Date().toISOString(),
      data: null,
      news: []
    };

    // Försök Allabolag först (mest komplett)
    if (process.env.ALLABOLAG_API_KEY) {
      logger.info('Trying Allabolag API...');
      results.data = await this.fetchFromAllabolag(orgNumber);
      results.source = 'allabolag';
    }

    // Fallback till UC
    if (!results.data && process.env.UC_API_KEY) {
      logger.info('Trying UC API...');
      results.data = await this.fetchFromUC(orgNumber);
      results.source = 'uc';
    }

    // Fallback till Bolagsverket (gratis)
    if (!results.data) {
      logger.info('Trying Bolagsverket API...');
      results.data = await this.fetchFromBolagsverket(orgNumber);
      results.source = 'bolagsverket';
    }

    // Hämta nyheter parallellt
    if (process.env.TAVILY_API_KEY && companyName) {
      logger.info('Fetching news from Tavily...');
      results.news = await this.searchNews(companyName);
    }

    if (!results.data) {
      logger.warn('No real data found from any source');
      return null;
    }

    logger.info(`Real data fetched from: ${results.source}`);
    return results;
  }

  /**
   * Verifiera och berika lead-data
   */
  static async enrichLeadData(lead) {
    if (!lead.org_number) {
      logger.warn('No org_number provided, cannot enrich data');
      return lead;
    }

    const realData = await this.fetchCompanyData(
      lead.org_number,
      lead.company_name
    );

    if (!realData || !realData.data) {
      return lead;
    }

    // Merge real data med existing lead
    const enrichedLead = {
      ...lead,
      ...realData.data,
      data_source: realData.source,
      data_verified: true,
      data_updated_at: realData.timestamp
    };

    // Lägg till nyheter som JSON
    if (realData.news.length > 0) {
      enrichedLead.latest_news = JSON.stringify(realData.news);
    }

    logger.info(`Lead enriched with real data from ${realData.source}`);
    return enrichedLead;
  }

  /**
   * Batch-berika flera leads
   */
  static async enrichMultipleLeads(leads) {
    logger.info(`Enriching ${leads.length} leads with real data...`);

    const enrichedLeads = [];

    for (const lead of leads) {
      try {
        const enriched = await this.enrichLeadData(lead);
        enrichedLeads.push(enriched);

        // Rate limiting - vänta 100ms mellan anrop
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Error enriching lead ${lead.id}:`, error);
        enrichedLeads.push(lead); // Behåll original vid fel
      }
    }

    logger.info(`Enriched ${enrichedLeads.length} leads`);
    return enrichedLeads;
  }

  /**
   * Kolla API-status och limits
   */
  static async checkApiStatus() {
    const status = {
      allabolag: {
        configured: !!process.env.ALLABOLAG_API_KEY,
        available: false
      },
      uc: {
        configured: !!process.env.UC_API_KEY,
        available: false
      },
      bolagsverket: {
        configured: true, // Alltid tillgänglig (gratis)
        available: false
      },
      tavily: {
        configured: !!process.env.TAVILY_API_KEY,
        available: false
      }
    };

    // Testa Allabolag
    if (status.allabolag.configured) {
      try {
        const response = await fetch('https://api.allabolag.se/v1/status', {
          headers: { 'Authorization': `Bearer ${process.env.ALLABOLAG_API_KEY}` }
        });
        status.allabolag.available = response.ok;
      } catch (error) {
        logger.error('Allabolag status check failed:', error);
      }
    }

    // Testa UC
    if (status.uc.configured) {
      try {
        const response = await fetch('https://api.uc.se/v1/status', {
          headers: { 'Authorization': `Bearer ${process.env.UC_API_KEY}` }
        });
        status.uc.available = response.ok;
      } catch (error) {
        logger.error('UC status check failed:', error);
      }
    }

    // Testa Bolagsverket
    try {
      const response = await fetch('https://data.bolagsverket.se/api/v1/status');
      status.bolagsverket.available = response.ok;
    } catch (error) {
      logger.error('Bolagsverket status check failed:', error);
    }

    // Testa Tavily
    if (status.tavily.configured) {
      try {
        const response = await fetch('https://api.tavily.com/status', {
          headers: { 'Authorization': `Bearer ${process.env.TAVILY_API_KEY}` }
        });
        status.tavily.available = response.ok;
      } catch (error) {
        logger.error('Tavily status check failed:', error);
      }
    }

    return status;
  }
}

export default RealDataService;
