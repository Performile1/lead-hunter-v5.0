/**
 * Allabolag Scraper Service
 * Scrapa finansiella nyckeltal från Allabolag
 */

import { logger } from '../utils/logger.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

/**
 * Scrapa finansiella nyckeltal från Allabolag
 */
export async function scrapeFinancialMetrics(orgNumber, companyName) {
  logger.info(`📊 Scraping financial metrics for ${companyName} (${orgNumber})`);

  try {
    // Försök med Firecrawl först (bäst för strukturerad data)
    if (FIRECRAWL_API_KEY) {
      const firecrawlResult = await scrapeWithFirecrawl(orgNumber, companyName);
      if (firecrawlResult) return firecrawlResult;
    }

    // Fallback till Gemini
    const geminiResult = await scrapeWithGemini(orgNumber, companyName);
    return geminiResult;

  } catch (error) {
    logger.error('Failed to scrape financial metrics:', error);
    return null;
  }
}

/**
 * Scrapa med Firecrawl
 */
async function scrapeWithFirecrawl(orgNumber, companyName) {
  try {
    const url = `https://www.allabolag.se/${orgNumber}`;
    
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000
      })
    });

    if (!response.ok) {
      logger.warn('Firecrawl failed:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.data?.markdown || '';

    // Extrahera nyckeltal från content
    const metrics = extractMetricsFromContent(content);
    
    if (metrics.kassalikviditet || metrics.vinstmarginal || metrics.soliditet) {
      logger.info(`✅ Firecrawl found metrics: ${JSON.stringify(metrics)}`);
      return metrics;
    }

    return null;

  } catch (error) {
    logger.error('Firecrawl scraping error:', error);
    return null;
  }
}

/**
 * Scrapa med Gemini
 */
async function scrapeWithGemini(orgNumber, companyName) {
  try {
    const prompt = `
Sök på Allabolag för företaget ${companyName} (org.nr: ${orgNumber}).

URL: https://www.allabolag.se/${orgNumber}

Hitta följande nyckeltal (oftast längre ned på sidan under "Nyckeltal"):
1. Kassalikviditet (%)
2. Vinstmarginal (%)
3. Soliditet (%)

Returnera JSON:
{
  "kassalikviditet": 145.5,
  "vinstmarginal": 8.2,
  "soliditet": 42.3,
  "year": "2023"
}

Om något nyckeltal saknas, sätt det till null.
`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024
        }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extrahera JSON från response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const metrics = JSON.parse(jsonMatch[0]);
      logger.info(`✅ Gemini found metrics: ${JSON.stringify(metrics)}`);
      return metrics;
    }

    return null;

  } catch (error) {
    logger.error('Gemini scraping error:', error);
    return null;
  }
}

/**
 * Extrahera nyckeltal från markdown content
 */
function extractMetricsFromContent(content) {
  const metrics = {
    kassalikviditet: null,
    vinstmarginal: null,
    soliditet: null,
    year: null
  };

  // Leta efter nyckeltal i texten
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Kassalikviditet
    if (line.includes('kassalikviditet')) {
      const match = lines[i + 1]?.match(/(\d+[.,]?\d*)\s*%?/);
      if (match) {
        metrics.kassalikviditet = parseFloat(match[1].replace(',', '.'));
      }
    }
    
    // Vinstmarginal
    if (line.includes('vinstmarginal') || line.includes('rörelsemarginal')) {
      const match = lines[i + 1]?.match(/(-?\d+[.,]?\d*)\s*%?/);
      if (match) {
        metrics.vinstmarginal = parseFloat(match[1].replace(',', '.'));
      }
    }
    
    // Soliditet
    if (line.includes('soliditet')) {
      const match = lines[i + 1]?.match(/(\d+[.,]?\d*)\s*%?/);
      if (match) {
        metrics.soliditet = parseFloat(match[1].replace(',', '.'));
      }
    }
    
    // År
    if (line.includes('nyckeltal') && line.match(/20\d{2}/)) {
      const yearMatch = line.match(/20\d{2}/);
      if (yearMatch) {
        metrics.year = yearMatch[0];
      }
    }
  }

  return metrics;
}

/**
 * Spara finansiella nyckeltal i databas
 */
export async function saveFinancialMetrics(leadId, metrics) {
  try {
    const { query } = await import('../config/database.js');
    
    await query(
      `UPDATE leads 
       SET financial_metrics = $1,
           financial_metrics_updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(metrics), leadId]
    );

    logger.info(`✅ Saved financial metrics for lead ${leadId}`);
    return true;

  } catch (error) {
    logger.error('Failed to save financial metrics:', error);
    return false;
  }
}

export default {
  scrapeFinancialMetrics,
  saveFinancialMetrics
};
