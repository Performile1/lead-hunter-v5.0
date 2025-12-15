import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../_lib/database.js';

/**
 * POST /api/auth/login
 * Multi-tenant login med email och lösenord
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, tenantId } = req.body;

    // Validering
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email och lösenord krävs',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Hämta användare med tenant info
    let userQuery = `
      SELECT u.*, t.company_name as tenant_name, t.domain as tenant_domain, 
             t.subdomain, t.primary_color, t.secondary_color, t.logo_url
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = $1
    `;
    
    const params = [email];
    
    // Om tenantId är specificerat, filtrera på det
    if (tenantId) {
      userQuery += ` AND (u.tenant_id = $2 OR u.is_super_admin = true)`;
      params.push(tenantId);
    }

    const result = await query(userQuery, params);

    if (result.rows.length === 0) {
      console.log('Login failed: User not found', { email });
      return res.status(401).json({
        error: 'Ogiltiga inloggningsuppgifter',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Kontrollera status
    if (user.status !== 'active') {
      console.log('Login failed: Account inactive', { email, status: user.status });
      return res.status(403).json({
        error: 'Kontot är inte aktivt',
        code: 'ACCOUNT_INACTIVE',
        status: user.status
      });
    }

    // Kontrollera lösenord
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log('Login failed: Invalid password', { email });
      return res.status(401).json({
        error: 'Ogiltiga inloggningsuppgifter',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Uppdatera last_login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Hämta regioner
    const regionsResult = await query(
      'SELECT region_name FROM user_regions WHERE user_id = $1',
      [user.id]
    );
    const regions = regionsResult.rows.map(r => r.region_name);

    // Generera JWT med tenant info
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        isSuperAdmin: user.is_super_admin || false
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Logga aktivitet
    try {
      await query(
        `INSERT INTO activity_log (user_id, action_type, details, ip_address)
         VALUES ($1, 'login', $2, $3)`,
        [
          user.id,
          JSON.stringify({ method: 'password', tenantId: user.tenant_id }),
          req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown'
        ]
      );
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    console.log('Login successful', { userId: user.id, email: user.email, tenantId: user.tenant_id });

    // Returnera användardata och token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        regions,
        terminalName: user.terminal_name,
        terminalCode: user.terminal_code,
        avatarUrl: user.avatar_url,
        isSuperAdmin: user.is_super_admin || false,
        tenant: user.tenant_id ? {
          id: user.tenant_id,
          name: user.tenant_name,
          domain: user.tenant_domain,
          subdomain: user.subdomain,
          primaryColor: user.primary_color,
          secondaryColor: user.secondary_color,
          logoUrl: user.logo_url
        } : null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Ett fel uppstod vid inloggning',
      code: 'SERVER_ERROR'
    });
  }
}
