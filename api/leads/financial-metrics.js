import { query } from '../../server/config/database.js';
import { logger } from '../../server/utils/logger.js';
import { scrapeFinancialMetrics, saveFinancialMetrics } from '../../server/services/allabolagScraperService.js';

/**
 * POST /api/leads/:id/financial-metrics
 * Scrapa och spara finansiella nyckeltal från Allabolag
 */
export default async function handler(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(403).json({ error: 'Åtkomst nekad' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    // Hämta lead
    const leadResult = await query(
      'SELECT id, company_name, org_number, tenant_id FROM leads WHERE id = $1',
      [id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    // Check access
    if (user.role !== 'admin' && user.tenant_id !== lead.tenant_id) {
      return res.status(403).json({ error: 'Åtkomst nekad' });
    }

    if (!lead.org_number) {
      return res.status(400).json({ error: 'Lead saknar org.nummer' });
    }

    // Scrapa finansiella nyckeltal
    logger.info(`Scraping financial metrics for ${lead.company_name}`);
    const metrics = await scrapeFinancialMetrics(lead.org_number, lead.company_name);

    if (!metrics) {
      return res.status(500).json({ error: 'Kunde inte hämta finansiella nyckeltal' });
    }

    // Spara i databas
    await saveFinancialMetrics(lead.id, metrics);

    return res.json({
      success: true,
      metrics,
      message: 'Finansiella nyckeltal uppdaterade'
    });

  } catch (error) {
    logger.error('Error scraping financial metrics:', error);
    return res.status(500).json({ error: 'Serverfel' });
  }
}
