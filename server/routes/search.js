import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../config/database.js';
import { authenticate, requireRegionAccess } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/search
 * Utför sökning med LLM (alla användare kan söka)
 */
router.post('/',
  sanitizeInput,
  [
    body('geoArea').notEmpty(),
    body('financialScope').notEmpty(),
    body('leadCount').isInt({ min: 1, max: 100 })
  ],
  auditLog('perform_search'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { geoArea, financialScope, leadCount, triggers, batchMode, protocol } = req.body;

    // Alla användare kan söka i alla områden
    // Filtrering sker i frontend baserat på användarens behörigheter

    // Hämta LLM-konfiguration (prioriterad)
    const llmConfig = await query(
      `SELECT * FROM llm_configurations 
       WHERE is_enabled = true 
       ORDER BY priority DESC 
       LIMIT 1`
    );

    if (llmConfig.rows.length === 0) {
      return res.status(503).json({ 
        error: 'Ingen LLM-provider är aktiverad. Kontakta admin.' 
      });
    }

    // Logga sökning
    await query(
      `INSERT INTO search_history (user_id, search_params, region)
       VALUES ($1, $2, $3)`,
      [req.userId, JSON.stringify(req.body), geoArea]
    );

    // Här skulle vi anropa LLM-tjänsten
    // För nu returnerar vi placeholder
    res.json({
      message: 'Sökning startad',
      searchId: crypto.randomUUID(),
      status: 'processing',
      estimatedTime: leadCount * 2 // sekunder
    });
  })
);

/**
 * GET /api/search/history
 * Hämta sökhistorik
 */
router.get('/history',
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;

    let sql = `
      SELECT sh.*, COUNT(l.id) as leads_found
      FROM search_history sh
      LEFT JOIN leads l ON l.search_id = sh.id
      WHERE sh.user_id = $1
      GROUP BY sh.id
      ORDER BY sh.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [req.userId, limit, offset]);

    res.json({
      history: result.rows,
      total: result.rows.length
    });
  })
);

export default router;
