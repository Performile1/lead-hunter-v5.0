const jwt = require('jsonwebtoken');
const { query } = require('../_lib/database');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    const isSuperAdmin = decoded.isSuperAdmin;

    // Build WHERE clause based on user role
    let whereClause = '';
    const params = [];
    
    if (!isSuperAdmin && tenantId) {
      whereClause = 'WHERE tenant_id = $1';
      params.push(tenantId);
    }

    // Fetch analytics data
    const leadsResult = await query(
      `SELECT COUNT(*) as count FROM leads ${whereClause}`,
      params
    );

    const customersResult = await query(
      `SELECT COUNT(*) as count FROM customers ${whereClause}`,
      params
    );

    const usersResult = await query(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    );

    const recentLeadsResult = await query(
      `SELECT * FROM leads ${whereClause} ORDER BY created_at DESC LIMIT 5`,
      params
    );

    return res.status(200).json({
      total_leads: parseInt(leadsResult.rows[0]?.count || 0),
      total_customers: parseInt(customersResult.rows[0]?.count || 0),
      total_users: parseInt(usersResult.rows[0]?.count || 0),
      recent_leads: recentLeadsResult.rows || []
    });
  } catch (error) {
    console.error('Analytics overview API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
