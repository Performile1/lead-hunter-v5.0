import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Alla routes kräver autentisering
router.use(authenticate);

/**
 * GET /api/tenants
 * Hämta alla tenants (endast super admin)
 */
router.get('/', asyncHandler(async (req, res) => {
  // Super admin ser alla tenants, tenant admin ser bara sin egen
  if (!req.isSuperAdmin && !req.user.tenant_id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  let sql = `
      SELECT 
        t.*,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT l.id) as lead_count,
        COUNT(DISTINCT c.id) as customer_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN leads l ON l.tenant_id = t.id
      LEFT JOIN customers c ON c.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.company_name
    `;

  const params = [];
  
  // Tenant admin ser bara sin egen tenant
  if (!req.isSuperAdmin && req.user.tenant_id) {
    sql = sql.replace('ORDER BY', 'WHERE t.id = $1 ORDER BY');
    params.push(req.user.tenant_id);
  }

  const result = await query(sql, params);
  res.json({ tenants: result.rows });
}));

/**
 * GET /api/tenants/:id
 * Hämta specifik tenant (super admin eller tenant admin)
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Kontrollera åtkomst
  if (!req.isSuperAdmin && req.user.tenant_id !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const result = await query(`
      SELECT 
        t.*,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT l.id) as lead_count,
        COUNT(DISTINCT c.id) as customer_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN leads l ON l.tenant_id = t.id
      LEFT JOIN customers c ON c.tenant_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  res.json({ tenant: result.rows[0] });
}));

/**
 * POST /api/tenants
 * Skapa ny tenant (endast super admin)
 */
router.post('/', asyncHandler(async (req, res) => {
  // Endast super admin kan skapa tenants
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  const {
      company_name,
      domain,
      subdomain,
      checkout_search_term,
      main_competitor,
      subscription_tier = 'basic',
      max_users = 10,
      max_leads_per_month = 1000,
      max_customers = 500,
      logo_url,
      primary_color = '#D40511',
      secondary_color = '#FFCC00'
    } = req.body;

    // Validering
    if (!company_name || !domain || !checkout_search_term) {
      return res.status(400).json({ 
        error: 'Missing required fields: company_name, domain, checkout_search_term' 
      });
    }

    // Kontrollera att domän inte redan finns
    const existingTenant = await query(
      'SELECT id FROM tenants WHERE domain = $1',
      [domain]
    );

    if (existingTenant.rows.length > 0) {
      return res.status(409).json({ error: 'Domain already exists' });
    }

    // Skapa tenant
    const result = await query(`
      INSERT INTO tenants (
        company_name,
        domain,
        subdomain,
        checkout_search_term,
        main_competitor,
        subscription_tier,
        max_users,
        max_leads_per_month,
        max_customers,
        logo_url,
        primary_color,
        secondary_color,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      company_name,
      domain,
      subdomain,
      checkout_search_term,
      main_competitor,
      subscription_tier,
      max_users,
      max_leads_per_month,
      max_customers,
      logo_url,
      primary_color,
      secondary_color,
      req.userId
    ]);

    logger.info(`Tenant created: ${company_name} (${domain}) by user ${req.userId}`);
    res.status(201).json({ tenant: result.rows[0] });
}));

/**
 * PUT /api/tenants/:id
 * Uppdatera tenant (super admin eller tenant admin)
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Kontrollera åtkomst
  if (!req.isSuperAdmin && req.user.tenant_id !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }

    // Tenant admin kan inte ändra vissa fält
    const allowedFields = req.isSuperAdmin 
      ? [
          'company_name', 'domain', 'subdomain', 'checkout_search_term', 'main_competitor',
          'subscription_tier', 'max_users', 'max_leads_per_month', 'max_customers',
          'logo_url', 'primary_color', 'secondary_color', 'is_active',
          'google_api_key_encrypted', 'gemini_api_key_encrypted', 'linkedin_api_key_encrypted'
        ]
      : [
          'company_name', 'subdomain', 'checkout_search_term', 'main_competitor',
          'logo_url', 'primary_color', 'secondary_color'
        ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(`
    UPDATE tenants
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  logger.info(`Tenant updated: ${id} by user ${req.userId}`);
  res.json({ tenant: result.rows[0] });
}));

/**
 * DELETE /api/tenants/:id
 * Ta bort tenant (endast super admin)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  // Endast super admin kan ta bort tenants
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { id } = req.params;

  // Kontrollera att tenant finns
  const tenantCheck = await query(
    'SELECT company_name FROM tenants WHERE id = $1',
    [id]
  );

  if (tenantCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  // Ta bort tenant (CASCADE tar bort all relaterad data)
  await query('DELETE FROM tenants WHERE id = $1', [id]);

  logger.warn(`Tenant deleted: ${tenantCheck.rows[0].company_name} by user ${req.userId}`);
  res.json({ message: 'Tenant deleted successfully' });
}));

/**
 * GET /api/tenants/:id/usage
 * Hämta usage statistics för tenant
 */
router.get('/:id/usage', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Kontrollera åtkomst
  if (!req.isSuperAdmin && req.user.tenant_id !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const result = await query(`
    SELECT * FROM tenant_usage
    WHERE tenant_id = $1
    ORDER BY month DESC
    LIMIT 12
  `, [id]);

  res.json({ usage: result.rows });
}));

/**
 * GET /api/tenants/:id/statistics
 * Hämta detaljerad statistik för tenant
 */
router.get('/:id/statistics', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Kontrollera åtkomst
  if (!req.isSuperAdmin && req.user.tenant_id !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }

    // Hämta statistik
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
        (SELECT COUNT(*) FROM leads WHERE tenant_id = $1) as total_leads,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = $1) as total_customers,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = $1 AND uses_dhl = true) as customers_using_us,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = $1 AND uses_competitor = true) as customers_using_competitor,
        (SELECT COUNT(*) FROM monitoring_history WHERE tenant_id = $1) as total_monitoring_checks,
        (SELECT COUNT(*) FROM cronjobs WHERE tenant_id = $1 AND is_active = true) as active_cronjobs
    `, [id]);

    // Hämta current month usage
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const usage = await query(`
      SELECT * FROM tenant_usage
      WHERE tenant_id = $1 AND month = $2
    `, [id, currentMonth]);

    res.json({
      statistics: stats.rows[0],
      currentMonthUsage: usage.rows[0] || {
        leads_created: 0,
        customers_created: 0,
        api_calls: 0,
        monitoring_checks: 0
      }
    });
}));

/**
 * GET /api/tenants/current
 * Hämta current user's tenant info
 */
router.get('/current/info', asyncHandler(async (req, res) => {
  if (!req.user.tenant_id) {
    return res.status(404).json({ error: 'No tenant associated' });
  }

  const result = await query(`
      SELECT 
        t.*,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT l.id) as lead_count,
        COUNT(DISTINCT c.id) as customer_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN leads l ON l.tenant_id = t.id
      LEFT JOIN customers c ON c.tenant_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [req.user.tenant_id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  res.json({ tenant: result.rows[0] });
}));

export default router;
