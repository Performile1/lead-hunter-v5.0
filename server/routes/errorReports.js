import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/error-reports
 * Create a new error report
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    entity_type,
    entity_id,
    entity_name,
    error_type,
    description,
    suggested_correction,
    current_data
  } = req.body;

  if (!entity_type || !entity_id || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await query(`
    INSERT INTO error_reports (
      entity_type,
      entity_id,
      entity_name,
      error_type,
      description,
      suggested_correction,
      current_data,
      reported_by,
      tenant_id,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *
  `, [
    entity_type,
    entity_id,
    entity_name,
    error_type,
    description,
    suggested_correction,
    JSON.stringify(current_data),
    req.userId,
    req.user.tenant_id
  ]);

  logger.info(`Error report created: ${entity_type} ${entity_id} by user ${req.userId}`);
  res.status(201).json({ report: result.rows[0] });
}));

/**
 * GET /api/admin/error-reports
 * Get all error reports (super admin only)
 */
router.get('/admin/error-reports', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { status } = req.query;
  
  let sql = `
    SELECT 
      er.*,
      u.full_name as reporter_name,
      t.company_name as tenant_name
    FROM error_reports er
    JOIN users u ON er.reported_by = u.id
    LEFT JOIN tenants t ON er.tenant_id = t.id
  `;

  const params = [];
  if (status && status !== 'all') {
    sql += ' WHERE er.status = $1';
    params.push(status);
  }

  sql += ' ORDER BY er.created_at DESC';

  const result = await query(sql, params);
  res.json({ reports: result.rows });
}));

/**
 * PUT /api/admin/error-reports/:id/status
 * Update error report status
 */
router.put('/admin/error-reports/:id/status', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected', 'corrected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = await query(`
    UPDATE error_reports
    SET status = $1, reviewed_at = NOW(), reviewed_by = $2
    WHERE id = $3
    RETURNING *
  `, [status, req.userId, id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Report not found' });
  }

  logger.info(`Error report ${id} status updated to ${status} by user ${req.userId}`);
  res.json({ report: result.rows[0] });
}));

/**
 * POST /api/admin/error-reports/:id/correct
 * Apply correction to entity
 */
router.post('/admin/error-reports/:id/correct', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { id } = req.params;
  const { correction_data } = req.body;

  // Get the error report
  const reportResult = await query('SELECT * FROM error_reports WHERE id = $1', [id]);
  if (reportResult.rows.length === 0) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const report = reportResult.rows[0];
  const correctionObj = typeof correction_data === 'string' ? JSON.parse(correction_data) : correction_data;

  // Build update query based on entity type
  const table = report.entity_type === 'lead' ? 'leads' : 'customers';
  const updates = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(correctionObj)) {
    updates.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No corrections provided' });
  }

  values.push(report.entity_id);

  // Apply correction
  await query(`
    UPDATE ${table}
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
  `, values);

  // Update report status
  await query(`
    UPDATE error_reports
    SET status = 'corrected', reviewed_at = NOW(), reviewed_by = $1, correction_applied = $2
    WHERE id = $3
  `, [req.userId, JSON.stringify(correctionObj), id]);

  logger.info(`Correction applied to ${report.entity_type} ${report.entity_id} from report ${id}`);
  res.json({ message: 'Correction applied successfully' });
}));

export default router;
