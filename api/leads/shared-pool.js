import { query } from '../../server/config/database.js';
import { logger } from '../../server/utils/logger.js';

/**
 * GET /api/leads/shared-pool
 * Hämta leads från andra tenants baserat på kriterier
 * Exkluderar tenant's egna kunder
 */
export default async function handler(req, res) {
  try {
    const user = req.user;
    if (!user || !user.tenant_id) {
      return res.status(403).json({ error: 'Åtkomst nekad. Kräver tenant-användare.' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
      segment,        // 'tier1', 'tier2', 'tier3', 'tier4'
      area,           // Postnummer-prefix eller region
      sni_code,       // SNI-kod
      min_revenue,    // Minimum omsättning
      max_revenue,    // Maximum omsättning
      limit = 50,
      offset = 0
    } = req.query;

    const tenantId = user.tenant_id;

    // Build query to get leads from OTHER tenants
    let sql = `
      SELECT DISTINCT
        l.id,
        l.company_name,
        l.org_number,
        l.domain,
        l.address,
        l.postal_code,
        l.city,
        l.region,
        l.revenue,
        l.segment,
        l.sni_code,
        l.sni_description,
        l.ecommerce_platform,
        l.shipping_providers,
        l.shipping_providers_with_position,
        l.created_at,
        l.tenant_id as source_tenant_id,
        t.company_name as source_tenant_name,
        
        -- Check if lead's carrier matches tenant's primary carrier
        CASE 
          WHEN l.shipping_providers ILIKE '%' || ts.primary_carrier || '%' 
          THEN true 
          ELSE false 
        END as has_primary_carrier,
        
        -- Get position of tenant's primary carrier
        (
          SELECT position 
          FROM jsonb_array_elements(l.shipping_providers_with_position::jsonb) AS elem
          WHERE elem->>'name' ILIKE '%' || ts.primary_carrier || '%'
          LIMIT 1
        ) as primary_carrier_position
        
      FROM leads l
      LEFT JOIN tenants t ON l.tenant_id = t.id
      LEFT JOIN tenant_settings ts ON ts.tenant_id = $1
      
      WHERE 1=1
        -- Exclude leads from current tenant
        AND l.tenant_id != $1
        
        -- Exclude leads that are already customers of current tenant
        AND l.id NOT IN (
          SELECT lead_id 
          FROM customers 
          WHERE tenant_id = $1 
          AND lead_id IS NOT NULL
        )
        
        -- Exclude companies that are already customers (by org_number)
        AND l.org_number NOT IN (
          SELECT org_number 
          FROM customers 
          WHERE tenant_id = $1 
          AND org_number IS NOT NULL
        )
    `;

    const params = [tenantId];
    let paramIndex = 2;

    // Filter by segment (Tier 1-4)
    if (segment) {
      sql += ` AND l.segment = $${paramIndex}`;
      params.push(segment);
      paramIndex++;
    }

    // Filter by area (postal code prefix)
    if (area) {
      sql += ` AND (l.postal_code LIKE $${paramIndex} OR l.region ILIKE $${paramIndex})`;
      params.push(`${area}%`);
      paramIndex++;
    }

    // Filter by SNI code
    if (sni_code) {
      sql += ` AND l.sni_code LIKE $${paramIndex}`;
      params.push(`${sni_code}%`);
      paramIndex++;
    }

    // Filter by revenue range
    if (min_revenue) {
      sql += ` AND l.revenue_numeric >= $${paramIndex}`;
      params.push(parseFloat(min_revenue));
      paramIndex++;
    }

    if (max_revenue) {
      sql += ` AND l.revenue_numeric <= $${paramIndex}`;
      params.push(parseFloat(max_revenue));
      paramIndex++;
    }

    // Order by most relevant first
    sql += `
      ORDER BY 
        has_primary_carrier DESC,
        primary_carrier_position ASC NULLS LAST,
        l.revenue_numeric DESC,
        l.created_at DESC
    `;

    // Pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count
    let countSql = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM leads l
      LEFT JOIN tenant_settings ts ON ts.tenant_id = $1
      WHERE l.tenant_id != $1
        AND l.id NOT IN (
          SELECT lead_id FROM customers WHERE tenant_id = $1 AND lead_id IS NOT NULL
        )
        AND l.org_number NOT IN (
          SELECT org_number FROM customers WHERE tenant_id = $1 AND org_number IS NOT NULL
        )
    `;

    const countParams = [tenantId];
    let countParamIndex = 2;

    if (segment) {
      countSql += ` AND l.segment = $${countParamIndex}`;
      countParams.push(segment);
      countParamIndex++;
    }

    if (area) {
      countSql += ` AND (l.postal_code LIKE $${countParamIndex} OR l.region ILIKE $${countParamIndex})`;
      countParams.push(`${area}%`);
      countParamIndex++;
    }

    if (sni_code) {
      countSql += ` AND l.sni_code LIKE $${countParamIndex}`;
      countParams.push(`${sni_code}%`);
      countParamIndex++;
    }

    if (min_revenue) {
      countSql += ` AND l.revenue_numeric >= $${countParamIndex}`;
      countParams.push(parseFloat(min_revenue));
      countParamIndex++;
    }

    if (max_revenue) {
      countSql += ` AND l.revenue_numeric <= $${countParamIndex}`;
      countParams.push(parseFloat(max_revenue));
      countParamIndex++;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Get tenant's primary carrier for context
    const tenantSettings = await query(
      'SELECT primary_carrier, competitor_carriers FROM tenant_settings WHERE tenant_id = $1',
      [tenantId]
    );

    const primaryCarrier = tenantSettings.rows[0]?.primary_carrier || null;

    return res.json({
      success: true,
      leads: result.rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      filters: {
        segment,
        area,
        sni_code,
        min_revenue,
        max_revenue
      },
      tenant_context: {
        primary_carrier: primaryCarrier,
        excluded_customers: true
      }
    });

  } catch (error) {
    logger.error('Error fetching shared lead pool:', error);
    return res.status(500).json({ error: 'Serverfel vid hämtning av delad lead-pool' });
  }
}
