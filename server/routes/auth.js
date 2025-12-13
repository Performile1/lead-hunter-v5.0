import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../config/database.js';
import { logger, securityLogger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput } from '../middleware/security.js';
import { initiateSSOLogin, handleSSOCallback, isSSOConfigured } from '../middleware/sso.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Standard login med email och lösenord
 */
router.post('/login',
  sanitizeInput,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Hämta användare med tenant info
    const result = await query(
      `SELECT u.*, t.company_name as tenant_name, t.domain as tenant_domain, 
              t.subdomain, t.primary_color, t.secondary_color, t.logo_url
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      securityLogger.logFailedLogin(email, req.ip, 'User not found');
      return res.status(401).json({
        error: 'Ogiltiga inloggningsuppgifter',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Kontrollera status
    if (user.status !== 'active') {
      securityLogger.logFailedLogin(email, req.ip, `Status: ${user.status}`);
      return res.status(403).json({
        error: 'Kontot är inte aktivt',
        code: 'ACCOUNT_INACTIVE',
        status: user.status
      });
    }

    // Kontrollera lösenord
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      securityLogger.logFailedLogin(email, req.ip, 'Invalid password');
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
    await query(
      `INSERT INTO activity_log (user_id, action_type, details, ip_address)
       VALUES ($1, 'login', $2, $3)`,
      [user.id, JSON.stringify({ method: 'password' }), req.ip]
    );

    securityLogger.logSuccessfulLogin(user.id, email, req.ip, 'password');

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        tenant_domain: user.tenant_domain,
        subdomain: user.subdomain,
        terminal_name: user.terminal_name,
        terminal_code: user.terminal_code,
        regions,
        avatar_url: user.avatar_url,
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
  })
);

/**
 * POST /api/auth/register
 * Registrera ny användare (endast admin)
 */
router.post('/register',
  sanitizeInput,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').isLength({ min: 2 }),
    body('role').isIn(['admin', 'manager', 'fs', 'ts', 'kam', 'dm']),
    body('regions').optional().isArray()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name, role, regions = [] } = req.body;

    // Kolla om email redan finns
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Email redan registrerad',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hasha lösenord
    const password_hash = await bcrypt.hash(password, 10);

    // Skapa användare i transaction
    const user = await transaction(async (client) => {
      // Skapa användare
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id, email, full_name, role`,
        [email, password_hash, full_name, role]
      );

      const newUser = userResult.rows[0];

      // Lägg till regioner
      if (regions.length > 0) {
        for (const region of regions) {
          await client.query(
            'INSERT INTO user_regions (user_id, region_name) VALUES ($1, $2)',
            [newUser.id, region]
          );
        }
      }

      return newUser;
    });

    logger.info('New user registered', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      message: 'Användare skapad',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        regions
      }
    });
  })
);

/**
 * POST /api/auth/logout
 * Logga ut (invalidera token på klientsidan)
 */
router.post('/logout',
  asyncHandler(async (req, res) => {
    // I en mer avancerad implementation skulle vi kunna
    // lägga till token i en blacklist här

    res.json({ message: 'Utloggad' });
  })
);

/**
 * GET /api/auth/sso
 * Initiera SSO-login med Azure AD
 */
router.get('/sso', (req, res, next) => {
  if (!isSSOConfigured()) {
    return res.status(503).json({
      error: 'SSO är inte konfigurerat',
      code: 'SSO_NOT_CONFIGURED'
    });
  }

  initiateSSOLogin(req, res, next);
});

/**
 * GET /api/auth/sso/callback
 * Callback från Azure AD
 */
router.get('/sso/callback', handleSSOCallback);

/**
 * GET /api/auth/sso/status
 * Kontrollera om SSO är tillgängligt
 */
router.get('/sso/status', (req, res) => {
  res.json({
    available: isSSOConfigured(),
    provider: 'Azure AD'
  });
});

/**
 * POST /api/auth/refresh
 * Förnya JWT token
 */
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token saknas',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        ignoreExpiration: true
      });

      // Kontrollera att användaren fortfarande är aktiv
      const result = await query(
        'SELECT id, email, role, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0 || result.rows[0].status !== 'active') {
        return res.status(401).json({
          error: 'Användare inte aktiv',
          code: 'USER_INACTIVE'
        });
      }

      // Generera ny token
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({
        error: 'Ogiltig token',
        code: 'INVALID_TOKEN'
      });
    }
  })
);

export default router;
