import { pool } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const auditLog = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to capture response
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Log to database
      logAuditEntry({
        userId: req.user?.id || null,
        action,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestBody: req.body,
        responseBody: data
      }).catch(err => {
        logger.error('Failed to log audit entry:', err);
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

async function logAuditEntry(entry) {
  try {
    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, action, method, path, status_code, duration_ms, ip_address, user_agent, request_body, response_body, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        entry.userId,
        entry.action,
        entry.method,
        entry.path,
        entry.statusCode,
        entry.duration,
        entry.ipAddress,
        entry.userAgent,
        JSON.stringify(entry.requestBody),
        JSON.stringify(entry.responseBody)
      ]
    );
  } catch (error) {
    // Silently fail if audit_logs table doesn't exist
    if (error.code !== '42P01') { // Table doesn't exist error
      throw error;
    }
  }
}
