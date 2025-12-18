import { query } from '../../../server/config/database.js';
import { logger } from '../../../server/utils/logger.js';

/**
 * GET /api/admin/leads/all
 * Hämta alla leads från databasen (ingen sökning, bara databas-query)
 * Endast för SuperAdmin
 */
export default async function handler(req, res) {
  try {
    // Verify super admin
    const user = req.user;
    if (!user || user.role !== 'admin' || user.tenant_id) {
      return res.status(403).json({ error: 'Åtkomst nekad. Kräver super admin-behörighet.' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tenant_id, carrier, has_dhl, limit = 1000, offset = 0 } = req.query;

    // Build query
    let sql = `
      SELECT 
        l.id,
        l.company_name,
        l.org_number,
        l.domain,
        l.tenant_id,
        t.company_name as tenant_name,
        l.ecommerce_platform,
        l.shipping_providers as carriers,
        l.shipping_providers_with_position,
        l.created_at,
        l.created_by,
        u.full_name as created_by_user,
        l.is_anonymized,
        l.website_analysis
      FROM leads l
      LEFT JOIN tenants t ON l.tenant_id = t.id
      LEFT JOIN users u ON l.created_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by tenant
    if (tenant_id) {
      sql += ` AND l.tenant_id = $${paramIndex}`;
      params.push(tenant_id);
      paramIndex++;
    }

    // Filter by carrier
    if (carrier) {
      sql += ` AND l.shipping_providers ILIKE $${paramIndex}`;
      params.push(`%${carrier}%`);
      paramIndex++;
    }

    // Filter by DHL presence
    if (has_dhl === 'true') {
      sql += ` AND l.shipping_providers ILIKE '%DHL%'`;
    }

    // Order by most recent first
    sql += ` ORDER BY l.created_at DESC`;

    // Pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Process leads to extract DHL position
    const leads = result.rows.map(lead => {
      let hasDhl = false;
      let dhlPosition = null;

      // Check if DHL exists in carriers
      if (lead.carriers && lead.carriers.toLowerCase().includes('dhl')) {
        hasDhl = true;

        // Try to get position from shipping_providers_with_position
        if (lead.shipping_providers_with_position) {
          try {
            const positions = typeof lead.shipping_providers_with_position === 'string'
              ? JSON.parse(lead.shipping_providers_with_position)
              : lead.shipping_providers_with_position;

            const dhlEntry = positions.find(p => 
              p.name && p.name.toLowerCase().includes('dhl')
            );

            if (dhlEntry && dhlEntry.position) {
              dhlPosition = dhlEntry.position;
            }
          } catch (e) {
            logger.warn('Failed to parse shipping_providers_with_position:', e);
          }
        }
      }

      return {
        id: lead.id,
        company_name: lead.company_name,
        org_number: lead.org_number,
        domain: lead.domain,
        tenant_id: lead.tenant_id,
        tenant_name: lead.tenant_name,
        ecommerce_platform: lead.ecommerce_platform,
        carriers: lead.carriers,
        has_dhl: hasDhl,
        dhl_position: dhlPosition,
        checkout_position: dhlPosition ? `Position ${dhlPosition}` : (hasDhl ? 'Okänd position' : 'Ej DHL'),
        created_at: lead.created_at,
        created_by_user: lead.created_by_user,
        is_anonymized: lead.is_anonymized
      };
    });

    // Get total count
    let countSql = `
      SELECT COUNT(*) as total
      FROM leads l
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (tenant_id) {
      countSql += ` AND l.tenant_id = $${countParamIndex}`;
      countParams.push(tenant_id);
      countParamIndex++;
    }

    if (carrier) {
      countSql += ` AND l.shipping_providers ILIKE $${countParamIndex}`;
      countParams.push(`%${carrier}%`);
      countParamIndex++;
    }

    if (has_dhl === 'true') {
      countSql += ` AND l.shipping_providers ILIKE '%DHL%'`;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    return res.json({
      success: true,
      leads,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Error fetching all leads:', error);
    return res.status(500).json({ error: 'Serverfel vid hämtning av leads' });
  }
}
