import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/terminals
 * Hämta alla terminaler
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const terminals = await query(
      `SELECT t.*, 
              u.full_name as manager_name,
              COUNT(DISTINCT l.id) as leads_count
       FROM terminals t
       LEFT JOIN users u ON t.manager_user_id = u.id
       LEFT JOIN leads l ON l.assigned_terminal_id = t.id
       WHERE t.status = 'active'
       GROUP BY t.id, u.full_name
       ORDER BY t.name`
    );

    res.json({
      terminals: terminals.rows
    });
  })
);

/**
 * POST /api/terminals/reassign-lead
 * Flytta lead till annan terminal (admin/manager)
 */
router.post('/reassign-lead',
  requireRole('admin', 'manager'),
  sanitizeInput,
  [
    body('lead_id').isUUID(),
    body('terminal_id').isUUID()
  ],
  auditLog('reassign_lead_terminal'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_id, terminal_id } = req.body;

    // Verifiera att terminal finns
    const terminalResult = await query(
      'SELECT id, name FROM terminals WHERE id = $1 AND status = $\'active\'',
      [terminal_id]
    );

    if (terminalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Terminal hittades inte' });
    }

    // Flytta lead till ny terminal och ta bort säljare-tilldelning
    await query(
      `UPDATE leads 
       SET assigned_terminal_id = $1,
           assigned_salesperson_id = NULL,
           assigned_at = NULL,
           assigned_by = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [terminal_id, lead_id]
    );

    res.json({
      message: 'Lead flyttat till ny terminal',
      lead_id,
      terminal_id,
      terminal_name: terminalResult.rows[0].name
    });
  })
);

/**
 * POST /api/terminals/bulk-reassign
 * Flytta flera leads till annan terminal (admin/manager)
 */
router.post('/bulk-reassign',
  requireRole('admin', 'manager'),
  sanitizeInput,
  [
    body('lead_ids').isArray(),
    body('terminal_id').isUUID()
  ],
  auditLog('bulk_reassign_terminal'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_ids, terminal_id } = req.body;

    // Verifiera att terminal finns
    const terminalResult = await query(
      'SELECT id, name FROM terminals WHERE id = $1 AND status = \'active\'',
      [terminal_id]
    );

    if (terminalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Terminal hittades inte' });
    }

    let reassigned = 0;

    for (const lead_id of lead_ids) {
      try {
        await query(
          `UPDATE leads 
           SET assigned_terminal_id = $1,
               assigned_salesperson_id = NULL,
               assigned_at = NULL,
               assigned_by = NULL,
               updated_at = NOW()
           WHERE id = $2`,
          [terminal_id, lead_id]
        );
        reassigned++;
      } catch (error) {
        console.error('Bulk reassign error:', error);
      }
    }

    res.json({
      message: 'Leads flyttade till ny terminal',
      reassigned,
      total: lead_ids.length,
      terminal_name: terminalResult.rows[0].name
    });
  })
);

/**
 * POST /api/terminals/transfer-salesperson
 * Flytta lead mellan säljare (admin kan flytta mellan alla, manager/terminal_manager inom terminal)
 */
router.post('/transfer-salesperson',
  requireRole('admin', 'manager', 'terminal_manager'),
  sanitizeInput,
  [
    body('lead_id').isUUID(),
    body('from_salesperson_id').isUUID(),
    body('to_salesperson_id').isUUID()
  ],
  auditLog('transfer_salesperson'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_id, from_salesperson_id, to_salesperson_id } = req.body;

    // Verifiera att leadet finns och är tilldelat rätt säljare
    const leadResult = await query(
      `SELECT l.*, t.manager_user_id
       FROM leads l
       LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
       WHERE l.id = $1 AND l.assigned_salesperson_id = $2`,
      [lead_id, from_salesperson_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Lead hittades inte eller är inte tilldelat angiven säljare' 
      });
    }

    const lead = leadResult.rows[0];

    // Kontrollera behörighet
    if (req.user.role === 'terminal_manager') {
      if (lead.manager_user_id !== req.userId) {
        return res.status(403).json({ 
          error: 'Du kan bara flytta leads inom din terminal' 
        });
      }
    }

    // Verifiera att ny säljare finns
    const newSalespersonResult = await query(
      'SELECT id, full_name FROM users WHERE id = $1 AND status = \'active\'',
      [to_salesperson_id]
    );

    if (newSalespersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ny säljare hittades inte' });
    }

    // Flytta lead
    await query(
      `UPDATE leads 
       SET assigned_salesperson_id = $1,
           assigned_at = NOW(),
           assigned_by = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [to_salesperson_id, req.userId, lead_id]
    );

    res.json({
      message: 'Lead flyttat till ny säljare',
      lead_id,
      to_salesperson: newSalespersonResult.rows[0].full_name
    });
  })
);

export default router;
