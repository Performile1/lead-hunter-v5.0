import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/audit-compliance/activity-log
 * Komplett audit log
 */
router.get('/activity-log',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { user_id, action_type, start_date, end_date, limit = 100 } = req.query;
    
    let sql = `
      SELECT 
        al.id,
        al.user_id,
        u.email as user_email,
        u.full_name as user_name,
        t.company_name as tenant_name,
        al.action_type,
        al.details,
        al.ip_address,
        al.created_at
      FROM activity_log al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Tenant filter for non-super admins
    if (!req.isSuperAdmin && req.tenantId) {
      sql += ` AND u.tenant_id = $${paramIndex}`;
      params.push(req.tenantId);
      paramIndex++;
    }

    if (user_id) {
      sql += ` AND al.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (action_type) {
      sql += ` AND al.action_type = $${paramIndex}`;
      params.push(action_type);
      paramIndex++;
    }

    if (start_date) {
      sql += ` AND al.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      sql += ` AND al.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    sql += ` ORDER BY al.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);

    res.json({ 
      logs: result.rows,
      count: result.rows.length
    });
  })
);

/**
 * GET /api/audit-compliance/data-access
 * Spåra vem som har åtkomst till vilken data
 */
router.get('/data-access',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { entity_type = 'lead', entity_id } = req.query;

    let sql = `
      SELECT 
        al.user_id,
        u.email,
        u.full_name,
        t.company_name as tenant,
        al.action_type,
        al.created_at,
        al.ip_address
      FROM activity_log al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE al.details->>'entity_type' = $1
    `;

    const params = [entity_type];

    if (entity_id) {
      sql += ` AND al.details->>'entity_id' = $2`;
      params.push(entity_id);
    }

    sql += ` ORDER BY al.created_at DESC LIMIT 100`;

    const result = await query(sql, params);

    res.json({ 
      access_log: result.rows,
      entity_type,
      entity_id: entity_id || 'all'
    });
  })
);

/**
 * GET /api/audit-compliance/gdpr-exports
 * Spåra GDPR data exports
 */
router.get('/gdpr-exports',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let tenantFilter = '';
    const params = [];

    if (!req.isSuperAdmin && req.tenantId) {
      tenantFilter = 'AND u.tenant_id = $1';
      params.push(req.tenantId);
    }

    const result = await query(`
      SELECT 
        al.id,
        u.email as user_email,
        u.full_name as user_name,
        t.company_name as tenant_name,
        al.details,
        al.created_at,
        al.ip_address
      FROM activity_log al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE al.action_type = 'data_export'
        ${tenantFilter}
      ORDER BY al.created_at DESC
      LIMIT 100
    `, params);

    res.json({ 
      exports: result.rows,
      count: result.rows.length
    });
  })
);

/**
 * GET /api/audit-compliance/security-events
 * Säkerhetshändelser (failed logins, etc.)
 */
router.get('/security-events',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { severity = 'all', period = '7' } = req.query;

    let sql = `
      SELECT 
        al.id,
        al.user_id,
        u.email as user_email,
        al.action_type,
        al.details,
        al.ip_address,
        al.created_at
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action_type IN ('failed_login', 'password_reset', 'account_locked', 'unauthorized_access')
        AND al.created_at > NOW() - INTERVAL '${parseInt(period)} days'
    `;

    if (severity !== 'all') {
      sql += ` AND al.details->>'severity' = '${severity}'`;
    }

    sql += ` ORDER BY al.created_at DESC LIMIT 200`;

    const result = await query(sql);

    res.json({ 
      security_events: result.rows,
      period_days: parseInt(period),
      count: result.rows.length
    });
  })
);

/**
 * POST /api/audit-compliance/log-event
 * Logga compliance-händelse
 */
router.post('/log-event',
  asyncHandler(async (req, res) => {
    const { action_type, details, severity = 'info' } = req.body;

    if (!action_type) {
      return res.status(400).json({ error: 'action_type required' });
    }

    const result = await query(
      `INSERT INTO activity_log (user_id, action_type, details, ip_address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, action_type, JSON.stringify({ ...details, severity }), req.ip]
    );

    res.status(201).json({ event: result.rows[0] });
  })
);

export default router;
