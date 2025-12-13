import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

// Middleware to track API response times
let apiMetrics = [];
const MAX_METRICS = 1000;

export const trackApiPerformance = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    apiMetrics.push({
      path: req.path,
      method: req.method,
      duration,
      status: res.statusCode,
      timestamp: new Date()
    });
    
    // Keep only last 1000 metrics
    if (apiMetrics.length > MAX_METRICS) {
      apiMetrics = apiMetrics.slice(-MAX_METRICS);
    }
  });
  
  next();
};

/**
 * GET /api/system-performance/api-metrics
 * API response times och prestanda
 */
router.get('/api-metrics',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { period = '60' } = req.query; // minutes
    const cutoff = new Date(Date.now() - parseInt(period) * 60 * 1000);
    
    const recentMetrics = apiMetrics.filter(m => m.timestamp > cutoff);
    
    // Calculate averages per endpoint
    const byEndpoint = recentMetrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.path}`;
      if (!acc[key]) {
        acc[key] = { durations: [], errors: 0, total: 0 };
      }
      acc[key].durations.push(metric.duration);
      acc[key].total++;
      if (metric.status >= 400) acc[key].errors++;
      return acc;
    }, {});

    const summary = Object.entries(byEndpoint).map(([endpoint, data]) => ({
      endpoint,
      avg_response_time: (data.durations.reduce((a, b) => a + b, 0) / data.durations.length).toFixed(2),
      min_response_time: Math.min(...data.durations),
      max_response_time: Math.max(...data.durations),
      total_requests: data.total,
      error_count: data.errors,
      error_rate: ((data.errors / data.total) * 100).toFixed(2)
    })).sort((a, b) => parseFloat(b.avg_response_time) - parseFloat(a.avg_response_time));

    res.json({
      summary,
      period_minutes: parseInt(period),
      total_requests: recentMetrics.length
    });
  })
);

/**
 * GET /api/system-performance/database
 * Database prestanda
 */
router.get('/database',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Database size
    const sizeResult = await query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        pg_size_pretty(pg_total_relation_size('leads')) as leads_size,
        pg_size_pretty(pg_total_relation_size('customers')) as customers_size
    `);

    // Table row counts
    const countsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM leads) as leads_count,
        (SELECT COUNT(*) FROM customers) as customers_count,
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM tenants) as tenants_count
    `);

    // Active connections
    const connectionsResult = await query(`
      SELECT COUNT(*) as active_connections
      FROM pg_stat_activity
      WHERE state = 'active'
    `);

    res.json({
      size: sizeResult.rows[0],
      counts: countsResult.rows[0],
      connections: connectionsResult.rows[0]
    });
  })
);

/**
 * GET /api/system-performance/costs
 * Uppskattade API-kostnader (LLM, etc.)
 */
router.get('/costs',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { period = '30' } = req.query; // days

    // Count API calls from activity_log
    const result = await query(`
      SELECT 
        action_type,
        COUNT(*) as count,
        DATE_TRUNC('day', created_at) as date
      FROM activity_log
      WHERE created_at > NOW() - INTERVAL '${parseInt(period)} days'
        AND action_type IN ('llm_analysis', 'web_scrape', 'data_enrichment')
      GROUP BY action_type, date
      ORDER BY date DESC
    `);

    // Estimated costs (example rates)
    const costRates = {
      llm_analysis: 0.002, // $0.002 per analysis
      web_scrape: 0.001,   // $0.001 per scrape
      data_enrichment: 0.005 // $0.005 per enrichment
    };

    const totalCosts = result.rows.reduce((acc, row) => {
      const cost = (costRates[row.action_type] || 0) * parseInt(row.count);
      if (!acc[row.action_type]) acc[row.action_type] = 0;
      acc[row.action_type] += cost;
      return acc;
    }, {});

    const totalCost = Object.values(totalCosts).reduce((a, b) => a + b, 0);

    res.json({
      period_days: parseInt(period),
      costs_by_type: totalCosts,
      total_cost: totalCost.toFixed(2),
      currency: 'USD',
      breakdown: result.rows
    });
  })
);

export default router;
