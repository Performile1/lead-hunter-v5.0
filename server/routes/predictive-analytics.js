import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/predictive-analytics/conversion-probability
 * Förutse sannolikhet för konvertering baserat på lead-egenskaper
 */
router.get('/conversion-probability',
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

    // Analyze historical conversion patterns
    const result = await query(`
      SELECT 
        CASE 
          WHEN l.rating_score >= 4 THEN 'High Score'
          WHEN l.rating_score >= 3 THEN 'Medium Score'
          ELSE 'Low Score'
        END as score_category,
        CASE 
          WHEN l.annual_revenue_tkr >= 100000 THEN 'Large'
          WHEN l.annual_revenue_tkr >= 10000 THEN 'Medium'
          ELSE 'Small'
        END as company_size,
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT c.id) as converted,
        ROUND((COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT l.id), 0) * 100), 2) as conversion_rate
      FROM leads l
      LEFT JOIN customers c ON l.company_name = c.company_name 
        AND c.created_at > l.created_at
      WHERE l.created_at > NOW() - INTERVAL '180 days'
        ${tenantFilter}
      GROUP BY score_category, company_size
      ORDER BY conversion_rate DESC
    `, params);

    res.json({ 
      conversion_patterns: result.rows,
      note: 'Simplified predictive model based on historical data'
    });
  })
);

/**
 * GET /api/predictive-analytics/churn-risk
 * Identifiera kunder med risk för churn
 */
router.get('/churn-risk',
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

    // Identify customers with no recent activity
    const result = await query(`
      SELECT 
        c.id,
        c.company_name,
        c.created_at,
        EXTRACT(DAY FROM (NOW() - c.last_contact_date)) as days_since_contact,
        CASE 
          WHEN c.last_contact_date IS NULL THEN 'High'
          WHEN EXTRACT(DAY FROM (NOW() - c.last_contact_date)) > 90 THEN 'High'
          WHEN EXTRACT(DAY FROM (NOW() - c.last_contact_date)) > 60 THEN 'Medium'
          ELSE 'Low'
        END as churn_risk
      FROM customers c
      WHERE c.status = 'active'
        ${tenantFilter}
      ORDER BY days_since_contact DESC NULLS FIRST
      LIMIT 50
    `, params);

    res.json({ 
      at_risk_customers: result.rows.filter(c => c.churn_risk !== 'Low'),
      all_customers: result.rows
    });
  })
);

/**
 * GET /api/predictive-analytics/recommendations
 * Rekommendera nästa åtgärd för leads
 */
router.get('/recommendations',
  requireRole('admin', 'manager', 'fs', 'ts', 'kam'),
  asyncHandler(async (req, res) => {
    const { lead_id } = req.query;
    
    if (!lead_id) {
      return res.status(400).json({ error: 'lead_id required' });
    }

    // Get lead details
    const leadResult = await query(
      'SELECT * FROM leads WHERE id = $1',
      [lead_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];
    const recommendations = [];

    // Rule-based recommendations
    if (parseFloat(lead.rating_score) >= 4) {
      recommendations.push({
        action: 'immediate_contact',
        priority: 'high',
        reason: 'High quality lead - contact within 24h'
      });
    }

    if (!lead.decision_makers || lead.decision_makers.length === 0) {
      recommendations.push({
        action: 'find_decision_makers',
        priority: 'medium',
        reason: 'No decision makers identified'
      });
    }

    if (lead.annual_revenue_tkr && parseInt(lead.annual_revenue_tkr) > 50000) {
      recommendations.push({
        action: 'assign_to_kam',
        priority: 'high',
        reason: 'Large company - assign to Key Account Manager'
      });
    }

    if (!lead.email && !lead.phone) {
      recommendations.push({
        action: 'data_enrichment',
        priority: 'high',
        reason: 'Missing contact information'
      });
    }

    res.json({ 
      lead_id,
      recommendations: recommendations.length > 0 ? recommendations : [{
        action: 'standard_follow_up',
        priority: 'normal',
        reason: 'Standard lead follow-up process'
      }]
    });
  })
);

export default router;
