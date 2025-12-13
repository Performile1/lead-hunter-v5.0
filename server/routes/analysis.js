import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/analysis/deep-pro
 * Djupanalys PRO - 3-stegs sekventiell analys med grounding
 */
router.post('/deep-pro',
  sanitizeInput,
  [
    body('company_name').notEmpty().trim(),
    body('geo_area').optional().trim(),
    body('org_number').optional().trim()
  ],
  auditLog('deep_pro_analysis'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company_name, geo_area, org_number } = req.body;

    // Logga API-användning
    const startTime = Date.now();

    // Returnera status - frontend anropar geminiService direkt
    res.json({
      status: 'processing',
      protocol: 'deep_pro',
      message: 'Djupanalys PRO startad',
      company_name,
      estimated_time: 60 // sekunder
    });

    // Logga användning i bakgrunden
    const duration = Date.now() - startTime;
    await query(
      `INSERT INTO api_usage (user_id, provider, model_name, request_type, cost_usd, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [req.userId, 'gemini', 'gemini-2.0-flash-exp', 'deep_pro', 0.001]
    ).catch(err => console.error('Failed to log API usage:', err));
  })
);

/**
 * POST /api/analysis/deep
 * Djupanalys Standard - 3-stegs analys
 */
router.post('/deep',
  sanitizeInput,
  [
    body('company_name').notEmpty().trim(),
    body('geo_area').optional().trim()
  ],
  auditLog('deep_analysis'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company_name, geo_area } = req.body;

    res.json({
      status: 'processing',
      protocol: 'deep',
      message: 'Djupanalys Standard startad',
      company_name,
      estimated_time: 45
    });

    await query(
      `INSERT INTO api_usage (user_id, provider, model_name, request_type, cost_usd, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [req.userId, 'gemini', 'gemini-2.0-flash-exp', 'deep', 0.0008]
    ).catch(err => console.error('Failed to log API usage:', err));
  })
);

/**
 * POST /api/analysis/quick
 * Snabbskanning - Snabb översikt
 */
router.post('/quick',
  sanitizeInput,
  [
    body('company_name').notEmpty().trim()
  ],
  auditLog('quick_scan'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company_name } = req.body;

    res.json({
      status: 'processing',
      protocol: 'quick',
      message: 'Snabbskanning startad',
      company_name,
      estimated_time: 15
    });

    await query(
      `INSERT INTO api_usage (user_id, provider, model_name, request_type, cost_usd, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [req.userId, 'gemini', 'gemini-2.0-flash-exp', 'quick', 0.0003]
    ).catch(err => console.error('Failed to log API usage:', err));
  })
);

/**
 * POST /api/analysis/batch-prospecting
 * Batch Prospecting - Hitta många leads snabbt
 */
router.post('/batch-prospecting',
  sanitizeInput,
  [
    body('geo_area').notEmpty().trim(),
    body('financial_scope').notEmpty().trim(),
    body('lead_count').isInt({ min: 1, max: 100 }),
    body('triggers').optional().isArray()
  ],
  auditLog('batch_prospecting'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { geo_area, financial_scope, lead_count, triggers } = req.body;

    // Hämta LLM-konfiguration
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

    res.json({
      status: 'processing',
      protocol: 'batch_prospecting',
      message: 'Batch prospecting startad',
      geo_area,
      lead_count,
      estimated_time: lead_count * 2
    });

    await query(
      `INSERT INTO api_usage (user_id, provider, model_name, request_type, cost_usd, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [req.userId, 'gemini', 'gemini-2.0-flash-exp', 'batch_prospecting', lead_count * 0.0005]
    ).catch(err => console.error('Failed to log API usage:', err));
  })
);

/**
 * GET /api/analysis/protocols
 * Hämta tillgängliga analysprotokoll
 */
router.get('/protocols',
  asyncHandler(async (req, res) => {
    const protocols = [
      {
        id: 'deep_pro',
        name: 'Djupanalys PRO',
        description: '3-stegs sekventiell analys med web grounding. Högsta kvalitet.',
        estimated_time: 60,
        cost_estimate: '$0.001',
        features: [
          'Web grounding för verifierad data',
          'Kronofogden-kontroll',
          'Org.nummer validering',
          'Beslutsfattare med LinkedIn',
          'Fullständig finansiell analys',
          'Tech stack analys'
        ]
      },
      {
        id: 'deep',
        name: 'Djupanalys Standard',
        description: '3-stegs analys utan grounding. Bra kvalitet, snabbare.',
        estimated_time: 45,
        cost_estimate: '$0.0008',
        features: [
          'Grundläggande företagsdata',
          'Finansiell översikt',
          'Beslutsfattare',
          'Logistikprofil',
          'Snabbare än PRO'
        ]
      },
      {
        id: 'quick',
        name: 'Snabbskanning',
        description: 'Snabb översikt av företag. Perfekt för initial screening.',
        estimated_time: 15,
        cost_estimate: '$0.0003',
        features: [
          'Grundläggande info',
          'Segment-klassificering',
          'Snabb omsättningsuppskattning',
          'Mycket snabb'
        ]
      },
      {
        id: 'batch_prospecting',
        name: 'Batch Prospecting',
        description: 'Hitta många leads samtidigt baserat på kriterier.',
        estimated_time: 'Varierar',
        cost_estimate: '$0.0005/lead',
        features: [
          'Hitta 10-100 leads samtidigt',
          'Geografisk filtrering',
          'Finansiell filtrering',
          'Trigger-baserad sökning',
          'Automatisk segmentering'
        ]
      }
    ];

    res.json({ protocols });
  })
);

/**
 * POST /api/analysis/save-result
 * Spara analysresultat till databas
 */
router.post('/save-result',
  sanitizeInput,
  [
    body('lead_data').isObject(),
    body('protocol').isIn(['deep_pro', 'deep', 'quick', 'batch_prospecting'])
  ],
  auditLog('save_analysis_result'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead_data, protocol } = req.body;

    // Spara lead i databas
    const result = await query(
      `INSERT INTO leads (
        company_name, org_number, address, postal_code, city,
        segment, revenue_tkr, freight_budget_tkr, legal_status,
        credit_rating, created_by, source, analysis_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id`,
      [
        lead_data.companyName,
        lead_data.orgNumber,
        lead_data.address,
        lead_data.postalCode,
        lead_data.city,
        lead_data.segment,
        lead_data.revenueTkr,
        lead_data.freightBudgetTkr,
        lead_data.legalStatus,
        lead_data.creditRating,
        req.userId,
        'ai'
      ]
    );

    const leadId = result.rows[0].id;

    // Spara beslutsfattare om de finns
    if (lead_data.decisionMakers && lead_data.decisionMakers.length > 0) {
      for (const dm of lead_data.decisionMakers) {
        await query(
          `INSERT INTO decision_makers (lead_id, name, title, email, linkedin_url, direct_phone)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [leadId, dm.name, dm.title, dm.email, dm.linkedinUrl, dm.directPhone]
        );
      }
    }

    res.json({
      message: 'Lead sparat',
      lead_id: leadId,
      protocol
    });
  })
);

export default router;
