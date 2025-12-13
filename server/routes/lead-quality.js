import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/lead-quality/conversion-rate
 * Konverteringsgrad lead → kund
 */
router.get('/conversion-rate',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { tenant_id, period = '30' } = req.query;
    
    let tenantFilter = '';
    const params = [];
    
    if (!req.isSuperAdmin && req.tenantId) {
      tenantFilter = 'AND l.tenant_id = $1';
      params.push(req.tenantId);
    } else if (tenant_id) {
      tenantFilter = 'AND l.tenant_id = $1';
      params.push(tenant_id);
    }

    const result = await query(`
      SELECT 
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT c.id) as converted_customers,
        ROUND((COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT l.id), 0) * 100), 2) as conversion_rate
      FROM leads l
      LEFT JOIN customers c ON l.company_name = c.company_name 
        AND c.created_at > l.created_at
      WHERE l.created_at > NOW() - INTERVAL '${parseInt(period)} days'
        ${tenantFilter}
    `, params);

    res.json(result.rows[0]);
  })
);

/**
 * GET /api/lead-quality/time-to-conversion
 * Genomsnittlig tid från lead till konvertering
 */
router.get('/time-to-conversion',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { tenant_id } = req.query;
    
    let tenantFilter = '';
    const params = [];
    
    if (!req.isSuperAdmin && req.tenantId) {
      tenantFilter = 'AND l.tenant_id = $1';
      params.push(req.tenantId);
    } else if (tenant_id) {
      tenantFilter = 'AND l.tenant_id = $1';
      params.push(tenant_id);
    }

    const result = await query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (c.created_at - l.created_at)) / 86400) as avg_days,
        MIN(EXTRACT(EPOCH FROM (c.created_at - l.created_at)) / 86400) as min_days,
        MAX(EXTRACT(EPOCH FROM (c.created_at - l.created_at)) / 86400) as max_days,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (c.created_at - l.created_at)) / 86400) as median_days
      FROM leads l
      INNER JOIN customers c ON l.company_name = c.company_name 
        AND c.created_at > l.created_at
      WHERE l.created_at > NOW() - INTERVAL '90 days'
        ${tenantFilter}
    `, params);

    res.json({
      avg_days: parseFloat(result.rows[0].avg_days || 0).toFixed(1),
      min_days: parseFloat(result.rows[0].min_days || 0).toFixed(1),
      max_days: parseFloat(result.rows[0].max_days || 0).toFixed(1),
      median_days: parseFloat(result.rows[0].median_days || 0).toFixed(1)
    });
  })
);

/**
 * GET /api/lead-quality/by-source
 * Lead-kvalitet per källa
 */
router.get('/by-source',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { tenant_id } = req.query;
    
    let tenantFilter = '';
    const params = [];
    
    if (!req.isSuperAdmin && req.tenantId) {
      tenantFilter = 'AND l.tenant_id = $1';
      params.push(req.tenantId);
    } else if (tenant_id) {
      tenantFilter = 'AND l.tenant_id = $1';
      params.push(tenant_id);
    }

    const result = await query(`
      SELECT 
        l.source,
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT c.id) as converted,
        ROUND((COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT l.id), 0) * 100), 2) as conversion_rate
      FROM leads l
      LEFT JOIN customers c ON l.company_name = c.company_name 
        AND c.created_at > l.created_at
      WHERE l.created_at > NOW() - INTERVAL '90 days'
        ${tenantFilter}
      GROUP BY l.source
      ORDER BY conversion_rate DESC
    `, params);

    res.json({ sources: result.rows });
  })
);

/**
 * GET /api/lead-quality/score-distribution
 * Distribution av lead-scores
 */
router.get('/score-distribution',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { tenant_id } = req.query;
    
    let tenantFilter = '';
    const params = [];
    
    if (!req.isSuperAdmin && req.tenantId) {
      tenantFilter = 'AND tenant_id = $1';
      params.push(req.tenantId);
    } else if (tenant_id) {
      tenantFilter = 'AND tenant_id = $1';
      params.push(tenant_id);
    }

    const result = await query(`
      SELECT 
        CASE 
          WHEN rating_score >= 4 THEN 'High (4-5)'
          WHEN rating_score >= 3 THEN 'Medium (3-4)'
          ELSE 'Low (0-3)'
        END as score_range,
        COUNT(*) as count
      FROM leads
      WHERE rating_score IS NOT NULL
        AND created_at > NOW() - INTERVAL '90 days'
        ${tenantFilter}
      GROUP BY score_range
      ORDER BY score_range DESC
    `, params);

    res.json({ distribution: result.rows });
  })
);

export default router;
