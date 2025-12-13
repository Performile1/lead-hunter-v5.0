import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { scrapeWebsite } from '../services/websiteScraperService.js';
import { filterCustomersByPermission, requireAdmin } from '../middleware/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/customers
 * Lista alla kunder med filtrering och sökning
 */
router.get('/', 
  filterCustomersByPermission,
  asyncHandler(async (req, res) => {
  const { 
    search, 
    status = 'active', 
    tier,
    account_manager,
    monitor_only,
    page = 1,
    limit = 50 
  } = req.query;

  let whereConditions = [];
  let params = [];
  let paramIndex = 1;

  // Status filter
  if (status && status !== 'all') {
    whereConditions.push(`customer_status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  // Segment filter (replaces tier)
  if (req.query.segment) {
    whereConditions.push(`segment = $${paramIndex}`);
    params.push(req.query.segment);
    paramIndex++;
  }

  // Area filter (for terminalchefer)
  if (req.query.area) {
    whereConditions.push(`area = $${paramIndex}`);
    params.push(req.query.area);
    paramIndex++;
  }

  // Account manager filter
  if (account_manager) {
    whereConditions.push(`account_manager_id = $${paramIndex}`);
    params.push(account_manager);
    paramIndex++;
  }

  // Monitor only filter
  if (monitor_only === 'true') {
    whereConditions.push('monitor_checkout = true');
  }

  // Search filter
  if (search) {
    whereConditions.push(`(
      company_name ILIKE $${paramIndex} OR 
      org_number ILIKE $${paramIndex} OR
      address ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM customers ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const result = await query(
    `SELECT 
      c.*,
      u.full_name as account_manager_name,
      (SELECT COUNT(*) FROM customer_monitoring_history WHERE customer_id = c.id) as monitoring_count,
      (SELECT monitored_at FROM customer_monitoring_history WHERE customer_id = c.id ORDER BY monitored_at DESC LIMIT 1) as last_monitored
    FROM customers c
    LEFT JOIN users u ON c.account_manager_id = u.id
    ${whereClause}
    ORDER BY c.updated_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  res.json({
    customers: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * GET /api/customers/:id
 * Hämta en specifik kund med full historik
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      c.*,
      u.full_name as account_manager_name,
      u.email as account_manager_email
    FROM customers c
    LEFT JOIN users u ON c.account_manager_id = u.id
    WHERE c.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Kund hittades inte' });
  }

  const customer = result.rows[0];

  // Hämta monitoring history
  const historyResult = await query(
    `SELECT * FROM customer_monitoring_history 
     WHERE customer_id = $1 
     ORDER BY monitored_at DESC 
     LIMIT 50`,
    [id]
  );

  // Hämta notes
  const notesResult = await query(
    `SELECT cn.*, u.full_name as author_name
     FROM customer_notes cn
     LEFT JOIN users u ON cn.user_id = u.id
     WHERE cn.customer_id = $1
     ORDER BY cn.created_at DESC`,
    [id]
  );

  res.json({
    customer,
    monitoring_history: historyResult.rows,
    notes: notesResult.rows
  });
}));

/**
 * POST /api/customers
 * Skapa ny kund
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    company_name,
    org_number,
    address,
    website_url,
    segment,
    customer_since,
    account_manager_id,
    customer_tier,
    annual_contract_value,
    monitor_checkout = true,
    monitor_frequency = 'daily',
    monitor_times = ['09:00', '15:00', '21:00']
  } = req.body;

  if (!company_name) {
    return res.status(400).json({ error: 'Företagsnamn krävs' });
  }

  const result = await query(
    `INSERT INTO customers (
      company_name, org_number, address, website_url, segment,
      customer_since, account_manager_id, customer_tier, 
      annual_contract_value, monitor_checkout, monitor_frequency,
      monitor_times, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      company_name, org_number, address, website_url, segment,
      customer_since, account_manager_id, customer_tier,
      annual_contract_value, monitor_checkout, monitor_frequency,
      monitor_times, req.user.id
    ]
  );

  const customer = result.rows[0];

  // Skapa monitoring schedule om monitoring är aktiverat
  if (monitor_checkout) {
    await query(
      `INSERT INTO customer_monitoring_schedule (
        customer_id, enabled, frequency, schedule_times, next_run_at
      ) VALUES ($1, true, $2, $3, NOW())`,
      [customer.id, monitor_frequency, monitor_times]
    );
  }

  res.status(201).json(customer);
}));

/**
 * PUT /api/customers/:id
 * Uppdatera kund
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Build dynamic update query
  const fields = Object.keys(updates).filter(key => 
    !['id', 'created_at', 'created_by'].includes(key)
  );
  
  if (fields.length === 0) {
    return res.status(400).json({ error: 'Inga fält att uppdatera' });
  }

  const setClause = fields.map((field, index) => 
    `${field} = $${index + 2}`
  ).join(', ');

  const values = [id, ...fields.map(field => updates[field])];

  const result = await query(
    `UPDATE customers 
     SET ${setClause}, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Kund hittades inte' });
  }

  res.json(result.rows[0]);
}));

/**
 * DELETE /api/customers/:id
 * Ta bort kund
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM customers WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Kund hittades inte' });
  }

  res.json({ message: 'Kund borttagen', customer: result.rows[0] });
}));

/**
 * POST /api/customers/:id/scrape
 * Manuell scraping av kundens webbplats
 */
router.post('/:id/scrape', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Hämta kund
  const customerResult = await query(
    'SELECT * FROM customers WHERE id = $1',
    [id]
  );

  if (customerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Kund hittades inte' });
  }

  const customer = customerResult.rows[0];

  if (!customer.website_url) {
    return res.status(400).json({ error: 'Kund saknar webbadress' });
  }

  // Scrapa webbplats
  const startTime = Date.now();
  let scrapeSuccess = true;
  let scrapeError = null;

  try {
    const websiteData = await scrapeWebsite(customer.website_url);
    const scrapeDuration = Date.now() - startTime;

    // Uppdatera customer med scraping data
    await query(
      `UPDATE customers 
       SET website_analysis = $1, last_monitored_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(websiteData), id]
    );

    // Spara i monitoring history
    const dhlIndex = websiteData.shipping_providers?.findIndex(p => 
      p.toLowerCase().includes('dhl')
    );

    await query(
      `INSERT INTO customer_monitoring_history (
        customer_id, monitored_at, checkout_position, total_shipping_options,
        shipping_providers, dhl_position, scrape_duration_ms, scrape_success
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, true)`,
      [
        id,
        dhlIndex >= 0 ? dhlIndex + 1 : null,
        websiteData.shipping_providers?.length || 0,
        websiteData.shipping_providers || [],
        dhlIndex >= 0 ? dhlIndex + 1 : null,
        scrapeDuration
      ]
    );

    res.json({
      success: true,
      website_data: websiteData,
      scrape_duration_ms: scrapeDuration
    });

  } catch (error) {
    scrapeSuccess = false;
    scrapeError = error.message;

    // Spara misslyckad scraping i history
    await query(
      `INSERT INTO customer_monitoring_history (
        customer_id, monitored_at, scrape_success, scrape_error
      ) VALUES ($1, NOW(), false, $2)`,
      [id, scrapeError]
    );

    res.status(500).json({
      success: false,
      error: 'Scraping misslyckades',
      details: scrapeError
    });
  }
}));

/**
 * GET /api/customers/:id/monitoring-history
 * Hämta monitoring-historik för kund
 */
router.get('/:id/monitoring-history', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 100 } = req.query;

  const result = await query(
    `SELECT * FROM customer_monitoring_history 
     WHERE customer_id = $1 
     ORDER BY monitored_at DESC 
     LIMIT $2`,
    [id, limit]
  );

  res.json(result.rows);
}));

/**
 * POST /api/customers/:id/notes
 * Lägg till anteckning för kund
 */
router.post('/:id/notes', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note_type, subject, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Innehåll krävs' });
  }

  const result = await query(
    `INSERT INTO customer_notes (customer_id, user_id, note_type, subject, content)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, req.user.id, note_type, subject, content]
  );

  res.status(201).json(result.rows[0]);
}));

/**
 * GET /api/customers/at-risk
 * Hämta kunder som är i riskzonen
 */
router.get('/analytics/at-risk', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM customers_at_risk ORDER BY last_check DESC');
  res.json(result.rows);
}));

/**
 * GET /api/customers/monitoring-queue
 * Hämta kunder som ska övervakas nu
 */
router.get('/analytics/monitoring-queue', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM monitoring_queue LIMIT 100');
  res.json(result.rows);
}));

export default router;
