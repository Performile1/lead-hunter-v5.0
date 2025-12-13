import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/exclusions
 * Hämta exkluderingar (delad lista för alla)
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { type, search, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM exclusions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (type) {
      sql += ` AND exclusion_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (company_name ILIKE $${paramIndex} OR org_number LIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      exclusions: result.rows,
      total: result.rows.length
    });
  })
);

/**
 * POST /api/exclusions
 * Lägg till exkludering
 */
router.post('/',
  sanitizeInput,
  [
    body('company_name').optional().trim(),
    body('org_number').optional().isLength({ min: 10, max: 10 }),
    body('exclusion_type').isIn(['existing_customer', 'competitor', 'blacklist', 'incorrect_data']),
    body('reason').optional().trim()
  ],
  auditLog('create_exclusion'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company_name, org_number, exclusion_type, reason } = req.body;

    // Kolla om redan finns
    if (org_number) {
      const existing = await query(
        'SELECT id FROM exclusions WHERE org_number = $1',
        [org_number]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Företaget är redan exkluderat' });
      }
    }

    const result = await query(
      `INSERT INTO exclusions (company_name, org_number, exclusion_type, reason, added_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [company_name, org_number, exclusion_type, reason, req.userId]
    );

    res.status(201).json({
      message: 'Exkludering tillagd',
      exclusion: result.rows[0]
    });
  })
);

/**
 * DELETE /api/exclusions/:id
 * Ta bort exkludering (Admin)
 */
router.delete('/:id',
  requireRole('admin', 'manager'),
  param('id').isUUID(),
  auditLog('delete_exclusion'),
  asyncHandler(async (req, res) => {
    await query('DELETE FROM exclusions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Exkludering borttagen' });
  })
);

/**
 * POST /api/exclusions/bulk
 * Bulk-import av exkluderingar
 */
router.post('/bulk',
  requireRole('admin', 'manager'),
  sanitizeInput,
  auditLog('bulk_import_exclusions'),
  asyncHandler(async (req, res) => {
    const { exclusions } = req.body;

    if (!Array.isArray(exclusions) || exclusions.length === 0) {
      return res.status(400).json({ error: 'Ingen data att importera' });
    }

    let imported = 0;
    let skipped = 0;

    for (const item of exclusions) {
      try {
        // Kolla om redan finns
        if (item.org_number) {
          const existing = await query(
            'SELECT id FROM exclusions WHERE org_number = $1',
            [item.org_number]
          );
          if (existing.rows.length > 0) {
            skipped++;
            continue;
          }
        }

        await query(
          `INSERT INTO exclusions (company_name, org_number, exclusion_type, reason, added_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            item.company_name,
            item.org_number,
            item.exclusion_type || 'existing_customer',
            item.reason,
            req.userId
          ]
        );
        imported++;
      } catch (error) {
        console.error('Bulk import error:', error);
        skipped++;
      }
    }

    res.json({
      message: 'Bulk-import slutförd',
      imported,
      skipped,
      total: exclusions.length
    });
  })
);

export default router;
