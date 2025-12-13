import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Winston Logger Configuration
 * Enterprise-grade logging med rotation och olika nivåer
 */

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Transports
const transports = [
  // Console output (development)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    level: process.env.LOG_LEVEL || 'info'
  })
];

// File transports (production)
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }),
    // Security log (för audit)
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/security.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 10
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  format: customFormat,
  transports,
  exitOnError: false
});

// Stream för Morgan (HTTP logging)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

/**
 * Security Logger
 * Specifik logger för säkerhetshändelser
 */
export const securityLogger = {
  logFailedLogin: (email, ip, reason) => {
    logger.warn('Failed login attempt', {
      event: 'FAILED_LOGIN',
      email,
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  logSuccessfulLogin: (userId, email, ip, method = 'password') => {
    logger.info('Successful login', {
      event: 'SUCCESSFUL_LOGIN',
      userId,
      email,
      ip,
      method,
      timestamp: new Date().toISOString()
    });
  },

  logUnauthorizedAccess: (userId, resource, ip) => {
    logger.warn('Unauthorized access attempt', {
      event: 'UNAUTHORIZED_ACCESS',
      userId,
      resource,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  logDataAccess: (userId, dataType, action, recordId = null) => {
    logger.info('Data access', {
      event: 'DATA_ACCESS',
      userId,
      dataType,
      action,
      recordId,
      timestamp: new Date().toISOString()
    });
  },

  logSuspiciousActivity: (userId, activity, details) => {
    logger.warn('Suspicious activity detected', {
      event: 'SUSPICIOUS_ACTIVITY',
      userId,
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Performance Logger
 * Loggar prestanda-metrics
 */
export const performanceLogger = {
  logAPICall: (endpoint, duration, statusCode, userId = null) => {
    logger.info('API call', {
      event: 'API_CALL',
      endpoint,
      duration,
      statusCode,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  logDatabaseQuery: (query, duration, rows = null) => {
    if (duration > 1000) { // Logga långsamma queries
      logger.warn('Slow database query', {
        event: 'SLOW_QUERY',
        query: query.substring(0, 100), // Begränsa längd
        duration,
        rows,
        timestamp: new Date().toISOString()
      });
    }
  },

  logLLMCall: (provider, model, tokens, cost, duration) => {
    logger.info('LLM API call', {
      event: 'LLM_CALL',
      provider,
      model,
      tokens,
      cost,
      duration,
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;
