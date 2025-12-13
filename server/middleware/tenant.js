import { pool } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware för att extrahera och validera tenant från användare
 * Lägger till req.tenant och req.isSuperAdmin
 */
export const extractTenant = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Hämta user med tenant info
    const result = await pool.query(`
      SELECT 
        u.id,
        u.tenant_id,
        u.is_super_admin,
        u.role,
        t.id as tenant_id,
        t.company_name,
        t.domain,
        t.checkout_search_term,
        t.main_competitor,
        t.is_active as tenant_active,
        t.subscription_tier,
        t.max_users,
        t.max_leads_per_month,
        t.max_customers
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = result.rows[0];

    // Super admin har alltid åtkomst
    req.isSuperAdmin = userData.is_super_admin || false;

    if (!req.isSuperAdmin) {
      // Vanlig användare måste ha en tenant
      if (!userData.tenant_id) {
        return res.status(403).json({ error: 'User not associated with any tenant' });
      }

      // Kontrollera att tenant är aktiv
      if (!userData.tenant_active) {
        return res.status(403).json({ error: 'Tenant account is inactive' });
      }

      req.tenant = {
        id: userData.tenant_id,
        companyName: userData.company_name,
        domain: userData.domain,
        checkoutSearchTerm: userData.checkout_search_term,
        mainCompetitor: userData.main_competitor,
        subscriptionTier: userData.subscription_tier,
        maxUsers: userData.max_users,
        maxLeadsPerMonth: userData.max_leads_per_month,
        maxCustomers: userData.max_customers
      };
    } else {
      // Super admin kan ha null tenant (ser alla)
      req.tenant = userData.tenant_id ? {
        id: userData.tenant_id,
        companyName: userData.company_name,
        domain: userData.domain,
        checkoutSearchTerm: userData.checkout_search_term,
        mainCompetitor: userData.main_competitor,
        subscriptionTier: userData.subscription_tier,
        maxUsers: userData.max_users,
        maxLeadsPerMonth: userData.max_leads_per_month,
        maxCustomers: userData.max_customers
      } : null;
    }

    next();
  } catch (error) {
    logger.error('Error extracting tenant:', error);
    res.status(500).json({ error: 'Failed to extract tenant information' });
  }
};

/**
 * Middleware för att säkerställa att endast super admin har åtkomst
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

/**
 * Middleware för att filtrera data baserat på tenant
 * Lägger till WHERE tenant_id = $X i queries
 */
export const tenantFilter = (tableName = 'tenant_id') => {
  return (req, res, next) => {
    if (req.isSuperAdmin) {
      // Super admin ser allt (om inte specifik tenant begärs)
      req.tenantFilter = req.query.tenant_id ? {
        field: tableName,
        value: req.query.tenant_id
      } : null;
    } else {
      // Vanlig användare ser bara sin tenant
      req.tenantFilter = {
        field: tableName,
        value: req.tenant.id
      };
    }
    next();
  };
};

/**
 * Helper function för att bygga WHERE clause med tenant filter
 */
export const buildTenantWhereClause = (req, baseConditions = [], baseParams = []) => {
  const conditions = [...baseConditions];
  const params = [...baseParams];
  let paramIndex = params.length + 1;

  if (req.tenantFilter) {
    conditions.push(`${req.tenantFilter.field} = $${paramIndex}`);
    params.push(req.tenantFilter.value);
    paramIndex++;
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
    paramIndex
  };
};

/**
 * Middleware för att kontrollera tenant limits
 */
export const checkTenantLimits = (limitType) => {
  return async (req, res, next) => {
    if (req.isSuperAdmin) {
      return next(); // Super admin har inga limits
    }

    if (!req.tenant) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

      // Hämta current usage
      const usageResult = await pool.query(`
        SELECT * FROM tenant_usage
        WHERE tenant_id = $1 AND month = $2
      `, [req.tenant.id, currentMonth]);

      let usage = usageResult.rows[0];

      if (!usage) {
        // Skapa ny usage record
        await pool.query(`
          INSERT INTO tenant_usage (tenant_id, month)
          VALUES ($1, $2)
        `, [req.tenant.id, currentMonth]);
        
        usage = {
          leads_created: 0,
          customers_created: 0,
          api_calls: 0,
          monitoring_checks: 0
        };
      }

      // Kontrollera limits
      switch (limitType) {
        case 'leads':
          if (usage.leads_created >= req.tenant.maxLeadsPerMonth) {
            return res.status(429).json({ 
              error: 'Monthly lead limit reached',
              limit: req.tenant.maxLeadsPerMonth,
              current: usage.leads_created
            });
          }
          break;

        case 'customers':
          const customerCount = await pool.query(`
            SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1
          `, [req.tenant.id]);
          
          if (parseInt(customerCount.rows[0].count) >= req.tenant.maxCustomers) {
            return res.status(429).json({ 
              error: 'Customer limit reached',
              limit: req.tenant.maxCustomers,
              current: customerCount.rows[0].count
            });
          }
          break;

        case 'users':
          const userCount = await pool.query(`
            SELECT COUNT(*) as count FROM users WHERE tenant_id = $1
          `, [req.tenant.id]);
          
          if (parseInt(userCount.rows[0].count) >= req.tenant.maxUsers) {
            return res.status(429).json({ 
              error: 'User limit reached',
              limit: req.tenant.maxUsers,
              current: userCount.rows[0].count
            });
          }
          break;
      }

      req.tenantUsage = usage;
      next();
    } catch (error) {
      logger.error('Error checking tenant limits:', error);
      res.status(500).json({ error: 'Failed to check tenant limits' });
    }
  };
};

/**
 * Middleware för att uppdatera tenant usage
 */
export const updateTenantUsage = (usageType) => {
  return async (req, res, next) => {
    if (req.isSuperAdmin || !req.tenant) {
      return next();
    }

    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

      let field;
      switch (usageType) {
        case 'leads': field = 'leads_created'; break;
        case 'customers': field = 'customers_created'; break;
        case 'api_calls': field = 'api_calls'; break;
        case 'monitoring': field = 'monitoring_checks'; break;
        default: return next();
      }

      await pool.query(`
        INSERT INTO tenant_usage (tenant_id, month, ${field})
        VALUES ($1, $2, 1)
        ON CONFLICT (tenant_id, month)
        DO UPDATE SET 
          ${field} = tenant_usage.${field} + 1,
          updated_at = NOW()
      `, [req.tenant.id, currentMonth]);

      next();
    } catch (error) {
      logger.error('Error updating tenant usage:', error);
      // Don't fail the request, just log
      next();
    }
  };
};

/**
 * Helper för att validera tenant access till resource
 */
export const validateTenantAccess = async (req, resourceTenantId) => {
  if (req.isSuperAdmin) {
    return true; // Super admin har alltid åtkomst
  }

  if (!req.tenant) {
    return false;
  }

  return req.tenant.id === resourceTenantId;
};

export default {
  extractTenant,
  requireSuperAdmin,
  tenantFilter,
  buildTenantWhereClause,
  checkTenantLimits,
  updateTenantUsage,
  validateTenantAccess
};
