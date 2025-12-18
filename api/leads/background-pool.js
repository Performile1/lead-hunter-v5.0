import { query } from '../../server/config/database.js';
import { logger } from '../../server/utils/logger.js';

/**
 * GET /api/leads/background-pool
 * Hämta delade leads i bakgrunden (som lead search)
 * Körs automatiskt när användare öppnar lead-sidan
 */
export default async function handler(req, res) {
  try {
    const user = req.user;
    if (!user || !user.tenant_id) {
      return res.status(403).json({ error: 'Åtkomst nekad' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { 
      segment, 
      area, 
      sni_code, 
      min_revenue, 
      max_revenue,
      limit = 50,
      offset = 0 
    } = req.query;

    // Hämta tenant settings för primary carrier
    const tenantSettings = await query(
      'SELECT primary_carrier FROM tenant_settings WHERE tenant_id = $1',
      [user.tenant_id]
    );
    const primaryCarrier = tenantSettings.rows[0]?.primary_carrier || 'DHL';

    // Build query för delade leads
    let sql = `
      SELECT DISTINCT
        l.id,
        l.company_name,
        l.org_number,
        l.domain,
        l.segment,
        l.revenue_tkr,
        l.revenue_year,
        l.city,
        l.region,
        l.postal_code,
        l.sni_code,
        l.sni_description,
        l.shipping_providers,
        l.shipping_providers_with_position,
        l.ecommerce_platform,
        l.created_at,
        t.company_name as source_tenant_name,
        
        -- Check if lead has tenant's primary carrier
        CASE 
          WHEN l.shipping_providers ILIKE '%' || $1 || '%' 
          THEN true 
          ELSE false 
        END as has_primary_carrier
        
      FROM leads l
      LEFT JOIN tenants t ON l.tenant_id = t.id
      
      WHERE 
        -- Exclude leads from current tenant
        l.tenant_id != $2
        
        -- Exclude existing customers (by lead_id)
        AND l.id NOT IN (
          SELECT lead_id FROM customers 
          WHERE tenant_id = $2 AND lead_id IS NOT NULL
        )
        
        -- Exclude existing customers (by org_number)
        AND l.org_number NOT IN (
          SELECT org_number FROM customers 
          WHERE tenant_id = $2 AND org_number IS NOT NULL
        )
    `;

    const params = [primaryCarrier, user.tenant_id];
    let paramIndex = 3;

    // Apply filters
    if (segment) {
      sql += ` AND l.segment = $${paramIndex}`;
      params.push(segment);
      paramIndex++;
    }

    if (area) {
      sql += ` AND (l.postal_code LIKE $${paramIndex} OR l.region ILIKE $${paramIndex})`;
      params.push(`${area}%`);
      paramIndex++;
    }

    if (sni_code) {
      sql += ` AND l.sni_code LIKE $${paramIndex}`;
      params.push(`${sni_code}%`);
      paramIndex++;
    }

    if (min_revenue) {
      sql += ` AND l.revenue_tkr >= $${paramIndex}`;
      params.push(parseInt(min_revenue));
      paramIndex++;
    }

    if (max_revenue) {
      sql += ` AND l.revenue_tkr <= $${paramIndex}`;
      params.push(parseInt(max_revenue));
      paramIndex++;
    }

    // Order by: leads with primary carrier first, then by revenue
    sql += `
      ORDER BY 
        has_primary_carrier DESC,
        l.revenue_tkr DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Process leads to extract carrier position
    const leads = result.rows.map(lead => {
      let primaryCarrierPosition = null;

      if (lead.has_primary_carrier && lead.shipping_providers_with_position) {
        try {
          const positions = typeof lead.shipping_providers_with_position === 'string'
            ? JSON.parse(lead.shipping_providers_with_position)
            : lead.shipping_providers_with_position;

          const carrierEntry = positions.find(p => 
            p.name && p.name.toLowerCase().includes(primaryCarrier.toLowerCase())
          );

          if (carrierEntry && carrierEntry.position) {
            primaryCarrierPosition = carrierEntry.position;
          }
        } catch (e) {
          logger.warn('Failed to parse shipping_providers_with_position:', e);
        }
      }

      return {
        ...lead,
        primary_carrier_position: primaryCarrierPosition
      };
    });

    // Get total count
    let countSql = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM leads l
      WHERE l.tenant_id != $1
        AND l.id NOT IN (
          SELECT lead_id FROM customers 
          WHERE tenant_id = $1 AND lead_id IS NOT NULL
        )
        AND l.org_number NOT IN (
          SELECT org_number FROM customers 
          WHERE tenant_id = $1 AND org_number IS NOT NULL
        )
    `;

    const countParams = [user.tenant_id];
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
      countSql += ` AND l.revenue_tkr >= $${countParamIndex}`;
      countParams.push(parseInt(min_revenue));
      countParamIndex++;
    }

    if (max_revenue) {
      countSql += ` AND l.revenue_tkr <= $${countParamIndex}`;
      countParams.push(parseInt(max_revenue));
      countParamIndex++;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    return res.json({
      success: true,
      leads,
      total,
      tenant_context: {
        primary_carrier: primaryCarrier,
        excluded_customers: true
      }
    });

  } catch (error) {
    logger.error('Error fetching background lead pool:', error);
    return res.status(500).json({ error: 'Serverfel vid hämtning av delad lead-pool' });
  }
}
