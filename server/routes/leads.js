import express from 'express';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import { query, transaction } from '../config/database.js';
import { authenticate, requireRole, requireRegionAccess } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';
import { filterLeadsByPermission, canAllocateLead, requireAdmin } from '../middleware/permissions.js';

const router = express.Router();

// Alla routes kräver autentisering
router.use(authenticate);

/**
 * GET /api/leads
 * Lista leads (filtrerat på regioner/postnummer för säljare, allt för admin/manager)
 */
router.get('/',
  filterLeadsByPermission,
  asyncHandler(async (req, res) => {
    const { segment, postal_code, city, status, limit = 50, offset = 0, search } = req.query;
    
    let sql = `
      SELECT l.*, 
             t.name as terminal_name, 
             t.code as terminal_code,
             u.full_name as created_by_name
      FROM leads l
      LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
      LEFT JOIN users u ON l.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Filtrera baserat på användarens roll och regioner
    if (req.user.role === 'terminal_manager') {
      // Terminal managers ser bara sina leads
      sql += ` AND l.assigned_terminal_id = (SELECT id FROM terminals WHERE manager_user_id = $${paramIndex})`;
      params.push(req.userId);
      paramIndex++;
    } else if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // FS/TS/KAM/DM ser bara leads i sina regioner/postnummer
      if (req.user.regions && req.user.regions.length > 0) {
        sql += ` AND l.city = ANY($${paramIndex})`;
        params.push(req.user.regions);
        paramIndex++;
      }
      if (req.user.postal_codes && req.user.postal_codes.length > 0) {
        sql += ` AND LEFT(l.postal_code, 3) = ANY($${paramIndex})`;
        params.push(req.user.postal_codes);
        paramIndex++;
      }
    }
    
    // Ytterligare filter
    if (segment) {
      sql += ` AND l.segment = $${paramIndex}`;
      params.push(segment);
      paramIndex++;
    }
    
    if (postal_code) {
      sql += ` AND l.postal_code LIKE $${paramIndex}`;
      params.push(`${postal_code}%`);
      paramIndex++;
    }
    
    if (city) {
      sql += ` AND l.city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND l.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      sql += ` AND (l.company_name ILIKE $${paramIndex} OR l.org_number LIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    res.json({
      leads: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  })
);

/**
 * GET /api/leads/:id
 * Hämta specifik lead
 */
router.get('/:id',
  param('id').isUUID(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const result = await query(
      `SELECT l.*, 
              json_agg(DISTINCT dm.*) FILTER (WHERE dm.id IS NOT NULL) as decision_makers,
              t.name as terminal_name
       FROM leads l
       LEFT JOIN decision_makers dm ON dm.lead_id = l.id
       LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
       WHERE l.id = $1
       GROUP BY l.id, t.name`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead hittades inte' });
    }
    
    res.json(result.rows[0]);
  })
);

/**
 * POST /api/leads
 * Skapa ny lead (alla användare kan skapa)
 */
router.post('/',
  sanitizeInput,
  [
    body('company_name').notEmpty().trim(),
    body('org_number').optional().isLength({ min: 10, max: 10 }),
    body('segment').isIn(['FS', 'TS', 'KAM', 'DM', 'UNKNOWN']),
    body('postal_code').optional().isLength({ min: 3, max: 10 }),
    body('city').optional().trim()
  ],
  auditLog('create_lead'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      company_name,
      org_number,
      address,
      postal_code,
      city,
      segment,
      revenue_tkr,
      freight_budget_tkr,
      legal_status,
      credit_rating,
      decision_makers = []
    } = req.body;
    
    const lead = await transaction(async (client) => {
      // Skapa lead
      const leadResult = await client.query(
        `INSERT INTO leads (
          company_name, org_number, address, postal_code, city,
          segment, revenue_tkr, freight_budget_tkr, legal_status,
          credit_rating, created_by, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          company_name, org_number, address, postal_code, city,
          segment, revenue_tkr, freight_budget_tkr, legal_status,
          credit_rating, req.userId, 'manual'
        ]
      );
      
      const newLead = leadResult.rows[0];
      
      // Lägg till decision makers
      if (decision_makers.length > 0) {
        for (const dm of decision_makers) {
          await client.query(
            `INSERT INTO decision_makers (lead_id, name, title, email, phone, linkedin_url)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [newLead.id, dm.name, dm.title, dm.email, dm.phone, dm.linkedin_url]
          );
        }
      }
      
      return newLead;
    });
    
    res.status(201).json({
      message: 'Lead skapad',
      lead
    });
  })
);

/**
 * PUT /api/leads/:id
 * Uppdatera lead (inklusive segment-ändring)
 */
router.put('/:id',
  param('id').isUUID(),
  sanitizeInput,
  auditLog('update_lead'),
  asyncHandler(async (req, res) => {
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'company_name', 'address', 'postal_code', 'city', 'segment',
      'revenue_tkr', 'freight_budget_tkr', 'legal_status', 'credit_rating',
      'status', 'notes'
    ];
    
    // Validera segment om det ändras
    if (req.body.segment) {
      const validSegments = ['FS', 'TS', 'KAM', 'DM', 'UNKNOWN'];
      if (!validSegments.includes(req.body.segment)) {
        return res.status(400).json({ 
          error: 'Ogiltigt segment. Tillåtna: FS, TS, KAM, DM, UNKNOWN' 
        });
      }
    }
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(req.body[field]);
        paramIndex++;
      }
    }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      await query(
        `UPDATE leads SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
        values
      );
    }
    
    res.json({ message: 'Lead uppdaterad' });
  })
);

/**
 * DELETE /api/leads/:id
 * Radera lead
 */
router.delete('/:id',
  requireRole('admin', 'manager'),
  param('id').isUUID(),
  auditLog('delete_lead'),
  asyncHandler(async (req, res) => {
    await query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    res.json({ message: 'Lead raderad' });
  })
);

export default router;
