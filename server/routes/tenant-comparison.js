import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/tenant-comparison/overview
 * Jämför alla tenants prestanda
 */
router.get('/overview',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const result = await query(`
      SELECT 
        t.id,
        t.company_name,
        t.subscription_tier,
        t.max_users,
        t.max_leads_per_month,
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id AND status = 'active') as active_users,
        (SELECT COUNT(*) FROM leads WHERE tenant_id = t.id) as total_leads,
        (SELECT COUNT(*) FROM leads WHERE tenant_id = t.id AND created_at > NOW() - INTERVAL '30 days') as leads_30d,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = t.id) as total_customers,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = t.id AND created_at > NOW() - INTERVAL '30 days') as customers_30d,
        t.created_at
      FROM tenants t
      WHERE t.is_active = true
      ORDER BY leads_30d DESC
    `);

    // Calculate usage percentages
    const tenantsWithUsage = result.rows.map(tenant => ({
      ...tenant,
      user_usage_percent: ((parseInt(tenant.active_users) / tenant.max_users) * 100).toFixed(1),
      lead_usage_percent: ((parseInt(tenant.leads_30d) / tenant.max_leads_per_month) * 100).toFixed(1),
      conversion_rate: tenant.total_leads > 0 
        ? ((parseInt(tenant.total_customers) / parseInt(tenant.total_leads)) * 100).toFixed(2)
        : '0'
    }));

    res.json({ tenants: tenantsWithUsage });
  })
);

/**
 * GET /api/tenant-comparison/activity
 * Jämför aktivitetsnivå mellan tenants
 */
router.get('/activity',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { period = '30' } = req.query;

    const result = await query(`
      SELECT 
        t.company_name,
        COUNT(DISTINCT al.user_id) as active_users,
        COUNT(al.id) as total_actions,
        COUNT(DISTINCT DATE_TRUNC('day', al.created_at)) as active_days
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN activity_log al ON al.user_id = u.id 
        AND al.created_at > NOW() - INTERVAL '${parseInt(period)} days'
      WHERE t.is_active = true
      GROUP BY t.id, t.company_name
      ORDER BY total_actions DESC
    `);

    res.json({ 
      activity: result.rows,
      period_days: parseInt(period)
    });
  })
);

/**
 * GET /api/tenant-comparison/roi
 * ROI-beräkningar per tenant
 */
router.get('/roi',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Simplified ROI calculation based on subscription tier
    const tierPricing = {
      basic: 99,
      professional: 299,
      enterprise: 999
    };

    const result = await query(`
      SELECT 
        t.company_name,
        t.subscription_tier,
        (SELECT COUNT(*) FROM leads WHERE tenant_id = t.id) as total_leads,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = t.id) as total_customers,
        EXTRACT(MONTH FROM AGE(NOW(), t.created_at)) as months_active
      FROM tenants t
      WHERE t.is_active = true
    `);

    const roiData = result.rows.map(tenant => {
      const monthlyRevenue = tierPricing[tenant.subscription_tier] || 0;
      const totalRevenue = monthlyRevenue * (parseInt(tenant.months_active) || 1);
      const leadsPerDollar = totalRevenue > 0 ? (parseInt(tenant.total_leads) / totalRevenue).toFixed(2) : '0';
      const customersPerDollar = totalRevenue > 0 ? (parseInt(tenant.total_customers) / totalRevenue).toFixed(2) : '0';

      return {
        ...tenant,
        monthly_revenue: monthlyRevenue,
        total_revenue: totalRevenue,
        leads_per_dollar: leadsPerDollar,
        customers_per_dollar: customersPerDollar
      };
    });

    res.json({ roi: roiData });
  })
);

export default router;
