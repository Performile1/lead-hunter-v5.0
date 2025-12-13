import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query, transaction } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/assignments/salespeople
 * Hämta alla säljare (terminal managers ser sina, admin/manager ser alla)
 */
router.get('/salespeople',
  requireRole('admin', 'manager', 'terminal_manager'),
  asyncHandler(async (req, res) => {
    let salespeople;

    // Admin och Manager ser ALLA säljare
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      salespeople = await query(
        `SELECT DISTINCT
          u.id,
          u.full_name,
          u.email,
          u.role,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'postal_code', unnest_postal.postal_code,
                'region', ur.region_name
              )
            ) FILTER (WHERE unnest_postal.postal_code IS NOT NULL),
            '[]'
          ) as postal_codes,
          COUNT(DISTINCT l.id) as assigned_leads_count
        FROM users u
        LEFT JOIN user_regions ur ON ur.user_id = u.id
        LEFT JOIN LATERAL unnest(ur.postal_codes) AS unnest_postal(postal_code) ON true
        LEFT JOIN leads l ON l.assigned_salesperson_id = u.id
        WHERE u.role IN ('fs', 'ts', 'kam', 'dm')
          AND u.status = 'active'
        GROUP BY u.id, u.full_name, u.email, u.role
        ORDER BY u.full_name`
      );
    } else {
      // Terminal Manager ser bara säljare i sin terminal
      const terminalResult = await query(
        'SELECT id FROM terminals WHERE manager_user_id = $1',
        [req.userId]
      );

      if (terminalResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ingen terminal tilldelad' });
      }

      const terminalId = terminalResult.rows[0].id;

      salespeople = await query(
        `SELECT DISTINCT
          u.id,
          u.full_name,
          u.email,
          u.role,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'postal_code', unnest_postal.postal_code,
                'city', tpc.city
              )
            ) FILTER (WHERE unnest_postal.postal_code IS NOT NULL),
            '[]'
          ) as postal_codes,
          COUNT(DISTINCT l.id) as assigned_leads_count
        FROM users u
        LEFT JOIN user_regions ur ON ur.user_id = u.id
        LEFT JOIN LATERAL unnest(ur.postal_codes) AS unnest_postal(postal_code) ON true
        LEFT JOIN terminal_postal_codes tpc ON tpc.postal_code = unnest_postal.postal_code AND tpc.terminal_id = $1
        LEFT JOIN leads l ON l.assigned_salesperson_id = u.id
        WHERE u.role IN ('fs', 'ts', 'kam', 'dm')
          AND u.status = 'active'
          AND tpc.postal_code IS NOT NULL
        GROUP BY u.id, u.full_name, u.email, u.role
        ORDER BY u.full_name`,
        [terminalId]
      );
    }

    res.json({
      salespeople: salespeople.rows
    });
  })
);

/**
 * GET /api/assignments/unassigned-leads
 * Hämta otilldelade leads (admin/manager ser alla, terminal manager ser sina)
 */
router.get('/unassigned-leads',
  requireRole('admin', 'manager', 'terminal_manager'),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    let leads;

    // Admin och Manager ser ALLA otilldelade leads
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      leads = await query(
        `SELECT l.*,
                t.name as terminal_name,
                t.code as terminal_code,
                CASE 
                  WHEN l.assigned_salesperson_id IS NULL THEN 'unassigned'
                  ELSE 'assigned'
                END as assignment_status
         FROM leads l
         LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
         WHERE l.assigned_salesperson_id IS NULL
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } else {
      // Terminal Manager ser bara sina otilldelade leads
      const terminalResult = await query(
        'SELECT id FROM terminals WHERE manager_user_id = $1',
        [req.userId]
      );

      if (terminalResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ingen terminal tilldelad' });
      }

      const terminalId = terminalResult.rows[0].id;

      leads = await query(
        `SELECT l.*,
                CASE 
                  WHEN l.assigned_salesperson_id IS NULL THEN 'unassigned'
                  ELSE 'assigned'
                END as assignment_status
         FROM leads l
         WHERE l.assigned_terminal_id = $1
           AND l.assigned_salesperson_id IS NULL
         ORDER BY l.created_at DESC
         LIMIT $2 OFFSET $3`,
        [terminalId, limit, offset]
      );
    }

    res.json({
      leads: leads.rows,
      total: leads.rows.length
    });
  })
);

/**
 * POST /api/assignments/assign
 * Tilldela lead till säljare (admin/manager/terminal_manager)
 */
router.post('/assign',
  requireRole('admin', 'manager', 'terminal_manager'),
  sanitizeInput,
  [
    body('lead_id').isUUID(),
    body('salesperson_id').isUUID()
  ],
  auditLog('assign_lead'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_id, salesperson_id } = req.body;

    // Admin har alltid åtkomst
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Terminal manager måste ha åtkomst till leadet
      const terminalResult = await query(
        `SELECT t.id 
         FROM terminals t
         JOIN leads l ON l.assigned_terminal_id = t.id
         WHERE t.manager_user_id = $1 AND l.id = $2`,
        [req.userId, lead_id]
      );

      if (terminalResult.rows.length === 0) {
        return res.status(403).json({ error: 'Du har inte åtkomst till denna lead' });
      }
    }

    // Hämta lead info
    const leadResult = await query(
      'SELECT postal_code FROM leads WHERE id = $1',
      [lead_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead hittades inte' });
    }

    const leadPostalCode = leadResult.rows[0].postal_code;

    // Admin kan tilldela till vem som helst, andra måste matcha postnummer
    if (req.user.role !== 'admin') {
      const salespersonCheck = await query(
        `SELECT u.id 
         FROM users u
         JOIN user_regions ur ON ur.user_id = u.id
         WHERE u.id = $1 
           AND $2 = ANY(ur.postal_codes)`,
        [salesperson_id, leadPostalCode?.substring(0, 3)]
      );

      if (salespersonCheck.rows.length === 0) {
        return res.status(400).json({ 
          error: 'Säljaren har inte åtkomst till detta postnummer' 
        });
      }
    }

    // Tilldela lead
    await query(
      `UPDATE leads 
       SET assigned_salesperson_id = $1,
           assigned_at = NOW(),
           assigned_by = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [salesperson_id, req.userId, lead_id]
    );

    res.json({
      message: 'Lead tilldelad',
      lead_id,
      salesperson_id
    });
  })
);

/**
 * POST /api/assignments/bulk-assign
 * Tilldela flera leads till säljare
 */
router.post('/bulk-assign',
  requireRole('terminal_manager'),
  sanitizeInput,
  [
    body('lead_ids').isArray(),
    body('salesperson_id').isUUID()
  ],
  auditLog('bulk_assign_leads'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_ids, salesperson_id } = req.body;

    let assigned = 0;
    let failed = 0;

    for (const lead_id of lead_ids) {
      try {
        // Verifiera åtkomst
        const terminalResult = await query(
          `SELECT t.id, l.postal_code
           FROM terminals t
           JOIN leads l ON l.assigned_terminal_id = t.id
           WHERE t.manager_user_id = $1 AND l.id = $2`,
          [req.userId, lead_id]
        );

        if (terminalResult.rows.length === 0) {
          failed++;
          continue;
        }

        const leadPostalCode = terminalResult.rows[0].postal_code;

        // Kolla om säljaren har detta postnummer
        const salespersonCheck = await query(
          `SELECT u.id 
           FROM users u
           JOIN user_regions ur ON ur.user_id = u.id
           WHERE u.id = $1 
             AND $2 = ANY(ur.postal_codes)`,
          [salesperson_id, leadPostalCode?.substring(0, 3)]
        );

        if (salespersonCheck.rows.length === 0) {
          failed++;
          continue;
        }

        // Tilldela
        await query(
          `UPDATE leads 
           SET assigned_salesperson_id = $1,
               assigned_at = NOW(),
               assigned_by = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [salesperson_id, req.userId, lead_id]
        );

        assigned++;
      } catch (error) {
        console.error('Bulk assign error:', error);
        failed++;
      }
    }

    res.json({
      message: 'Bulk-tilldelning slutförd',
      assigned,
      failed,
      total: lead_ids.length
    });
  })
);

/**
 * DELETE /api/assignments/unassign/:leadId
 * Ta bort tilldelning från lead
 */
router.delete('/unassign/:leadId',
  requireRole('terminal_manager'),
  param('leadId').isUUID(),
  auditLog('unassign_lead'),
  asyncHandler(async (req, res) => {
    const { leadId } = req.params;

    // Verifiera åtkomst
    const terminalResult = await query(
      `SELECT t.id 
       FROM terminals t
       JOIN leads l ON l.assigned_terminal_id = t.id
       WHERE t.manager_user_id = $1 AND l.id = $2`,
      [req.userId, leadId]
    );

    if (terminalResult.rows.length === 0) {
      return res.status(403).json({ error: 'Du har inte åtkomst till denna lead' });
    }

    await query(
      `UPDATE leads 
       SET assigned_salesperson_id = NULL,
           assigned_at = NULL,
           assigned_by = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [leadId]
    );

    res.json({ message: 'Tilldelning borttagen' });
  })
);

/**
 * GET /api/assignments/my-leads
 * Hämta leads tilldelade till inloggad säljare
 */
router.get('/my-leads',
  requireRole('fs', 'ts', 'kam', 'dm'),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;

    const leads = await query(
      `SELECT l.*,
              u.full_name as assigned_by_name,
              t.name as terminal_name
       FROM leads l
       LEFT JOIN users u ON l.assigned_by = u.id
       LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
       WHERE l.assigned_salesperson_id = $1
       ORDER BY l.assigned_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    );

    res.json({
      leads: leads.rows,
      total: leads.rows.length
    });
  })
);

export default router;
