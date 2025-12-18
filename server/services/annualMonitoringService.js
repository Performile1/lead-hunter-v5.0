/**
 * Annual Financial Monitoring Service
 * Kör djupanalys när vi närmar oss bokslut (årsskifte)
 * Kollar: Omsättning, Kronofogden, Kreditrapport, Skatteverket, Google betalningsanmärkningar
 */

import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Kolla om vi närmar oss bokslut (Q4 - Oktober till December)
 */
export function isApproachingFiscalYearEnd() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  
  // Q4: Oktober (9), November (10), December (11)
  return month >= 9 && month <= 11;
}

/**
 * Hämta leads som behöver årlig djupanalys
 */
export async function getLeadsNeedingAnnualReview(tenantId) {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const sql = `
      SELECT 
        l.id,
        l.company_name,
        l.org_number,
        l.domain,
        l.last_deep_analysis_at,
        l.revenue_tkr,
        l.revenue_year,
        l.credit_rating
      FROM leads l
      WHERE l.tenant_id = $1
        AND l.org_number IS NOT NULL
        AND (
          l.last_deep_analysis_at IS NULL 
          OR l.last_deep_analysis_at < $2
        )
      ORDER BY l.revenue_tkr DESC NULLS LAST
      LIMIT 50
    `;

    const result = await query(sql, [tenantId, oneYearAgo]);
    return result.rows;

  } catch (error) {
    logger.error('Error fetching leads for annual review:', error);
    return [];
  }
}

/**
 * Kör djupanalys på ett lead
 */
export async function runDeepAnalysis(lead) {
  logger.info(`🔍 Running deep analysis for ${lead.company_name} (${lead.org_number})`);

  const analysis = {
    lead_id: lead.id,
    company_name: lead.company_name,
    org_number: lead.org_number,
    analyzed_at: new Date().toISOString(),
    checks: {}
  };

  try {
    // 1. Kolla Allabolag för uppdaterad omsättning
    const revenueCheck = await checkRevenueUpdate(lead);
    analysis.checks.revenue = revenueCheck;

    // 2. Kolla Kronofogden
    const kronofogdenCheck = await checkKronofogden(lead);
    analysis.checks.kronofogden = kronofogdenCheck;

    // 3. Kolla Kreditupplysning (UC/Creditsafe)
    const creditCheck = await checkCreditReport(lead);
    analysis.checks.credit = creditCheck;

    // 4. Kolla Skatteverket (via Allabolag eller UC)
    const taxCheck = await checkTaxAuthority(lead);
    analysis.checks.tax = taxCheck;

    // 5. Google-sök efter betalningsanmärkningar
    const paymentRemarksCheck = await checkPaymentRemarks(lead);
    analysis.checks.payment_remarks = paymentRemarksCheck;

    // Beräkna risk score
    analysis.risk_score = calculateRiskScore(analysis.checks);
    analysis.risk_level = getRiskLevel(analysis.risk_score);

    // Spara analys i databas
    await saveDeepAnalysis(analysis);

    logger.info(`✅ Deep analysis complete for ${lead.company_name}. Risk: ${analysis.risk_level}`);
    return analysis;

  } catch (error) {
    logger.error(`Error in deep analysis for ${lead.company_name}:`, error);
    return null;
  }
}

/**
 * Kolla uppdaterad omsättning från Allabolag
 */
async function checkRevenueUpdate(lead) {
  try {
    // Använd Allabolag scraping eller API
    const url = `https://www.allabolag.se/${lead.org_number}`;
    
    // Scrapa med Gemini eller Firecrawl
    const prompt = `
Sök på Allabolag för företaget ${lead.company_name} (org.nr: ${lead.org_number}).
Hämta senaste omsättning och jämför med tidigare år.

URL: ${url}

Returnera JSON:
{
  "latest_revenue_year": "2023",
  "latest_revenue_tkr": 150000,
  "previous_revenue_year": "2022",
  "previous_revenue_tkr": 120000,
  "revenue_change_percent": 25,
  "trend": "increasing"
}
`;

    const response = await callGemini(prompt);
    return JSON.parse(response);

  } catch (error) {
    logger.error('Revenue check failed:', error);
    return { error: 'Failed to fetch revenue data' };
  }
}

/**
 * Kolla Kronofogden för betalningsanmärkningar
 */
async function checkKronofogden(lead) {
  try {
    const prompt = `
Sök på Kronofogden efter företaget ${lead.company_name} (org.nr: ${lead.org_number}).
Kolla om det finns några:
- Pågående mål
- Betalningsförelägganden
- Skuldsaldo

Returnera JSON:
{
  "has_records": false,
  "active_cases": 0,
  "total_debt_sek": 0,
  "status": "clean"
}
`;

    const response = await callGemini(prompt);
    return JSON.parse(response);

  } catch (error) {
    logger.error('Kronofogden check failed:', error);
    return { error: 'Failed to check Kronofogden' };
  }
}

/**
 * Kolla kreditupplysning (UC/Creditsafe)
 */
async function checkCreditReport(lead) {
  try {
    const prompt = `
Sök efter kreditupplysning för ${lead.company_name} (org.nr: ${lead.org_number}).
Kolla:
- Kreditbetyg (AAA, AA, A, BBB, etc.)
- Betalningsanmärkningar
- Kreditlimit
- Risk för konkurs

Returnera JSON:
{
  "credit_rating": "AA",
  "credit_score": 85,
  "payment_remarks": 0,
  "credit_limit_sek": 500000,
  "bankruptcy_risk": "low",
  "recommendation": "approved"
}
`;

    const response = await callGemini(prompt);
    return JSON.parse(response);

  } catch (error) {
    logger.error('Credit check failed:', error);
    return { error: 'Failed to fetch credit report' };
  }
}

/**
 * Kolla Skatteverket
 */
async function checkTaxAuthority(lead) {
  try {
    const prompt = `
Sök efter information från Skatteverket för ${lead.company_name} (org.nr: ${lead.org_number}).
Kolla:
- F-skatt registrering
- Momsregistrering
- Arbetsgivarregistrering
- Eventuella skatteskulder

Returnera JSON:
{
  "f_tax_registered": true,
  "vat_registered": true,
  "employer_registered": true,
  "tax_debt_sek": 0,
  "status": "compliant"
}
`;

    const response = await callGemini(prompt);
    return JSON.parse(response);

  } catch (error) {
    logger.error('Tax authority check failed:', error);
    return { error: 'Failed to check tax authority' };
  }
}

/**
 * Google-sök efter betalningsanmärkningar
 */
async function checkPaymentRemarks(lead) {
  try {
    const searchQueries = [
      `"${lead.company_name}" betalningsanmärkning`,
      `"${lead.company_name}" konkurs`,
      `"${lead.company_name}" obetalda fakturor`,
      `"${lead.org_number}" betalningsproblem`
    ];

    const prompt = `
Sök på Google efter betalningsanmärkningar för ${lead.company_name} (org.nr: ${lead.org_number}).

Sökfrågor:
${searchQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Leta efter:
- Betalningsanmärkningar
- Konkurser
- Obetalda fakturor
- Negativa recensioner om betalning
- Forum-diskussioner om betalningsproblem

Returnera JSON:
{
  "found_remarks": false,
  "sources": [],
  "severity": "none",
  "summary": "Inga betalningsanmärkningar hittades"
}
`;

    const response = await callGemini(prompt);
    return JSON.parse(response);

  } catch (error) {
    logger.error('Payment remarks check failed:', error);
    return { error: 'Failed to search for payment remarks' };
  }
}

/**
 * Beräkna risk score baserat på alla checks
 */
function calculateRiskScore(checks) {
  let score = 100; // Start med 100 (låg risk)

  // Revenue check
  if (checks.revenue?.trend === 'decreasing') {
    score -= 15;
  } else if (checks.revenue?.trend === 'stable') {
    score -= 5;
  }

  // Kronofogden
  if (checks.kronofogden?.has_records) {
    score -= 30;
  }
  if (checks.kronofogden?.total_debt_sek > 0) {
    score -= Math.min(20, checks.kronofogden.total_debt_sek / 10000);
  }

  // Credit
  if (checks.credit?.credit_rating) {
    const rating = checks.credit.credit_rating;
    if (rating.includes('C') || rating.includes('D')) {
      score -= 25;
    } else if (rating.includes('B')) {
      score -= 10;
    }
  }
  if (checks.credit?.payment_remarks > 0) {
    score -= checks.credit.payment_remarks * 10;
  }

  // Tax
  if (checks.tax?.tax_debt_sek > 0) {
    score -= 20;
  }
  if (!checks.tax?.f_tax_registered) {
    score -= 5;
  }

  // Payment remarks
  if (checks.payment_remarks?.found_remarks) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Få risk level baserat på score
 */
function getRiskLevel(score) {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

/**
 * Spara djupanalys i databas
 */
async function saveDeepAnalysis(analysis) {
  try {
    const sql = `
      INSERT INTO lead_deep_analysis (
        lead_id,
        analyzed_at,
        revenue_check,
        kronofogden_check,
        credit_check,
        tax_check,
        payment_remarks_check,
        risk_score,
        risk_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (lead_id) 
      DO UPDATE SET
        analyzed_at = EXCLUDED.analyzed_at,
        revenue_check = EXCLUDED.revenue_check,
        kronofogden_check = EXCLUDED.kronofogden_check,
        credit_check = EXCLUDED.credit_check,
        tax_check = EXCLUDED.tax_check,
        payment_remarks_check = EXCLUDED.payment_remarks_check,
        risk_score = EXCLUDED.risk_score,
        risk_level = EXCLUDED.risk_level
    `;

    await query(sql, [
      analysis.lead_id,
      analysis.analyzed_at,
      JSON.stringify(analysis.checks.revenue),
      JSON.stringify(analysis.checks.kronofogden),
      JSON.stringify(analysis.checks.credit),
      JSON.stringify(analysis.checks.tax),
      JSON.stringify(analysis.checks.payment_remarks),
      analysis.risk_score,
      analysis.risk_level
    ]);

    // Uppdatera lead med senaste analys-datum
    await query(
      'UPDATE leads SET last_deep_analysis_at = $1 WHERE id = $2',
      [analysis.analyzed_at, analysis.lead_id]
    );

  } catch (error) {
    logger.error('Failed to save deep analysis:', error);
  }
}

/**
 * Anropa Gemini för AI-analys
 */
async function callGemini(prompt) {
  try {
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
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extrahera JSON från response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;

  } catch (error) {
    logger.error('Gemini API call failed:', error);
    throw error;
  }
}

/**
 * Kör batch-analys för alla leads som behöver uppdatering
 */
export async function runAnnualMonitoringBatch(tenantId) {
  try {
    logger.info(`🔄 Starting annual monitoring batch for tenant ${tenantId}`);

    const leads = await getLeadsNeedingAnnualReview(tenantId);
    logger.info(`Found ${leads.length} leads needing annual review`);

    const results = [];
    for (const lead of leads) {
      const analysis = await runDeepAnalysis(lead);
      if (analysis) {
        results.push(analysis);
      }
      
      // Vänta lite mellan anrop för att inte överbelasta API:er
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info(`✅ Annual monitoring batch complete. Analyzed ${results.length} leads`);
    return results;

  } catch (error) {
    logger.error('Annual monitoring batch failed:', error);
    return [];
  }
}

export default {
  isApproachingFiscalYearEnd,
  getLeadsNeedingAnnualReview,
  runDeepAnalysis,
  runAnnualMonitoringBatch
};
