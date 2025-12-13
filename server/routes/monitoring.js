import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/monitoring/watch
 * Lägg till bevakning på lead
 */
router.post('/watch',
  sanitizeInput,
  [
    body('lead_id').isUUID(),
    body('interval_days').isInt({ min: 1, max: 365 }),
    body('notification_email').optional().isEmail(),
    body('auto_reanalyze').optional().isBoolean()
  ],
  auditLog('add_lead_watch'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      lead_id, 
      interval_days, 
      notification_email, 
      auto_reanalyze,
      triggers,
      revenue_change_threshold_percent 
    } = req.body;

    // Verifiera att leadet finns
    const leadResult = await query(
      'SELECT id, company_name FROM leads WHERE id = $1',
      [lead_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead hittades inte' });
    }

    // Skapa bevakning med triggers
    const result = await query(
      `INSERT INTO lead_monitoring (
        lead_id, 
        user_id, 
        interval_days, 
        next_check_date,
        notification_email,
        auto_reanalyze,
        is_active,
        trigger_revenue_increase,
        trigger_revenue_decrease,
        trigger_bankruptcy,
        trigger_liquidation,
        trigger_payment_remarks,
        trigger_warehouse_move,
        trigger_news,
        trigger_segment_change,
        revenue_change_threshold_percent
      ) VALUES ($1, $2, $3, NOW() + INTERVAL '1 day' * $3, $4, $5, true, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        lead_id, 
        req.userId, 
        interval_days, 
        notification_email || req.user.email, 
        auto_reanalyze || false,
        triggers?.revenue_increase || false,
        triggers?.revenue_decrease || false,
        triggers?.bankruptcy || false,
        triggers?.liquidation || false,
        triggers?.payment_remarks || false,
        triggers?.warehouse_move || false,
        triggers?.news || false,
        triggers?.segment_change || false,
        revenue_change_threshold_percent || 10
      ]
    );

    res.json({
      message: 'Bevakning skapad',
      monitoring: result.rows[0],
      company_name: leadResult.rows[0].company_name
    });
  })
);

/**
 * GET /api/monitoring/my-watches
 * Hämta mina bevakningar
 */
router.get('/my-watches',
  asyncHandler(async (req, res) => {
    const watches = await query(
      `SELECT 
        lm.*,
        l.company_name,
        l.org_number,
        l.segment,
        l.revenue_tkr,
        l.updated_at as last_analyzed
      FROM lead_monitoring lm
      JOIN leads l ON lm.lead_id = l.id
      WHERE lm.user_id = $1 AND lm.is_active = true
      ORDER BY lm.next_check_date ASC`,
      [req.userId]
    );

    res.json({
      watches: watches.rows,
      total: watches.rows.length
    });
  })
);

/**
 * GET /api/monitoring/due
 * Hämta bevakningar som ska köras (för cron job)
 */
router.get('/due',
  asyncHandler(async (req, res) => {
    const dueWatches = await query(
      `SELECT 
        lm.*,
        l.company_name,
        l.org_number,
        l.segment,
        u.email as user_email,
        u.full_name as user_name
      FROM lead_monitoring lm
      JOIN leads l ON lm.lead_id = l.id
      JOIN users u ON lm.user_id = u.id
      WHERE lm.is_active = true 
        AND lm.next_check_date <= NOW()
      ORDER BY lm.next_check_date ASC
      LIMIT 100`
    );

    res.json({
      due_watches: dueWatches.rows,
      count: dueWatches.rows.length
    });
  })
);

/**
 * POST /api/monitoring/:id/execute
 * Kör bevakning manuellt
 */
router.post('/:id/execute',
  param('id').isUUID(),
  auditLog('execute_monitoring'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Hämta bevakning
    const watchResult = await query(
      `SELECT lm.*, l.company_name, l.org_number, l.revenue_tkr as old_revenue
       FROM lead_monitoring lm
       JOIN leads l ON lm.lead_id = l.id
       WHERE lm.id = $1 AND lm.user_id = $2`,
      [id, req.userId]
    );

    if (watchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bevakning hittades inte' });
    }

    const watch = watchResult.rows[0];

    // Här skulle vi köra re-analys
    // För nu, simulera med att hämta ny data
    const changes = {
      revenue_changed: false,
      segment_changed: false,
      status_changed: false,
      new_revenue: watch.old_revenue,
      old_revenue: watch.old_revenue
    };

    // Logga körning
    await query(
      `INSERT INTO monitoring_executions (
        monitoring_id,
        executed_at,
        changes_detected,
        changes_data
      ) VALUES ($1, NOW(), $2, $3)`,
      [id, JSON.stringify(changes), JSON.stringify(changes)]
    );

    // Uppdatera nästa körning
    await query(
      `UPDATE lead_monitoring 
       SET next_check_date = NOW() + INTERVAL '1 day' * $1,
           last_check_date = NOW(),
           check_count = check_count + 1
       WHERE id = $2`,
      [watch.interval_days, id]
    );

    res.json({
      message: 'Bevakning körd',
      company_name: watch.company_name,
      changes
    });
  })
);

/**
 * DELETE /api/monitoring/:id
 * Ta bort bevakning
 */
router.delete('/:id',
  param('id').isUUID(),
  auditLog('delete_monitoring'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await query(
      `UPDATE lead_monitoring 
       SET is_active = false 
       WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    res.json({ message: 'Bevakning borttagen' });
  })
);

/**
 * GET /api/monitoring/:id/history
 * Hämta historik för bevakning
 */
router.get('/:id/history',
  param('id').isUUID(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const history = await query(
      `SELECT * FROM monitoring_executions
       WHERE monitoring_id = $1
       ORDER BY executed_at DESC
       LIMIT 50`,
      [id]
    );

    res.json({
      history: history.rows
    });
  })
);

export default router;
