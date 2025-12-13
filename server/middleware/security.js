import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';

/**
 * Security Middleware Collection
 * Enterprise-grade säkerhetsfunktioner
 */

/**
 * Request Sanitization
 * Rengör inkommande data från potentiella hot
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Ta bort potentiellt farliga tecken
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * SQL Injection Protection
 * Extra validering för databas-queries
 */
export const validateDatabaseInput = (req, res, next) => {
  const checkForSQLInjection = (value) => {
    if (typeof value !== 'string') return false;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|;|\/\*|\*\/|xp_|sp_)/i,
      /(\bOR\b.*=.*|1=1|'=')/i
    ];

    return sqlPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (checkForSQLInjection(obj[key])) {
        logger.warn('Potential SQL injection detected', {
          userId: req.user?.id,
          ip: req.ip,
          path: req.path,
          suspicious: obj[key]
        });
        return true;
      }
      if (typeof obj[key] === 'object') {
        if (checkObject(obj[key])) return true;
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      error: 'Ogiltig input detekterad',
      code: 'INVALID_INPUT'
    });
  }

  next();
};

/**
 * Rate Limiting per användare
 * Förhindrar API-missbruk
 */
const userRequestCounts = new Map();

export const userRateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!userRequestCounts.has(userId)) {
      userRequestCounts.set(userId, []);
    }

    const requests = userRequestCounts.get(userId);
    
    // Ta bort gamla requests utanför tidsfönstret
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        userId,
        requests: recentRequests.length,
        path: req.path
      });

      return res.status(429).json({
        error: 'För många requests. Försök igen senare.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    recentRequests.push(now);
    userRequestCounts.set(userId, recentRequests);

    next();
  };
};

/**
 * Audit Logging
 * Loggar alla viktiga aktiviteter
 */
export const auditLog = (actionType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Logga aktivitet efter lyckad operation
      if (res.statusCode < 400) {
        const logData = {
          user_id: req.user?.id,
          action_type: actionType,
          entity_type: req.params.id ? 'entity' : null,
          entity_id: req.params.id || null,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeForLog(req.body)
          }),
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        };

        query(
          `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [logData.user_id, logData.action_type, logData.entity_type, 
           logData.entity_id, logData.details, logData.ip_address, logData.user_agent]
        ).catch(err => {
          logger.error('Failed to write audit log', { error: err.message });
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Sanitera känslig data för logging
 */
const sanitizeForLog = (obj) => {
  if (!obj) return obj;
  
  const sensitive = ['password', 'token', 'api_key', 'secret', 'apiKey'];
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * CSRF Protection
 * Genererar och validerar CSRF tokens
 */
export const csrfProtection = () => {
  const tokens = new Map();

  return {
    generateToken: (req, res, next) => {
      const token = crypto.randomBytes(32).toString('hex');
      const userId = req.user?.id || req.ip;
      
      tokens.set(userId, {
        token,
        expires: Date.now() + 3600000 // 1 timme
      });

      res.locals.csrfToken = token;
      next();
    },

    validateToken: (req, res, next) => {
      const userId = req.user?.id || req.ip;
      const providedToken = req.headers['x-csrf-token'] || req.body._csrf;

      const stored = tokens.get(userId);

      if (!stored || stored.expires < Date.now()) {
        return res.status(403).json({
          error: 'CSRF token saknas eller har gått ut',
          code: 'CSRF_INVALID'
        });
      }

      if (stored.token !== providedToken) {
        logger.warn('CSRF token mismatch', {
          userId,
          ip: req.ip
        });

        return res.status(403).json({
          error: 'Ogiltig CSRF token',
          code: 'CSRF_INVALID'
        });
      }

      next();
    }
  };
};

/**
 * Data Encryption Helper
 * Krypterar känslig data innan lagring
 */
export const encryptData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

/**
 * Data Decryption Helper
 */
export const decryptData = (encryptedData, iv, authTag) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  
  const decipher = crypto.createDecipheriv(
    algorithm, 
    key, 
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Secure Headers
 * Sätter säkerhets-headers
 */
export const secureHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * IP Whitelist (för produktion)
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;

    if (!allowedIPs.includes(clientIP)) {
      logger.warn('Unauthorized IP access attempt', {
        ip: clientIP,
        path: req.path
      });

      return res.status(403).json({
        error: 'Åtkomst nekad från denna IP-adress',
        code: 'IP_NOT_ALLOWED'
      });
    }

    next();
  };
};
