import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/stats/user
 * Egen statistik
 */
router.get('/user',
  asyncHandler(async (req, res) => {
    const [leads, searches, apiUsage] = await Promise.all([
      query(
        'SELECT COUNT(*) as count, segment FROM leads WHERE created_by = $1 GROUP BY segment',
        [req.userId]
      ),
      query(
        'SELECT COUNT(*) as count FROM search_history WHERE user_id = $1',
        [req.userId]
      ),
      query(
        `SELECT SUM(cost_usd) as total_cost, COUNT(*) as api_calls
         FROM api_usage 
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
        [req.userId]
      )
    ]);

    res.json({
      leads: leads.rows,
      totalSearches: searches.rows[0]?.count || 0,
      apiUsage: apiUsage.rows[0] || { total_cost: 0, api_calls: 0 }
    });
  })
);

/**
 * GET /api/stats/team
 * Team-statistik (Manager)
 */
router.get('/team',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const [userStats, leadStats, costStats] = await Promise.all([
      query(`
        SELECT u.full_name, u.role, 
               COUNT(l.id) as leads_created,
               SUM(CASE WHEN l.created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as leads_this_week
        FROM users u
        LEFT JOIN leads l ON l.created_by = u.id
        WHERE u.status = 'active'
        GROUP BY u.id, u.full_name, u.role
        ORDER BY leads_created DESC
      `),
      query(`
        SELECT segment, COUNT(*) as count, SUM(revenue_tkr) as total_revenue
        FROM leads
        GROUP BY segment
      `),
      query(`
        SELECT DATE(created_at) as date, SUM(cost_usd) as cost
        FROM api_usage
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)
    ]);

    res.json({
      userStats: userStats.rows,
      leadStats: leadStats.rows,
      costStats: costStats.rows
    });
  })
);

/**
 * GET /api/stats/terminal
 * Terminal-statistik (Terminal Manager)
 */
router.get('/terminal',
  requireRole('terminal_manager'),
  asyncHandler(async (req, res) => {
    // Hämta terminal för användaren
    const terminalResult = await query(
      'SELECT id, name, code FROM terminals WHERE manager_user_id = $1',
      [req.userId]
    );

    if (terminalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ingen terminal tilldelad' });
    }

    const terminal = terminalResult.rows[0];

    const [leads, postalCodes, revenue] = await Promise.all([
      query(
        'SELECT COUNT(*) as count FROM leads WHERE assigned_terminal_id = $1',
        [terminal.id]
      ),
      query(
        'SELECT COUNT(DISTINCT postal_code) as count FROM leads WHERE assigned_terminal_id = $1',
        [terminal.id]
      ),
      query(
        'SELECT SUM(revenue_tkr) as total FROM leads WHERE assigned_terminal_id = $1',
        [terminal.id]
      )
    ]);

    res.json({
      terminal: terminal,
      total_leads: leads.rows[0]?.count || 0,
      postal_codes_count: postalCodes.rows[0]?.count || 0,
      total_revenue: revenue.rows[0]?.total || 0
    });
  })
);

/**
 * GET /api/stats/costs
 * API-kostnader (Admin)
 */
router.get('/costs',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;

    const [byProvider, byUser, daily] = await Promise.all([
      query(
        `SELECT provider, COUNT(*) as calls, SUM(cost_usd) as total_cost
         FROM api_usage
         WHERE created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY provider
         ORDER BY total_cost DESC`
      ),
      query(
        `SELECT u.full_name, COUNT(au.id) as calls, SUM(au.cost_usd) as total_cost
         FROM api_usage au
         JOIN users u ON au.user_id = u.id
         WHERE au.created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY u.id, u.full_name
         ORDER BY total_cost DESC`
      ),
      query(
        `SELECT DATE(created_at) as date, SUM(cost_usd) as cost, COUNT(*) as calls
         FROM api_usage
         WHERE created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`
      )
    ]);

    res.json({
      byProvider: byProvider.rows,
      byUser: byUser.rows,
      daily: daily.rows
    });
  })
);

export default router;
