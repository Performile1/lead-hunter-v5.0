import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Alla routes kräver autentisering
router.use(authenticate);

/**
 * GET /api/analytics/platforms
 * E-handelsplattformar distribution
 */
router.get('/platforms',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { tenant_id } = req.query;
    
    let sql = `
      SELECT 
        ecommerce_platform as platform,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM leads
      WHERE ecommerce_platform IS NOT NULL
    `;
    
    const params = [];
    if (tenant_id && !req.isSuperAdmin) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    } else if (tenant_id && req.isSuperAdmin) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    }
    
    sql += ' GROUP BY ecommerce_platform ORDER BY count DESC';
    
    const result = await query(sql, params);
    
    res.json({
      platforms: result.rows,
      total: result.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
    });
  })
);

/**
 * GET /api/analytics/checkout
 * Checkout-lösningar distribution
 */
router.get('/checkout',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { tenant_id } = req.query;
    
    // Parse checkout_position to extract providers
    let sql = `
      SELECT 
        TRIM(REGEXP_REPLACE(
          UNNEST(STRING_TO_ARRAY(checkout_position, ',')), 
          '\\d+\\.\\s*', 
          '', 
          'g'
        )) as provider,
        COUNT(*) as count
      FROM leads
      WHERE checkout_position IS NOT NULL
    `;
    
    const params = [];
    if (tenant_id && !req.isSuperAdmin) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    } else if (tenant_id && req.isSuperAdmin) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    }
    
    sql += `
      GROUP BY provider
      HAVING TRIM(REGEXP_REPLACE(
        UNNEST(STRING_TO_ARRAY(checkout_position, ',')), 
        '\\d+\\.\\s*', 
        '', 
        'g'
      )) != ''
      ORDER BY count DESC
    `;
    
    const result = await query(sql, params);
    
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const withPercentage = result.rows.map(row => ({
      ...row,
      percentage: ((parseInt(row.count) / total) * 100).toFixed(2)
    }));
    
    res.json({
      providers: withPercentage,
      total
    });
  })
);

/**
 * GET /api/analytics/carriers
 * Transportörer distribution
 */
router.get('/carriers',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { tenant_id } = req.query;
    
    let sql = `
      SELECT 
        TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) as carrier,
        COUNT(*) as count
      FROM leads
      WHERE carriers IS NOT NULL
    `;
    
    const params = [];
    if (tenant_id && !req.isSuperAdmin) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    } else if (tenant_id && req.isSuperAdmin) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    }
    
    sql += `
      GROUP BY carrier
      HAVING TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) != ''
      ORDER BY count DESC
    `;
    
    const result = await query(sql, params);
    
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const withPercentage = result.rows.map(row => ({
      ...row,
      percentage: ((parseInt(row.count) / total) * 100).toFixed(2)
    }));
    
    res.json({
      carriers: withPercentage,
      total
    });
  })
);

/**
 * GET /api/analytics/delivery-methods
 * Leveranssätt distribution
 */
router.get('/delivery-methods',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { tenant_id } = req.query;
    
    let sql = `
      SELECT 
        TRIM(UNNEST(delivery_services)) as method,
        COUNT(*) as count
      FROM leads
      WHERE delivery_services IS NOT NULL
    `;
    
    const params = [];
    if (tenant_id && !req.isSuperAdmin) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    } else if (tenant_id && req.isSuperAdmin) {
      sql += ' AND tenant_id = $1';
      params.push(tenant_id);
    }
    
    sql += `
      GROUP BY method
      HAVING TRIM(UNNEST(delivery_services)) != ''
      ORDER BY count DESC
    `;
    
    const result = await query(sql, params);
    
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const withPercentage = result.rows.map(row => ({
      ...row,
      percentage: ((parseInt(row.count) / total) * 100).toFixed(2)
    }));
    
    res.json({
      methods: withPercentage,
      total
    });
  })
);

/**
 * GET /api/analytics/tenant-activity
 * Tenant aktivitet (senaste 24h eller custom period)
 */
router.get('/tenant-activity',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { hours = 24, tenant_id } = req.query;
    
    let sql = `
      SELECT 
        t.company_name as tenant_name,
        t.id as tenant_id,
        al.action_type,
        al.details,
        al.created_at,
        u.full_name as user_name,
        u.email as user_email
      FROM activity_log al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE al.created_at > NOW() - INTERVAL '${parseInt(hours)} hours'
    `;
    
    const params = [];
    if (tenant_id) {
      sql += ' AND u.tenant_id = $1';
      params.push(tenant_id);
    }
    
    sql += ' ORDER BY al.created_at DESC LIMIT 100';
    
    const result = await query(sql, params);
    
    // Group by tenant
    const byTenant = result.rows.reduce((acc, row) => {
      const tenantName = row.tenant_name || 'System';
      if (!acc[tenantName]) {
        acc[tenantName] = [];
      }
      acc[tenantName].push(row);
      return acc;
    }, {});
    
    res.json({
      activities: result.rows,
      by_tenant: byTenant,
      period_hours: parseInt(hours)
    });
  })
);

/**
 * GET /api/analytics/system-health
 * System health metrics (endast super admin)
 */
router.get('/system-health',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    // Tenants
    const tenantsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active
      FROM tenants
    `);
    
    // Users
    const usersResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '24 hours') as active_24h
      FROM users
    `);
    
    // Leads
    const leadsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as created_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as created_7d
      FROM leads
    `);
    
    // Customers
    const customersResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as created_24h
      FROM customers
    `);
    
    // Database size
    const dbSizeResult = await query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    res.json({
      tenants: tenantsResult.rows[0],
      users: usersResult.rows[0],
      leads: leadsResult.rows[0],
      customers: customersResult.rows[0],
      database: {
        size: dbSizeResult.rows[0].size
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/analytics/overview
 * Komplett översikt för super admin dashboard
 */
router.get('/overview',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    try {
      // Hämta alla metrics parallellt
      const [platforms, checkout, carriers, deliveryMethods, systemHealth] = await Promise.all([
        // E-handelsplattformar
        query(`
          SELECT 
            ecommerce_platform as platform,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 2) as percentage
          FROM leads
          WHERE ecommerce_platform IS NOT NULL AND ecommerce_platform != ''
          GROUP BY ecommerce_platform
          ORDER BY count DESC
          LIMIT 10
        `),
        // Checkout providers
        query(`
          SELECT 
            UNNEST(checkout_providers) as provider,
            COUNT(*) as count
          FROM leads
          WHERE checkout_providers IS NOT NULL AND array_length(checkout_providers, 1) > 0
          GROUP BY provider
          ORDER BY count DESC
          LIMIT 10
        `),
        // Carriers (shipping providers)
        query(`
          SELECT 
            TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) as carrier,
            COUNT(*) as count
          FROM leads
          WHERE carriers IS NOT NULL AND carriers != ''
          GROUP BY carrier
          HAVING TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) != ''
          ORDER BY count DESC
          LIMIT 10
        `),
        // Delivery methods
        query(`
          SELECT 
            UNNEST(delivery_services) as method,
            COUNT(*) as count
          FROM leads
          WHERE delivery_services IS NOT NULL AND array_length(delivery_services, 1) > 0
          GROUP BY method
          ORDER BY count DESC
          LIMIT 10
        `),
        // System health
        query(`
          SELECT 
            (SELECT COUNT(*) FROM tenants WHERE is_active = true) as active_tenants,
            (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
            (SELECT COUNT(*) FROM leads) as total_leads,
            (SELECT COUNT(*) FROM customers) as total_customers
        `)
      ]);

      res.json({
        platforms: platforms.rows,
        checkout_providers: checkout.rows,
        carriers: carriers.rows,
        delivery_methods: deliveryMethods.rows,
        recent_activity: [], // TODO: Implement activity log
        system_health: systemHealth.rows[0] || {
          active_tenants: 0,
          active_users: 0,
          total_leads: 0,
          total_customers: 0
        }
      });
    } catch (error) {
      console.error('Analytics overview error:', error);
      // Returnera tom data istället för att krascha
      res.json({
        platforms: [],
        checkout_providers: [],
        carriers: [],
        delivery_methods: [],
        recent_activity: [],
        system_health: {
          active_tenants: 0,
          active_users: 0,
          total_leads: 0,
          total_customers: 0
        }
      });
    }
  })
);

// Gammal komplex version - kan aktiveras när databasen är stabil
/*
router.get('/overview-full',
  asyncHandler(async (req, res) => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    // Hämta alla metrics parallellt
    const [platforms, checkout, carriers, deliveryMethods, tenantActivity, systemHealth] = await Promise.all([
      query(`
        SELECT 
          ecommerce_platform as platform,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM leads
        WHERE ecommerce_platform IS NOT NULL
        GROUP BY ecommerce_platform
        ORDER BY count DESC
        LIMIT 10
      `),
      query(`
        SELECT 
          TRIM(REGEXP_REPLACE(
            UNNEST(STRING_TO_ARRAY(checkout_position, ',')), 
            '\\d+\\.\\s*', 
            '', 
            'g'
          )) as provider,
          COUNT(*) as count
        FROM leads
        WHERE checkout_position IS NOT NULL
        GROUP BY provider
        HAVING TRIM(REGEXP_REPLACE(
          UNNEST(STRING_TO_ARRAY(checkout_position, ',')), 
          '\\d+\\.\\s*', 
          '', 
          'g'
        )) != ''
        ORDER BY count DESC
        LIMIT 10
      `),
      query(`
        SELECT 
          TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) as carrier,
          COUNT(*) as count
        FROM leads
        WHERE carriers IS NOT NULL
        GROUP BY carrier
        HAVING TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) != ''
        ORDER BY count DESC
        LIMIT 10
      `),
      query(`
        SELECT 
          TRIM(UNNEST(delivery_services)) as method,
          COUNT(*) as count
        FROM leads
        WHERE delivery_services IS NOT NULL
        GROUP BY method
        HAVING TRIM(UNNEST(delivery_services)) != ''
        ORDER BY count DESC
        LIMIT 10
      `),
      query(`
        SELECT 
          t.company_name as tenant_name,
          al.action_type,
          al.created_at,
          u.full_name as user_name
        FROM activity_log al
        JOIN users u ON al.user_id = u.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE al.created_at > NOW() - INTERVAL '24 hours'
        ORDER BY al.created_at DESC
        LIMIT 20
      `),
      query(`
        SELECT 
          (SELECT COUNT(*) FROM tenants WHERE is_active = true) as active_tenants,
          (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
          (SELECT COUNT(*) FROM leads) as total_leads,
          (SELECT COUNT(*) FROM customers) as total_customers
      `)
    ]);
    
    res.json({
      platforms: platforms.rows,
      checkout_providers: checkout.rows,
      carriers: carriers.rows,
      delivery_methods: deliveryMethods.rows,
      recent_activity: tenantActivity.rows,
      system_health: systemHealth.rows[0]
    });
  })
);
*/

/**
 * GET /api/analytics/tenant-segments
 * Segment distribution for tenant (Manager/Terminal dashboards)
 */
router.get('/tenant-segments',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId;
    const { region, terminal_id } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    try {
      // Base query för tenant
      let baseWhere = 'WHERE l.tenant_id = $1';
      const params = [tenantId];
      let paramIndex = 2;
      
      // Filter för terminal chef (specifik terminal)
      if (terminal_id) {
        baseWhere += ` AND l.assigned_terminal_id = $${paramIndex}`;
        params.push(terminal_id);
        paramIndex++;
      }
      
      // Filter för manager (specifik region/postnummer)
      if (region) {
        baseWhere += ` AND SUBSTRING(l.postal_code, 1, 2) = $${paramIndex}`;
        params.push(region);
        paramIndex++;
      }
      
      // Hämta alla metrics parallellt
      const [platforms, checkout, carriers, deliveryMethods, segments] = await Promise.all([
        // E-handelsplattformar
        query(`
          SELECT 
            ecommerce_platform as platform,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 2) as percentage
          FROM leads l
          ${baseWhere}
            AND ecommerce_platform IS NOT NULL AND ecommerce_platform != ''
          GROUP BY ecommerce_platform
          ORDER BY count DESC
          LIMIT 10
        `, params),
        
        // Checkout providers
        query(`
          SELECT 
            UNNEST(checkout_providers) as provider,
            COUNT(*) as count
          FROM leads l
          ${baseWhere}
            AND checkout_providers IS NOT NULL AND array_length(checkout_providers, 1) > 0
          GROUP BY provider
          ORDER BY count DESC
          LIMIT 10
        `, params),
        
        // Carriers (shipping providers)
        query(`
          SELECT 
            TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) as carrier,
            COUNT(*) as count
          FROM leads l
          ${baseWhere}
            AND carriers IS NOT NULL AND carriers != ''
          GROUP BY carrier
          HAVING TRIM(UNNEST(STRING_TO_ARRAY(carriers, ','))) != ''
          ORDER BY count DESC
          LIMIT 10
        `, params),
        
        // Delivery methods
        query(`
          SELECT 
            UNNEST(delivery_services) as method,
            COUNT(*) as count
          FROM leads l
          ${baseWhere}
            AND delivery_services IS NOT NULL AND array_length(delivery_services, 1) > 0
          GROUP BY method
          ORDER BY count DESC
          LIMIT 10
        `, params),
        
        // Segment distribution
        query(`
          SELECT 
            segment,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 2) as percentage
          FROM leads l
          ${baseWhere}
            AND segment IS NOT NULL AND segment != ''
          GROUP BY segment
          ORDER BY count DESC
        `, params)
      ]);
      
      res.json({
        platforms: platforms.rows,
        checkout_providers: checkout.rows,
        carriers: carriers.rows,
        delivery_methods: deliveryMethods.rows,
        segments: segments.rows,
        filters: {
          tenant_id: tenantId,
          terminal_id: terminal_id || null,
          region: region || null
        }
      });
    } catch (error) {
      console.error('Tenant segments analytics error:', error);
      res.json({
        platforms: [],
        checkout_providers: [],
        carriers: [],
        delivery_methods: [],
        segments: [],
        filters: {
          tenant_id: tenantId,
          terminal_id: terminal_id || null,
          region: region || null
        }
      });
    }
  })
);

export default router;
