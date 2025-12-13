import express from 'express';
import bcrypt from 'bcrypt';
import { body, param, validationResult } from 'express-validator';
import { query, transaction } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog } from '../middleware/security.js';

const router = express.Router();

// Alla routes kräver autentisering
router.use(authenticate);

/**
 * GET /api/users
 * Lista alla användare (Admin/Manager)
 */
router.get('/',
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { role, status, search } = req.query;
    
    let sql = `
      SELECT u.id, u.email, u.full_name, u.role, u.status, u.created_at, u.last_login,
             u.terminal_name, u.terminal_code,
             COALESCE(json_agg(DISTINCT ur.region_name) FILTER (WHERE ur.region_name IS NOT NULL), '[]') as regions,
             COALESCE(json_agg(DISTINCT ur.postal_codes) FILTER (WHERE ur.postal_codes IS NOT NULL), '[]') as postal_codes
      FROM users u
      LEFT JOIN user_regions ur ON ur.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (role) {
      sql += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND u.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      sql += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` GROUP BY u.id ORDER BY u.created_at DESC`;
    
    const result = await query(sql, params);
    
    res.json({
      users: result.rows,
      total: result.rows.length
    });
  })
);

/**
 * GET /api/users/:id
 * Hämta specifik användare
 */
router.get('/:id',
  param('id').isUUID(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Users kan se sin egen profil, admin/manager kan se alla
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Åtkomst nekad' });
    }
    
    const result = await query(
      `SELECT u.*, 
              COALESCE(json_agg(DISTINCT ur.region_name) FILTER (WHERE ur.region_name IS NOT NULL), '[]') as regions,
              COALESCE(json_agg(DISTINCT ur.postal_codes) FILTER (WHERE ur.postal_codes IS NOT NULL), '[]') as postal_codes
       FROM users u
       LEFT JOIN user_regions ur ON ur.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Användare hittades inte' });
    }
    
    const user = result.rows[0];
    delete user.password_hash; // Ta bort lösenord från response
    
    res.json(user);
  })
);

/**
 * POST /api/users
 * Skapa ny användare (Admin)
 */
router.post('/',
  requireRole('admin'),
  sanitizeInput,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').isLength({ min: 2 }),
    body('role').isIn(['admin', 'manager', 'terminal_manager', 'fs', 'ts', 'kam', 'dm']),
    body('regions').optional().isArray(),
    body('postal_codes').optional().isArray(),
    body('terminal_name').optional().isString(),
    body('terminal_code').optional().isString()
  ],
  auditLog('create_user'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, full_name, role, regions = [], postal_codes = [], terminal_name, terminal_code } = req.body;
    
    // Kolla om email redan finns
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email redan registrerad' });
    }
    
    // Hasha lösenord
    const password_hash = await bcrypt.hash(password, 10);
    
    // Skapa användare i transaction
    const user = await transaction(async (client) => {
      // Skapa användare
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, status, terminal_name, terminal_code)
         VALUES ($1, $2, $3, $4, 'active', $5, $6)
         RETURNING id, email, full_name, role, status, terminal_name, terminal_code`,
        [email, password_hash, full_name, role, terminal_name, terminal_code]
      );
      
      const newUser = userResult.rows[0];
      
      // Lägg till regioner
      if (regions.length > 0 || postal_codes.length > 0) {
        for (const region of regions) {
          await client.query(
            'INSERT INTO user_regions (user_id, region_name, region_type) VALUES ($1, $2, $3)',
            [newUser.id, region, 'geographic']
          );
        }
        
        if (postal_codes.length > 0) {
          await client.query(
            'INSERT INTO user_regions (user_id, region_name, postal_codes, region_type) VALUES ($1, $2, $3, $4)',
            [newUser.id, 'Postnummer', postal_codes, 'postal_code']
          );
        }
      }
      
      return newUser;
    });
    
    res.status(201).json({
      message: 'Användare skapad',
      user: {
        ...user,
        regions,
        postal_codes
      }
    });
  })
);

/**
 * PUT /api/users/:id
 * Uppdatera användare
 */
router.put('/:id',
  param('id').isUUID(),
  sanitizeInput,
  auditLog('update_user'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Users kan uppdatera sin egen profil, admin kan uppdatera alla
    if (req.user.role !== 'admin' && req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Åtkomst nekad' });
    }
    
    const { full_name, phone, avatar_url, regions, postal_codes, status, role, terminal_name, terminal_code } = req.body;
    
    await transaction(async (client) => {
      // Uppdatera grundläggande info
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (full_name) {
        updates.push(`full_name = $${paramIndex}`);
        values.push(full_name);
        paramIndex++;
      }
      
      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex}`);
        values.push(phone);
        paramIndex++;
      }
      
      if (avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramIndex}`);
        values.push(avatar_url);
        paramIndex++;
      }
      
      if (terminal_name !== undefined && req.user.role === 'admin') {
        updates.push(`terminal_name = $${paramIndex}`);
        values.push(terminal_name);
        paramIndex++;
      }
      
      if (terminal_code !== undefined && req.user.role === 'admin') {
        updates.push(`terminal_code = $${paramIndex}`);
        values.push(terminal_code);
        paramIndex++;
      }
      
      // Endast admin kan ändra status och roll
      if (req.user.role === 'admin') {
        if (status) {
          updates.push(`status = $${paramIndex}`);
          values.push(status);
          paramIndex++;
        }
        
        if (role) {
          updates.push(`role = $${paramIndex}`);
          values.push(role);
          paramIndex++;
        }
      }
      
      if (updates.length > 0) {
        values.push(req.params.id);
        await client.query(
          `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
          values
        );
      }
      
      // Uppdatera regioner (endast admin)
      if (req.user.role === 'admin' && (regions || postal_codes)) {
        await client.query('DELETE FROM user_regions WHERE user_id = $1', [req.params.id]);
        
        if (regions && regions.length > 0) {
          for (const region of regions) {
            await client.query(
              'INSERT INTO user_regions (user_id, region_name, region_type) VALUES ($1, $2, $3)',
              [req.params.id, region, 'geographic']
            );
          }
        }
        
        if (postal_codes && postal_codes.length > 0) {
          await client.query(
            'INSERT INTO user_regions (user_id, region_name, postal_codes, region_type) VALUES ($1, $2, $3, $4)',
            [req.params.id, 'Postnummer', postal_codes, 'postal_code']
          );
        }
      }
    });
    
    res.json({ message: 'Användare uppdaterad' });
  })
);

/**
 * DELETE /api/users/:id
 * Radera användare (Admin)
 */
router.delete('/:id',
  requireRole('admin'),
  param('id').isUUID(),
  auditLog('delete_user'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Förhindra att radera sig själv
    if (req.userId === req.params.id) {
      return res.status(400).json({ error: 'Du kan inte radera ditt eget konto' });
    }
    
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Användare raderad' });
  })
);

/**
 * PUT /api/users/:id/password
 * Ändra lösenord
 */
router.put('/:id/password',
  param('id').isUUID(),
  [
    body('current_password').isString(),
    body('new_password').isLength({ min: 8 })
  ],
  auditLog('change_password'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Users kan bara ändra sitt eget lösenord
    if (req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Åtkomst nekad' });
    }
    
    const { current_password, new_password } = req.body;
    
    // Verifiera nuvarande lösenord
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Användare hittades inte' });
    }
    
    const validPassword = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Felaktigt nuvarande lösenord' });
    }
    
    // Uppdatera lösenord
    const new_hash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [new_hash, req.params.id]);
    
    res.json({ message: 'Lösenord uppdaterat' });
  })
);

export default router;
