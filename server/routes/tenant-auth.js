import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/tenant-auth/info
 * Hämta tenant info baserat på subdomän eller domain
 */
router.get('/info', async (req, res) => {
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
                secondary_color, logo_url, search_term
         FROM tenants 
         WHERE subdomain = $1 AND status = 'active'`,
        [subdomain]
      );
    } else if (domain) {
      result = await query(
        `SELECT id, company_name, domain, subdomain, primary_color, 
                secondary_color, logo_url, search_term
         FROM tenants 
         WHERE domain = $1 AND status = 'active'`,
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
});

export default router;
