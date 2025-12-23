/**
 * Vercel Serverless Function: Tenant Management
 * Handles all /api/tenants/* requests
 */

import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// JWT verification
import jwt from 'jsonwebtoken';

const authenticate = async (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('NO_TOKEN');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const result = await pool.query(
    `SELECT id, email, full_name, role, tenant_id 
     FROM users 
     WHERE id = $1 AND status = 'active'`,
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    throw new Error('USER_NOT_FOUND');
  }

  const user = result.rows[0];
  return {
    user,
    isSuperAdmin: user.role === 'admin' && !user.tenant_id
  };
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Parse body if it's a string (Vercel sometimes doesn't auto-parse)
    if (req.body && typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }

    // Authenticate user
    const { user, isSuperAdmin } = await authenticate(req);

    // Parse URL to get tenant ID and action
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const tenantId = pathParts[2]; // /api/tenants/:id

    // GET /api/tenants - List all tenants
    if (req.method === 'GET' && !tenantId) {
      if (!isSuperAdmin && !user.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      let sql = `
        SELECT 
          t.*,
          COUNT(DISTINCT u.id) as user_count,
          COUNT(DISTINCT l.id) as lead_count,
          COUNT(DISTINCT c.id) as customer_count
        FROM tenants t
        LEFT JOIN users u ON u.tenant_id = t.id
        LEFT JOIN leads l ON l.tenant_id = t.id
        LEFT JOIN customers c ON c.tenant_id = t.id
      `;

      const params = [];
      
      if (!isSuperAdmin && user.tenant_id) {
        sql += ' WHERE t.id = $1';
        params.push(user.tenant_id);
      }

      sql += ' GROUP BY t.id ORDER BY t.company_name';

      const result = await pool.query(sql, params);
      return res.status(200).json({ tenants: result.rows });
    }

    // GET /api/tenants/:id - Get specific tenant
    if (req.method === 'GET' && tenantId) {
      if (!isSuperAdmin && user.tenant_id !== tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await pool.query(`
        SELECT 
          t.*,
          COUNT(DISTINCT u.id) as user_count,
          COUNT(DISTINCT l.id) as lead_count,
          COUNT(DISTINCT c.id) as customer_count
        FROM tenants t
        LEFT JOIN users u ON u.tenant_id = t.id
        LEFT JOIN leads l ON l.tenant_id = t.id
        LEFT JOIN customers c ON c.tenant_id = t.id
        WHERE t.id = $1
        GROUP BY t.id
      `, [tenantId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      return res.status(200).json({ tenant: result.rows[0] });
    }

    // POST /api/tenants - Create new tenant
    if (req.method === 'POST') {
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Super admin access required' });
      }

      const {
        company_name,
        domain,
        subdomain,
        checkout_search_term,
        main_competitor,
        subscription_tier = 'basic',
        max_users = 10,
        max_leads_per_month = 1000,
        max_customers = 500,
        logo_url,
        primary_color = '#D40511',
        secondary_color = '#FFCC00'
      } = req.body;

      if (!company_name || !domain || !checkout_search_term) {
        return res.status(400).json({ 
          error: 'Missing required fields: company_name, domain, checkout_search_term' 
        });
      }

      const result = await pool.query(`
        INSERT INTO tenants (
          company_name,
          domain,
          subdomain,
          checkout_search_term,
          main_competitor,
          subscription_tier,
          max_users,
          max_leads_per_month,
          max_customers,
          logo_url,
          primary_color,
          secondary_color,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        company_name,
        domain,
        subdomain,
        checkout_search_term,
        main_competitor,
        subscription_tier,
        max_users,
        max_leads_per_month,
        max_customers,
        logo_url,
        primary_color,
        secondary_color,
        user.id
      ]);

      return res.status(201).json({ tenant: result.rows[0] });
    }

    // PUT /api/tenants/:id - Update tenant
    if (req.method === 'PUT' && tenantId) {
      if (!isSuperAdmin && user.tenant_id !== tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const allowedFields = isSuperAdmin 
        ? [
            'company_name', 'domain', 'subdomain', 'checkout_search_term', 'main_competitor',
            'subscription_tier', 'max_users', 'max_leads_per_month', 'max_customers',
            'logo_url', 'primary_color', 'secondary_color', 'is_active',
            'google_api_key_encrypted', 'gemini_api_key_encrypted', 'linkedin_api_key_encrypted'
          ]
        : [
            'company_name', 'subdomain', 'checkout_search_term', 'main_competitor',
            'logo_url', 'primary_color', 'secondary_color'
          ];

      const updates = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(req.body)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(tenantId);

      const result = await pool.query(`
        UPDATE tenants
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      return res.status(200).json({ tenant: result.rows[0] });
    }

    // DELETE /api/tenants/:id - Delete tenant
    if (req.method === 'DELETE' && tenantId) {
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Super admin access required' });
      }

      const tenantCheck = await pool.query(
        'SELECT company_name FROM tenants WHERE id = $1',
        [tenantId]
      );

      if (tenantCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);

      return res.status(200).json({ message: 'Tenant deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Tenant API Error:', error);

    if (error.message === 'NO_TOKEN') {
      return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN' });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }

    return res.status(500).json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}
