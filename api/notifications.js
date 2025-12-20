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

    if (req.method === 'GET') {
      // Fetch notifications for user
      const result = await query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [userId]
      );

      return res.status(200).json(result.rows || []);
    }

    if (req.method === 'POST') {
      const { id } = req.query;
      
      if (id && req.url.includes('/read')) {
        // Mark notification as read
        await query(
          `UPDATE notifications 
           SET read = true, read_at = NOW() 
           WHERE id = $1 AND user_id = $2`,
          [id, userId]
        );

        return res.status(200).json({ success: true });
      }

      // Create new notification
      const result = await query(
        `INSERT INTO notifications (user_id, title, message, type, created_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING *`,
        [userId, req.body.title, req.body.message, req.body.type || 'info']
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
