import express from 'express';
import { query, transaction } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Alla routes kräver autentisering
router.use(authenticate);

/**
 * GET /api/notifications
 * Hämta notifikationer för inloggad användare
 */
router.get('/',
  asyncHandler(async (req, res) => {
    try {
      const { unread_only } = req.query;
      
      let sql = `
        SELECT 
          n.id,
          n.type,
          n.title,
          n.message,
          n.link,
          n.read,
          n.created_at,
          u.full_name as created_by_name
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE n.user_id = $1
      `;
      
      if (unread_only === 'true') {
        sql += ' AND n.read = false';
      }
      
      sql += ' ORDER BY n.created_at DESC LIMIT 50';
      
      const result = await query(sql, [req.userId]);
      
      res.json({
        notifications: result.rows,
        unread_count: result.rows.filter(n => !n.read).length
      });
    } catch (error) {
      // Returnera tom lista om tabellen inte finns eller annat fel
      console.error('Notifications error:', error.message);
      res.json({
        notifications: [],
        unread_count: 0
      });
    }
  })
);

/**
 * POST /api/notifications/:id/read
 * Markera notifikation som läst
 */
router.post('/:id/read',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE notifications 
       SET read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ notification: result.rows[0] });
  })
);

/**
 * POST /api/notifications/read-all
 * Markera alla notifikationer som lästa
 */
router.post('/read-all',
  asyncHandler(async (req, res) => {
    const result = await query(
      `UPDATE notifications 
       SET read = true, read_at = NOW()
       WHERE user_id = $1 AND read = false
       RETURNING id`,
      [req.userId]
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      count: result.rows.length
    });
  })
);

/**
 * POST /api/notifications
 * Skapa ny notifikation (intern användning eller admin)
 */
router.post('/',
  asyncHandler(async (req, res) => {
    const { user_id, type, title, message, link } = req.body;
    
    // Validering
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, type, title, message' 
      });
    }
    
    const validTypes = ['lead_assigned', 'cronjob_complete', 'customer_update', 'message', 'warning', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, link, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, type, title, message, link, req.userId]
    );
    
    logger.info('Notification created', {
      notificationId: result.rows[0].id,
      userId: user_id,
      type,
      createdBy: req.userId
    });
    
    res.status(201).json({ notification: result.rows[0] });
  })
);

/**
 * DELETE /api/notifications/:id
 * Radera notifikation
 */
router.delete('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  })
);

/**
 * GET /api/notifications/unread-count
 * Hämta antal olästa notifikationer
 */
router.get('/unread-count',
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [req.userId]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  })
);

export default router;
