import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/admin/leads
 * Search all leads across tenants (super admin only)
 */
router.get('/leads', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { search, tenant_id, anonymized } = req.query;
  
  let sql = `
    SELECT 
      l.*,
      t.company_name as tenant_name
    FROM leads l
    LEFT JOIN tenants t ON l.tenant_id = t.id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (search) {
    sql += ` AND (l.company_name ILIKE $${paramIndex} OR l.domain ILIKE $${paramIndex} OR l.ecommerce_platform ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (tenant_id) {
    sql += ` AND l.tenant_id = $${paramIndex}`;
    params.push(tenant_id);
    paramIndex++;
  }

  if (anonymized === 'true') {
    sql += ` AND l.is_anonymized = true`;
  }

  sql += ' ORDER BY l.created_at DESC LIMIT 1000';

  const result = await query(sql, params);
  res.json({ leads: result.rows });
}));

/**
 * POST /api/admin/leads/:id/analyze
 * Analyze or re-analyze a lead (super admin only)
 */
router.post('/leads/:id/analyze', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { id } = req.params;

  // Get the lead
  const leadResult = await query('SELECT * FROM leads WHERE id = $1', [id]);
  if (leadResult.rows.length === 0) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const lead = leadResult.rows[0];

  // Update analysis status to pending
  await query(`
    UPDATE leads
    SET analysis_status = 'pending', updated_at = NOW()
    WHERE id = $1
  `, [id]);

  // Here you would trigger the actual analysis
  // For now, we'll simulate it by updating the status
  try {
    // TODO: Call your analysis service here
    // const analysisResult = await analyzeLeadService(lead.domain);
    
    // Simulate analysis completion
    await query(`
      UPDATE leads
      SET 
        analysis_status = 'completed',
        analyzed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `, [id]);

    logger.info(`Lead ${id} analyzed by super admin ${req.userId}`);
    res.json({ 
      message: 'Lead analysis initiated successfully',
      lead_id: id,
      status: 'completed'
    });
  } catch (error) {
    // Mark as failed
    await query(`
      UPDATE leads
      SET analysis_status = 'failed', updated_at = NOW()
      WHERE id = $1
    `, [id]);
    
    throw error;
  }
}));

/**
 * POST /api/admin/leads/:id/anonymize
 * Anonymize a lead for cross-tenant usage
 */
router.post('/leads/:id/anonymize', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { id } = req.params;

  // Get the lead
  const leadResult = await query('SELECT * FROM leads WHERE id = $1', [id]);
  if (leadResult.rows.length === 0) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const lead = leadResult.rows[0];

  // Create anonymized version
  const anonymizedData = {
    company_name: `Company_${lead.id.substring(0, 8)}`, // Anonymize name
    domain: null, // Remove domain
    ecommerce_platform: lead.ecommerce_platform,
    carriers: lead.carriers,
    checkout_position: lead.checkout_position,
    delivery_services: lead.delivery_services,
    revenue: lead.revenue ? Math.round(lead.revenue / 1000000) * 1000000 : null, // Round to nearest million
    employees: lead.employees ? Math.round(lead.employees / 10) * 10 : null, // Round to nearest 10
    industry: lead.industry,
    is_anonymized: true,
    original_tenant_id: lead.tenant_id,
    anonymized_at: new Date(),
    anonymized_by: req.userId
  };

  // Insert into anonymized_leads table or update existing lead
  await query(`
    UPDATE leads
    SET 
      company_name = $1,
      domain = $2,
      is_anonymized = true,
      original_tenant_id = $3,
      anonymized_at = NOW(),
      anonymized_by = $4
    WHERE id = $5
  `, [
    anonymizedData.company_name,
    anonymizedData.domain,
    lead.tenant_id,
    req.userId,
    id
  ]);

  logger.info(`Lead ${id} anonymized by user ${req.userId}`);
  res.json({ message: 'Lead anonymized successfully', anonymized_data: anonymizedData });
}));

/**
 * GET /api/admin/customers
 * Get all customers across tenants (super admin only)
 */
router.get('/customers', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { search, tenant_id, uses_dhl } = req.query;
  
  let sql = `
    SELECT 
      c.*,
      t.company_name as tenant_name
    FROM customers c
    LEFT JOIN tenants t ON c.tenant_id = t.id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (search) {
    sql += ` AND (c.company_name ILIKE $${paramIndex} OR c.domain ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (tenant_id) {
    sql += ` AND c.tenant_id = $${paramIndex}`;
    params.push(tenant_id);
    paramIndex++;
  }

  if (uses_dhl !== undefined) {
    sql += ` AND c.uses_dhl = $${paramIndex}`;
    params.push(uses_dhl === 'true');
    paramIndex++;
  }

  sql += ' ORDER BY c.created_at DESC LIMIT 500';

  const result = await query(sql, params);
  res.json({ customers: result.rows });
}));

export default router;
