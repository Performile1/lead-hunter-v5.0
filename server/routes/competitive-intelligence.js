import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/competitive-intelligence/market-share
 * Marknadsandelar för transportörer över tid
 */
router.get('/market-share',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { period = '30' } = req.query; // days
    
    const result = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) as carrier,
        COUNT(*) as count
      FROM leads
      WHERE created_at > NOW() - INTERVAL '${parseInt(period)} days'
        AND carriers IS NOT NULL
      GROUP BY date, carrier
      ORDER BY date DESC, count DESC
    `);

    // Calculate market share per day
    const byDate = result.rows.reduce((acc, row) => {
      const dateStr = row.date.toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = {};
      acc[dateStr][row.carrier] = parseInt(row.count);
      return acc;
    }, {});

    // Calculate percentages
    const marketShare = Object.entries(byDate).map(([date, carriers]) => {
      const total = Object.values(carriers).reduce((sum, count) => sum + count, 0);
      const percentages = {};
      Object.entries(carriers).forEach(([carrier, count]) => {
        percentages[carrier] = ((count / total) * 100).toFixed(2);
      });
      return { date, carriers: percentages, total };
    });

    res.json({ market_share: marketShare, period_days: parseInt(period) });
  })
);

/**
 * GET /api/competitive-intelligence/trends
 * Trender för konkurrenter (vinnare/förlorare)
 */
router.get('/trends',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Compare last 30 days vs previous 30 days
    const result = await query(`
      WITH current_period AS (
        SELECT 
          TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) as carrier,
          COUNT(*) as count
        FROM leads
        WHERE created_at > NOW() - INTERVAL '30 days'
          AND carriers IS NOT NULL
        GROUP BY carrier
      ),
      previous_period AS (
        SELECT 
          TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) as carrier,
          COUNT(*) as count
        FROM leads
        WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
          AND carriers IS NOT NULL
        GROUP BY carrier
      )
      SELECT 
        COALESCE(c.carrier, p.carrier) as carrier,
        COALESCE(c.count, 0) as current_count,
        COALESCE(p.count, 0) as previous_count,
        CASE 
          WHEN p.count > 0 THEN ROUND(((c.count - p.count)::numeric / p.count * 100), 2)
          ELSE 0
        END as growth_percentage
      FROM current_period c
      FULL OUTER JOIN previous_period p ON c.carrier = p.carrier
      ORDER BY growth_percentage DESC
    `);

    const winners = result.rows.filter(r => parseFloat(r.growth_percentage) > 0).slice(0, 5);
    const losers = result.rows.filter(r => parseFloat(r.growth_percentage) < 0).slice(0, 5);

    res.json({ winners, losers, all: result.rows });
  })
);

/**
 * GET /api/competitive-intelligence/regional
 * Regional konkurrensanalys
 */
router.get('/regional',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Analyze by postal code regions (first 2 digits)
    const result = await query(`
      SELECT 
        SUBSTRING(postal_code, 1, 2) as region,
        TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) as carrier,
        COUNT(*) as count
      FROM leads
      WHERE postal_code IS NOT NULL
        AND carriers IS NOT NULL
        AND created_at > NOW() - INTERVAL '90 days'
      GROUP BY region, carrier
      ORDER BY region, count DESC
    `);

    const byRegion = result.rows.reduce((acc, row) => {
      if (!acc[row.region]) acc[row.region] = [];
      acc[row.region].push({ carrier: row.carrier, count: parseInt(row.count) });
      return acc;
    }, {});

    res.json({ regional_competition: byRegion });
  })
);

export default router;
