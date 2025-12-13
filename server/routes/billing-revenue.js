import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

// Pricing tiers
const PRICING = {
  basic: { monthly: 99, yearly: 990, max_users: 10, max_leads: 1000 },
  professional: { monthly: 299, yearly: 2990, max_users: 50, max_leads: 5000 },
  enterprise: { monthly: 999, yearly: 9990, max_users: 200, max_leads: 50000 }
};

/**
 * GET /api/billing-revenue/overview
 * Intäktsöversikt (super admin)
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
        t.created_at,
        EXTRACT(MONTH FROM AGE(NOW(), t.created_at)) as months_active,
        t.is_active
      FROM tenants t
      ORDER BY t.created_at DESC
    `);

    const revenueData = result.rows.map(tenant => {
      const pricing = PRICING[tenant.subscription_tier] || PRICING.basic;
      const monthsActive = Math.max(1, parseInt(tenant.months_active) || 1);
      const monthlyRevenue = tenant.is_active ? pricing.monthly : 0;
      const totalRevenue = pricing.monthly * monthsActive;
      const projectedYearly = pricing.monthly * 12;

      return {
        tenant_id: tenant.id,
        tenant_name: tenant.company_name,
        subscription_tier: tenant.subscription_tier,
        monthly_revenue: monthlyRevenue,
        total_revenue: totalRevenue,
        projected_yearly: projectedYearly,
        months_active: monthsActive,
        is_active: tenant.is_active,
        created_at: tenant.created_at
      };
    });

    const totalMonthlyRevenue = revenueData
      .filter(t => t.is_active)
      .reduce((sum, t) => sum + t.monthly_revenue, 0);

    const totalRevenue = revenueData.reduce((sum, t) => sum + t.total_revenue, 0);

    const projectedYearly = revenueData
      .filter(t => t.is_active)
      .reduce((sum, t) => sum + t.projected_yearly, 0);

    res.json({
      tenants: revenueData,
      summary: {
        total_monthly_revenue: totalMonthlyRevenue,
        total_revenue_to_date: totalRevenue,
        projected_yearly_revenue: projectedYearly,
        active_tenants: revenueData.filter(t => t.is_active).length,
        total_tenants: revenueData.length
      }
    });
  })
);

/**
 * GET /api/billing-revenue/tenant-usage
 * Användning vs limits per tenant
 */
router.get('/tenant-usage',
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
        t.max_customers,
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id AND status = 'active') as current_users,
        (SELECT COUNT(*) FROM leads WHERE tenant_id = t.id AND created_at > NOW() - INTERVAL '30 days') as leads_this_month,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = t.id) as current_customers
      FROM tenants t
      WHERE t.is_active = true
    `);

    const usageData = result.rows.map(tenant => {
      const userUsage = ((parseInt(tenant.current_users) / tenant.max_users) * 100).toFixed(1);
      const leadUsage = ((parseInt(tenant.leads_this_month) / tenant.max_leads_per_month) * 100).toFixed(1);
      const customerUsage = ((parseInt(tenant.current_customers) / tenant.max_customers) * 100).toFixed(1);

      // Identify upsell opportunities
      const needsUpgrade = 
        parseFloat(userUsage) > 80 || 
        parseFloat(leadUsage) > 80 || 
        parseFloat(customerUsage) > 80;

      return {
        ...tenant,
        usage: {
          users: { current: parseInt(tenant.current_users), max: tenant.max_users, percentage: userUsage },
          leads: { current: parseInt(tenant.leads_this_month), max: tenant.max_leads_per_month, percentage: leadUsage },
          customers: { current: parseInt(tenant.current_customers), max: tenant.max_customers, percentage: customerUsage }
        },
        needs_upgrade: needsUpgrade,
        upsell_opportunity: needsUpgrade
      };
    });

    res.json({ 
      usage: usageData,
      upsell_opportunities: usageData.filter(t => t.upsell_opportunity)
    });
  })
);

/**
 * GET /api/billing-revenue/churn-analysis
 * Churn-analys
 */
router.get('/churn-analysis',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const result = await query(`
      SELECT 
        t.id,
        t.company_name,
        t.subscription_tier,
        t.is_active,
        t.created_at,
        (SELECT MAX(al.created_at) FROM activity_log al 
         JOIN users u ON al.user_id = u.id 
         WHERE u.tenant_id = t.id) as last_activity,
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id AND status = 'active') as active_users
      FROM tenants t
    `);

    const churnData = result.rows.map(tenant => {
      const daysSinceActivity = tenant.last_activity 
        ? Math.floor((Date.now() - new Date(tenant.last_activity).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let churnRisk = 'Low';
      if (!tenant.is_active) {
        churnRisk = 'Churned';
      } else if (daysSinceActivity > 30) {
        churnRisk = 'High';
      } else if (daysSinceActivity > 14) {
        churnRisk = 'Medium';
      }

      return {
        tenant_id: tenant.id,
        tenant_name: tenant.company_name,
        subscription_tier: tenant.subscription_tier,
        is_active: tenant.is_active,
        days_since_activity: daysSinceActivity,
        churn_risk: churnRisk,
        active_users: parseInt(tenant.active_users),
        created_at: tenant.created_at
      };
    });

    res.json({
      churn_analysis: churnData,
      at_risk: churnData.filter(t => t.churn_risk === 'High' || t.churn_risk === 'Medium'),
      churned: churnData.filter(t => t.churn_risk === 'Churned')
    });
  })
);

/**
 * GET /api/billing-revenue/pricing-tiers
 * Visa pricing tiers
 */
router.get('/pricing-tiers',
  asyncHandler(async (req, res) => {
    res.json({ pricing: PRICING });
  })
);

export default router;
