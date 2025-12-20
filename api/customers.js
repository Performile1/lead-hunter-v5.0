const jwt = require('jsonwebtoken');
const { query } = require('./_lib/database');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;
    const tenantId = decoded.tenantId;

    if (req.method === 'GET') {
      const { status, assigned_to } = req.query;
      
      let sql = 'SELECT * FROM customers WHERE 1=1';
      const params = [];
      let paramCount = 1;

      // Filter by tenant
      if (tenantId) {
        sql += ` AND tenant_id = $${paramCount}`;
        params.push(tenantId);
        paramCount++;
      }

      // Filter by status
      if (status) {
        sql += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      // Filter by assignment
      if (assigned_to === 'me') {
        sql += ` AND assigned_to = $${paramCount}`;
        params.push(userId);
        paramCount++;
      }

      sql += ' ORDER BY created_at DESC';

      const result = await query(sql, params);
      return res.status(200).json(result.rows || []);
    }

    if (req.method === 'POST') {
      // Create new customer
      const { company_name, org_number, segment, status } = req.body;
      
      const result = await query(
        `INSERT INTO customers (company_name, org_number, segment, status, tenant_id, created_by, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
         RETURNING *`,
        [company_name, org_number, segment, status || 'active', tenantId, userId]
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Customers API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
