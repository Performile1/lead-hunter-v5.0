import express from 'express';
import { pool } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { HybridScraperService } from '../../services/hybridScraperService.js';
import { RealDataService } from '../services/realDataService.js';
import PDFDocument from 'pdfkit';

const router = express.Router();
const scraper = new HybridScraperService();

/**
 * POST /api/leads/:id/analyze
 * Starta eller öppna analys för ett lead
 */
router.post('/:id/analyze', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Hämta lead
    const leadResult = await client.query(`
      SELECT * FROM leads WHERE id = $1
    `, [id]);

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    // Om redan analyserad, returnera befintlig data
    if (lead.status === 'analyzed' && lead.analysis_date) {
      return res.json({
        message: 'Analysis already exists',
        lead: lead,
        status: 'existing'
      });
    }

    // Starta ny analys
    await client.query('BEGIN');

    // Uppdatera status
    await client.query(`
      UPDATE leads 
      SET status = 'analyzing', updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // 1. Hämta verklig företagsdata från API:er (Allabolag/UC/Bolagsverket)
    let realData = null;
    if (lead.org_number) {
      try {
        logger.info(`Fetching real data for org ${lead.org_number}...`);
        const enrichedData = await RealDataService.fetchCompanyData(
          lead.org_number,
          lead.company_name
        );
        
        if (enrichedData && enrichedData.data) {
          realData = enrichedData.data;
          
          // Uppdatera lead med verklig data
          await client.query(`
            UPDATE leads 
            SET 
              revenue_tkr = COALESCE($1, revenue_tkr),
              employees = COALESCE($2, employees),
              legal_status = COALESCE($3, legal_status),
              credit_rating = COALESCE($4, credit_rating),
              phone_number = COALESCE($5, phone_number),
              email = COALESCE($6, email),
              latest_news = COALESCE($7, latest_news),
              data_source = $8,
              data_verified = true
            WHERE id = $9
          `, [
            realData.revenue_tkr,
            realData.employees,
            realData.legal_status,
            realData.credit_rating,
            realData.phone_number,
            realData.email,
            enrichedData.news.length > 0 ? JSON.stringify(enrichedData.news) : null,
            enrichedData.source,
            id
          ]);

          // Lägg till decision makers från API
          if (realData.decision_makers && realData.decision_makers.length > 0) {
            for (const dm of realData.decision_makers) {
              await client.query(`
                INSERT INTO decision_makers (lead_id, name, title, verified)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING
              `, [id, dm.name, dm.title, dm.verified]);
            }
          }

          logger.info(`Real data fetched from ${enrichedData.source}`);
        }
      } catch (error) {
        logger.error(`Real data fetch failed for lead ${id}:`, error);
      }
    }

    // 2. Scrapa website om URL finns
    let websiteData = null;
    if (lead.website_url) {
      try {
        logger.info(`Scraping website: ${lead.website_url}...`);
        websiteData = await scraper.analyzeWebsite(lead.website_url);
        
        // Spara website-data
        await client.query(`
          UPDATE leads 
          SET 
            ecommerce_platform = $1,
            delivery_services = $2,
            technologies_used = $3,
            markets = $4
          WHERE id = $5
        `, [
          websiteData.ecommerce_platform,
          JSON.stringify(websiteData.shipping_providers),
          JSON.stringify(websiteData.technologies_used),
          JSON.stringify(websiteData.markets),
          id
        ]);

        logger.info(`Website scraped successfully`);
      } catch (error) {
        logger.error(`Website scraping failed for lead ${id}:`, error);
      }
    }

    // Markera som analyserad
    await client.query(`
      UPDATE leads 
      SET 
        status = 'analyzed',
        analysis_date = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `, [id]);

    await client.query('COMMIT');

    // Hämta uppdaterad lead
    const updatedLead = await client.query(`
      SELECT l.*, 
             json_agg(DISTINCT dm.*) FILTER (WHERE dm.id IS NOT NULL) as decision_makers
      FROM leads l
      LEFT JOIN decision_makers dm ON dm.lead_id = l.id
      WHERE l.id = $1
      GROUP BY l.id
    `, [id]);

    logger.info(`Lead ${id} analyzed successfully`);
    
    res.json({
      message: 'Analysis completed',
      lead: updatedLead.rows[0],
      status: 'completed'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error analyzing lead:', error);
    res.status(500).json({ error: 'Failed to analyze lead' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/leads/:id/refresh
 * Uppdatera/refresha analys för ett lead
 */
router.post('/:id/refresh', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const leadResult = await client.query(`
      SELECT * FROM leads WHERE id = $1
    `, [id]);

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    await client.query('BEGIN');

    // Scrapa website igen
    if (lead.website_url) {
      try {
        const websiteData = await scraper.analyzeWebsite(lead.website_url);
        
        await client.query(`
          UPDATE leads 
          SET 
            ecommerce_platform = $1,
            delivery_services = $2,
            technologies_used = $3,
            markets = $4,
            analysis_date = NOW(),
            updated_at = NOW()
          WHERE id = $5
        `, [
          websiteData.ecommerce_platform,
          JSON.stringify(websiteData.shipping_providers),
          JSON.stringify(websiteData.technologies_used),
          JSON.stringify(websiteData.markets),
          id
        ]);
      } catch (error) {
        logger.error(`Website refresh failed for lead ${id}:`, error);
        throw error;
      }
    }

    await client.query('COMMIT');

    // Hämta uppdaterad lead
    const updatedLead = await client.query(`
      SELECT l.*, 
             json_agg(DISTINCT dm.*) FILTER (WHERE dm.id IS NOT NULL) as decision_makers
      FROM leads l
      LEFT JOIN decision_makers dm ON dm.lead_id = l.id
      WHERE l.id = $1
      GROUP BY l.id
    `, [id]);

    logger.info(`Lead ${id} refreshed successfully`);
    
    res.json({
      message: 'Lead refreshed',
      lead: updatedLead.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error refreshing lead:', error);
    res.status(500).json({ error: 'Failed to refresh lead' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/leads/:id/download
 * Ladda ned lead som PDF
 */
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT l.*, 
             json_agg(DISTINCT dm.*) FILTER (WHERE dm.id IS NOT NULL) as decision_makers
      FROM leads l
      LEFT JOIN decision_makers dm ON dm.lead_id = l.id
      WHERE l.id = $1
      GROUP BY l.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = result.rows[0];

    // Skapa PDF
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=lead-${lead.org_number || id}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('DHL Lead Hunter - Lead Rapport', { align: 'center' });
    doc.moveDown();
    
    // Företagsinformation
    doc.fontSize(16).text('Företagsinformation', { underline: true });
    doc.fontSize(12);
    doc.text(`Företag: ${lead.company_name}`);
    doc.text(`Org.nummer: ${lead.org_number || 'N/A'}`);
    doc.text(`Adress: ${lead.address || 'N/A'}`);
    doc.text(`Postnummer: ${lead.postal_code || 'N/A'}`);
    doc.text(`Ort: ${lead.city || 'N/A'}`);
    doc.text(`Segment: ${lead.segment || 'N/A'}`);
    doc.moveDown();

    // Ekonomi
    doc.fontSize(16).text('Ekonomi', { underline: true });
    doc.fontSize(12);
    doc.text(`Omsättning: ${lead.revenue_tkr ? lead.revenue_tkr + ' tkr' : 'N/A'}`);
    doc.text(`Fraktbudget: ${lead.freight_budget_tkr ? lead.freight_budget_tkr + ' tkr' : 'N/A'}`);
    doc.text(`Kreditbetyg: ${lead.credit_rating || 'N/A'}`);
    doc.moveDown();

    // Decision Makers
    if (lead.decision_makers && lead.decision_makers.length > 0) {
      doc.fontSize(16).text('Beslutsfattare', { underline: true });
      doc.fontSize(12);
      lead.decision_makers.forEach(dm => {
        doc.text(`${dm.name} - ${dm.title || 'N/A'}`);
        if (dm.email) doc.text(`  Email: ${dm.email}`);
        if (dm.phone) doc.text(`  Telefon: ${dm.phone}`);
        doc.moveDown(0.5);
      });
    }

    // Footer
    doc.fontSize(10).text(`Genererad: ${new Date().toLocaleString('sv-SE')}`, {
      align: 'center'
    });

    doc.end();

    // Logga nedladdning
    await pool.query(`
      INSERT INTO download_history (lead_id, user_id, downloaded_at)
      VALUES ($1, $2, NOW())
    `, [id, req.user.id]);

    logger.info(`Lead ${id} downloaded by user ${req.user.id}`);
  } catch (error) {
    logger.error('Error downloading lead:', error);
    res.status(500).json({ error: 'Failed to download lead' });
  }
});

/**
 * POST /api/leads/:id/report
 * Rapportera fel/hallucination för ett lead
 */
router.post('/:id/report', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    await pool.query(`
      INSERT INTO lead_reports (lead_id, user_id, reason, description, reported_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [id, req.user.id, reason, description]);

    // Uppdatera lead status
    await pool.query(`
      UPDATE leads 
      SET status = 'reported', updated_at = NOW()
      WHERE id = $1
    `, [id]);

    logger.info(`Lead ${id} reported by user ${req.user.id}: ${reason}`);
    
    res.json({ message: 'Lead reported successfully' });
  } catch (error) {
    logger.error('Error reporting lead:', error);
    res.status(500).json({ error: 'Failed to report lead' });
  }
});

/**
 * POST /api/leads/delete
 * Radera ett eller flera leads med anledning
 */
router.post('/delete', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { leadIds, reason } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds must be a non-empty array' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    await client.query('BEGIN');

    // Hämta leads innan radering
    const leadsResult = await client.query(`
      SELECT id, company_name, org_number FROM leads WHERE id = ANY($1)
    `, [leadIds]);

    const leads = leadsResult.rows;

    // Hantera olika raderingsanledningar
    switch (reason) {
      case 'duplicate':
        // Ta bara bort raden, behåll andra förekomster
        await client.query(`
          DELETE FROM leads WHERE id = ANY($1)
        `, [leadIds]);
        break;

      case 'existing_customer':
        // Lägg till i exkluderingar
        for (const lead of leads) {
          await client.query(`
            INSERT INTO exclusions (
              exclusion_type, value, reason, created_by, created_at
            ) VALUES ('company', $1, 'Befintlig kund', $2, NOW())
            ON CONFLICT (exclusion_type, value) DO NOTHING
          `, [lead.org_number || lead.company_name, req.user.id]);
        }
        
        await client.query(`
          DELETE FROM leads WHERE id = ANY($1)
        `, [leadIds]);
        break;

      case 'hallucination':
        // Blockera permanent (negativ prompt)
        for (const lead of leads) {
          await client.query(`
            INSERT INTO exclusions (
              exclusion_type, value, reason, created_by, created_at
            ) VALUES ('company', $1, 'Hallucination/Felaktig data', $2, NOW())
            ON CONFLICT (exclusion_type, value) DO NOTHING
          `, [lead.org_number || lead.company_name, req.user.id]);
        }
        
        await client.query(`
          DELETE FROM leads WHERE id = ANY($1)
        `, [leadIds]);
        break;

      case 'not_relevant':
        // Blockera från framtida sökningar
        for (const lead of leads) {
          await client.query(`
            INSERT INTO exclusions (
              exclusion_type, value, reason, created_by, created_at
            ) VALUES ('company', $1, 'Ej relevant/Konkurs', $2, NOW())
            ON CONFLICT (exclusion_type, value) DO NOTHING
          `, [lead.org_number || lead.company_name, req.user.id]);
        }
        
        await client.query(`
          DELETE FROM leads WHERE id = ANY($1)
        `, [leadIds]);
        break;

      case 'already_processed':
        // Lägg till i nedladdad historik
        for (const lead of leads) {
          await client.query(`
            INSERT INTO download_history (lead_id, user_id, downloaded_at, manual_entry)
            VALUES ($1, $2, NOW(), true)
          `, [lead.id, req.user.id]);
        }
        
        await client.query(`
          DELETE FROM leads WHERE id = ANY($1)
        `, [leadIds]);
        break;

      default:
        throw new Error('Invalid reason');
    }

    // Logga radering
    await client.query(`
      INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, created_at)
      VALUES ($1, 'delete_leads', 'leads', $2, $3, NOW())
    `, [req.user.id, leadIds[0], JSON.stringify({ count: leadIds.length, reason })]);

    await client.query('COMMIT');

    logger.info(`${leadIds.length} leads deleted by user ${req.user.id}, reason: ${reason}`);
    
    res.json({ 
      message: `${leadIds.length} lead(s) deleted successfully`,
      count: leadIds.length,
      reason
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deleting leads:', error);
    res.status(500).json({ error: 'Failed to delete leads' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/leads/batch-download
 * Ladda ned flera leads som Excel/CSV
 */
router.post('/batch-download', authenticate, async (req, res) => {
  try {
    const { leadIds, format = 'excel' } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds must be a non-empty array' });
    }

    const result = await pool.query(`
      SELECT 
        l.company_name,
        l.org_number,
        l.address,
        l.postal_code,
        l.city,
        l.segment,
        l.revenue_tkr,
        l.freight_budget_tkr,
        l.status,
        string_agg(dm.name || ' (' || dm.title || ')', ', ') as decision_makers
      FROM leads l
      LEFT JOIN decision_makers dm ON dm.lead_id = l.id
      WHERE l.id = ANY($1)
      GROUP BY l.id
    `, [leadIds]);

    if (format === 'csv') {
      // CSV format
      const csv = [
        ['Företag', 'Org.nummer', 'Adress', 'Postnummer', 'Ort', 'Segment', 'Omsättning', 'Fraktbudget', 'Status', 'Beslutsfattare'].join(','),
        ...result.rows.map(row => [
          row.company_name,
          row.org_number,
          row.address,
          row.postal_code,
          row.city,
          row.segment,
          row.revenue_tkr,
          row.freight_budget_tkr,
          row.status,
          row.decision_makers
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=leads-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // Excel format (simplified, use a library like exceljs for production)
      res.json({
        message: 'Excel export not yet implemented',
        data: result.rows
      });
    }

    // Logga nedladdning
    await pool.query(`
      INSERT INTO download_history (lead_id, user_id, downloaded_at, batch_download)
      SELECT unnest($1::uuid[]), $2, NOW(), true
    `, [leadIds, req.user.id]);

    logger.info(`${leadIds.length} leads downloaded by user ${req.user.id}`);
  } catch (error) {
    logger.error('Error batch downloading leads:', error);
    res.status(500).json({ error: 'Failed to download leads' });
  }
});

/**
 * GET /api/lead-actions/api-status
 * Kolla status på alla externa API:er
 */
router.get('/api-status', authenticate, async (req, res) => {
  try {
    logger.info('Checking API status...');
    const status = await RealDataService.checkApiStatus();
    
    res.json({
      status: 'ok',
      apis: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error checking API status:', error);
    res.status(500).json({ error: 'Failed to check API status' });
  }
});

export default router;
