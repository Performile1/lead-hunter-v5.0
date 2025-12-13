import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * JWT Authentication Middleware
 * Verifierar JWT token och lägger till user-objekt i request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Hämta token från Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Ingen token tillhandahållen',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Ta bort "Bearer "

    // Verifiera token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hämta användare från databas
    const result = await query(
      `SELECT id, email, full_name, role, status, last_login, tenant_id 
       FROM users 
       WHERE id = $1 AND status = 'active'`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Användare hittades inte eller är inaktiv',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Hämta användarens regioner
    const regionsResult = await query(
      'SELECT region_name FROM user_regions WHERE user_id = $1',
      [user.id]
    );
    user.regions = regionsResult.rows.map(r => r.region_name);

    // Lägg till user i request
    req.user = user;
    req.userId = user.id;
    req.isSuperAdmin = user.role === 'admin' && !user.tenant_id;

    // Logga åtkomst
    logger.info('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
      path: req.path
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Ogiltig token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token har gått ut',
        code: 'TOKEN_EXPIRED'
      });
    }

    logger.error('Authentication error', { error: error.message });
    res.status(500).json({ 
      error: 'Autentiseringsfel',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Require Authentication Middleware
 * Alias för authenticate - används för att kräva autentisering
 */
export const requireAuth = authenticate;

/**
 * Role-based Access Control Middleware
 * Kontrollerar att användaren har rätt roll
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Inte autentiserad',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Access denied', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });

      return res.status(403).json({ 
        error: 'Åtkomst nekad - otillräckliga behörigheter',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Authorize Middleware
 * Alias för requireRole - används för att kräva specifik roll
 */
export const authorize = requireRole;

/**
 * Region Access Control Middleware
 * Kontrollerar att användaren har åtkomst till det begärda området
 * UPPDATERAD: Alla användare har nu åtkomst till alla områden
 * Filtrering sker istället i frontend/queries baserat på användarens tilldelade regioner
 */
export const requireRegionAccess = (regionParam = 'geoArea') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Inte autentiserad',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // ALLA användare har nu åtkomst - ingen region-begränsning
    // Detta tillåter alla att söka, skapa och analysera leads överallt
    next();
  };
};

/**
 * API Key Authentication (för programmatisk åtkomst)
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API-nyckel saknas',
        code: 'NO_API_KEY'
      });
    }

    // Hämta och verifiera API-nyckel
    const result = await query(
      `SELECT uak.user_id, u.email, u.full_name, u.role, u.status
       FROM user_api_keys uak
       JOIN users u ON u.id = uak.user_id
       WHERE uak.key_hash = $1 
       AND u.status = 'active'
       AND (uak.expires_at IS NULL OR uak.expires_at > NOW())`,
      [apiKey] // I produktion: använd bcrypt hash
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Ogiltig eller utgången API-nyckel',
        code: 'INVALID_API_KEY'
      });
    }

    const user = result.rows[0];

    // Uppdatera last_used
    await query(
      'UPDATE user_api_keys SET last_used = NOW() WHERE key_hash = $1',
      [apiKey]
    );

    req.user = user;
    req.userId = user.user_id;

    next();
  } catch (error) {
    logger.error('API Key authentication error', { error: error.message });
    res.status(500).json({ 
      error: 'Autentiseringsfel',
      code: 'AUTH_ERROR'
    });
  }
};
