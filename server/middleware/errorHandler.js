import { logger } from '../utils/logger.js';

/**
 * Global Error Handler
 * Centraliserad felhantering för hela API:et
 */
export const errorHandler = (err, req, res, next) => {
  // Logga felet
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip
  });

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Resursen finns redan',
        code: 'DUPLICATE_ENTRY',
        details: process.env.NODE_ENV === 'development' ? err.detail : undefined
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'Ogiltig referens',
        code: 'FOREIGN_KEY_VIOLATION',
        details: process.env.NODE_ENV === 'development' ? err.detail : undefined
      });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Valideringsfel',
      code: 'VALIDATION_ERROR',
      details: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Ogiltig token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token har gått ut',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'För många requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter
    });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Ett oväntat fel uppstod';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  });
};

/**
 * 404 Handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route hittades inte',
    code: 'NOT_FOUND',
    path: req.path
  });
};

/**
 * Async Error Wrapper
 * Wrapper för async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
