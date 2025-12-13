import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/lead-management/change-segment
 * Ändra segment för ett lead (alla användare kan göra detta)
 */
router.post('/change-segment',
  sanitizeInput,
  [
    body('lead_id').isUUID(),
    body('new_segment').isIn(['FS', 'TS', 'KAM', 'DM', 'UNKNOWN']),
    body('reason').optional().trim()
  ],
  auditLog('change_segment'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_id, new_segment, reason } = req.body;

    // Hämta nuvarande lead-info
    const leadResult = await query(
      'SELECT id, company_name, segment FROM leads WHERE id = $1',
      [lead_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead hittades inte' });
    }

    const lead = leadResult.rows[0];
    const old_segment = lead.segment;

    // Uppdatera segment
    await query(
      'UPDATE leads SET segment = $1, updated_at = NOW() WHERE id = $2',
      [new_segment, lead_id]
    );

    // Logga ändringen i activity_logs
    await query(
      `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.userId,
        'change_segment',
        'lead',
        lead_id,
        JSON.stringify({
          company_name: lead.company_name,
          old_segment,
          new_segment,
          reason: reason || 'Ingen anledning angiven'
        })
      ]
    );

    res.json({
      message: 'Segment ändrat',
      lead_id,
      old_segment,
      new_segment,
      company_name: lead.company_name
    });
  })
);

/**
 * POST /api/lead-management/bulk-change-segment
 * Ändra segment för flera leads samtidigt
 */
router.post('/bulk-change-segment',
  sanitizeInput,
  [
    body('lead_ids').isArray(),
    body('new_segment').isIn(['FS', 'TS', 'KAM', 'DM', 'UNKNOWN']),
    body('reason').optional().trim()
  ],
  auditLog('bulk_change_segment'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_ids, new_segment, reason } = req.body;

    let updated = 0;

    for (const lead_id of lead_ids) {
      try {
        const leadResult = await query(
          'SELECT segment, company_name FROM leads WHERE id = $1',
          [lead_id]
        );

        if (leadResult.rows.length > 0) {
          const old_segment = leadResult.rows[0].segment;

          await query(
            'UPDATE leads SET segment = $1, updated_at = NOW() WHERE id = $2',
            [new_segment, lead_id]
          );

          await query(
            `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              req.userId,
              'change_segment',
              'lead',
              lead_id,
              JSON.stringify({
                company_name: leadResult.rows[0].company_name,
                old_segment,
                new_segment,
                reason: reason || 'Bulk-ändring'
              })
            ]
          );

          updated++;
        }
      } catch (error) {
        console.error('Bulk segment change error:', error);
      }
    }

    res.json({
      message: 'Segment ändrade',
      updated,
      total: lead_ids.length,
      new_segment
    });
  })
);

/**
 * POST /api/lead-management/reassign-salesperson
 * Flytta lead till annan säljare (alla kan göra detta)
 */
router.post('/reassign-salesperson',
  sanitizeInput,
  [
    body('lead_id').isUUID(),
    body('new_salesperson_id').isUUID(),
    body('reason').optional().trim()
  ],
  auditLog('reassign_salesperson'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_id, new_salesperson_id, reason } = req.body;

    // Hämta lead-info
    const leadResult = await query(
      `SELECT l.id, l.company_name, l.assigned_salesperson_id, l.postal_code,
              u.full_name as current_salesperson
       FROM leads l
       LEFT JOIN users u ON l.assigned_salesperson_id = u.id
       WHERE l.id = $1`,
      [lead_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead hittades inte' });
    }

    const lead = leadResult.rows[0];

    // Hämta ny säljare
    const newSalespersonResult = await query(
      'SELECT id, full_name, role FROM users WHERE id = $1 AND status = \'active\'',
      [new_salesperson_id]
    );

    if (newSalespersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ny säljare hittades inte' });
    }

    const newSalesperson = newSalespersonResult.rows[0];

    // Admin kan tilldela till vem som helst, andra måste ha rätt postnummer
    if (req.user.role !== 'admin') {
      const postalCodeCheck = await query(
        `SELECT u.id 
         FROM users u
         JOIN user_regions ur ON ur.user_id = u.id
         WHERE u.id = $1 
           AND $2 = ANY(ur.postal_codes)`,
        [new_salesperson_id, lead.postal_code?.substring(0, 3)]
      );

      if (postalCodeCheck.rows.length === 0) {
        return res.status(400).json({ 
          error: 'Säljaren har inte åtkomst till detta postnummer. Endast admin kan ignorera detta.' 
        });
      }
    }

    // Uppdatera tilldelning
    await query(
      `UPDATE leads 
       SET assigned_salesperson_id = $1,
           assigned_at = NOW(),
           assigned_by = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [new_salesperson_id, req.userId, lead_id]
    );

    // Logga ändringen
    await query(
      `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.userId,
        'reassign_salesperson',
        'lead',
        lead_id,
        JSON.stringify({
          company_name: lead.company_name,
          from_salesperson: lead.current_salesperson || 'Otilldelad',
          to_salesperson: newSalesperson.full_name,
          reason: reason || 'Ingen anledning angiven'
        })
      ]
    );

    res.json({
      message: 'Lead flyttat till ny säljare',
      lead_id,
      from_salesperson: lead.current_salesperson || 'Otilldelad',
      to_salesperson: newSalesperson.full_name
    });
  })
);

/**
 * POST /api/lead-management/change-segment-and-reassign
 * Ändra segment OCH flytta till ny säljare samtidigt
 */
router.post('/change-segment-and-reassign',
  sanitizeInput,
  [
    body('lead_id').isUUID(),
    body('new_segment').isIn(['FS', 'TS', 'KAM', 'DM', 'UNKNOWN']),
    body('new_salesperson_id').isUUID(),
    body('reason').optional().trim()
  ],
  auditLog('change_segment_and_reassign'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_id, new_segment, new_salesperson_id, reason } = req.body;

    // Hämta lead-info
    const leadResult = await query(
      `SELECT l.*, u.full_name as current_salesperson
       FROM leads l
       LEFT JOIN users u ON l.assigned_salesperson_id = u.id
       WHERE l.id = $1`,
      [lead_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead hittades inte' });
    }

    const lead = leadResult.rows[0];

    // Hämta ny säljare
    const newSalespersonResult = await query(
      'SELECT id, full_name FROM users WHERE id = $1 AND status = \'active\'',
      [new_salesperson_id]
    );

    if (newSalespersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ny säljare hittades inte' });
    }

    // Uppdatera både segment och säljare
    await query(
      `UPDATE leads 
       SET segment = $1,
           assigned_salesperson_id = $2,
           assigned_at = NOW(),
           assigned_by = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [new_segment, new_salesperson_id, req.userId, lead_id]
    );

    // Logga ändringen
    await query(
      `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.userId,
        'change_segment_and_reassign',
        'lead',
        lead_id,
        JSON.stringify({
          company_name: lead.company_name,
          old_segment: lead.segment,
          new_segment,
          from_salesperson: lead.current_salesperson || 'Otilldelad',
          to_salesperson: newSalespersonResult.rows[0].full_name,
          reason: reason || 'Segment-ändring och omtilldelning'
        })
      ]
    );

    res.json({
      message: 'Segment ändrat och lead flyttat',
      lead_id,
      old_segment: lead.segment,
      new_segment,
      to_salesperson: newSalespersonResult.rows[0].full_name
    });
  })
);

/**
 * GET /api/lead-management/segment-stats
 * Statistik över segment-fördelning
 */
router.get('/segment-stats',
  asyncHandler(async (req, res) => {
    const stats = await query(
      `SELECT 
        segment,
        COUNT(*) as count,
        SUM(revenue_tkr) as total_revenue_tkr,
        AVG(revenue_tkr) as avg_revenue_tkr,
        COUNT(DISTINCT assigned_salesperson_id) as salespeople_count
       FROM leads
       WHERE segment IS NOT NULL
       GROUP BY segment
       ORDER BY count DESC`
    );

    res.json({
      stats: stats.rows,
      segments: {
        FS: 'Field Sales - Säljare ute',
        TS: 'Telesales - Telefonsäljare',
        KAM: 'Key Account Manager - Stora kunder',
        DM: 'Decision Maker - Strategiska kunder',
        UNKNOWN: 'Oklassificerad'
      }
    });
  })
);

export default router;
