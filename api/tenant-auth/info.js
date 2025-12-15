import { query } from '../_lib/database.js';

/**
 * GET /api/tenant-auth/info
 * Hämta tenant info baserat på subdomän eller domain
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subdomain, domain } = req.query;
    
    if (!subdomain && !domain) {
      return res.json({
        tenant: null,
        isSuperAdminLogin: true
      });
    }
    
    let result;
    if (subdomain) {
      result = await query(
        `SELECT id, company_name, domain, subdomain, primary_color, 
                secondary_color, logo_url, checkout_search_term as search_term
         FROM tenants 
         WHERE subdomain = $1 AND is_active = true`,
        [subdomain]
      );
    } else if (domain) {
      result = await query(
        `SELECT id, company_name, domain, subdomain, primary_color, 
                secondary_color, logo_url, checkout_search_term as search_term
         FROM tenants 
         WHERE domain = $1 AND is_active = true`,
        [domain]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tenant not found',
        isSuperAdminLogin: true
      });
    }
    
    const tenant = result.rows[0];
    
    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.company_name,
        domain: tenant.domain,
        subdomain: tenant.subdomain,
        primaryColor: tenant.primary_color,
        secondaryColor: tenant.secondary_color,
        logoUrl: tenant.logo_url,
        searchTerm: tenant.search_term
      },
      isSuperAdminLogin: false
    });
    
  } catch (error) {
    console.error('Error fetching tenant info:', error);
    res.status(500).json({ error: 'Failed to fetch tenant info' });
  }
}
