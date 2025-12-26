/**
 * Quota Management Routes
 * API endpoints for tracking and managing API quotas
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
const quotaService = require('../services/quotaTrackingService');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/quotas/stats
 * Get quota statistics for current tenant or global (SuperAdmin)
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.isSuperAdmin ? null : req.user.tenant_id;
  
  logger.info('Fetching quota stats', {
    userId: req.user.id,
    tenantId,
    isSuperAdmin: req.isSuperAdmin
  });
  
  const stats = await quotaService.getQuotaStats(tenantId);
  
  res.json({
    quotas: stats,
    tenant_id: tenantId,
    is_super_admin: req.isSuperAdmin
  });
}));

/**
 * GET /api/quotas/service/:service
 * Get detailed usage for a specific service
 */
router.get('/service/:service', asyncHandler(async (req, res) => {
  const { service } = req.params;
  const tenantId = req.isSuperAdmin ? null : req.user.tenant_id;
  
  const usage = quotaService.getUsage(service, tenantId);
  
  if (!usage) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  res.json({
    service,
    usage,
    tenant_id: tenantId,
    has_quota_available: quotaService.hasQuotaAvailable(service, tenantId)
  });
}));

/**
 * POST /api/quotas/track
 * Track API usage (called by services)
 */
router.post('/track', asyncHandler(async (req, res) => {
  const { service } = req.body;
  const tenantId = req.user.tenant_id;
  const userId = req.user.id;
  
  if (!service) {
    return res.status(400).json({ error: 'Service name required' });
  }
  
  await quotaService.trackUsage(service, tenantId, userId);
  
  logger.info('API usage tracked', {
    service,
    tenantId,
    userId
  });
  
  res.json({ 
    success: true,
    message: 'Usage tracked',
    remaining: quotaService.getUsage(service, tenantId)
  });
}));

/**
 * POST /api/quotas/reset
 * Reset quota for a service (SuperAdmin only)
 */
router.post('/reset', asyncHandler(async (req, res) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'SuperAdmin access required' });
  }
  
  const { service, tenant_id } = req.body;
  
  if (!service) {
    return res.status(400).json({ error: 'Service name required' });
  }
  
  quotaService.resetQuota(service, tenant_id);
  
  logger.info('Quota reset', {
    service,
    tenantId: tenant_id,
    resetBy: req.user.id
  });
  
  res.json({ 
    success: true,
    message: `Quota reset for ${service}`,
    service,
    tenant_id
  });
}));

/**
 * GET /api/quotas/limits
 * Get quota limits configuration
 */
router.get('/limits', asyncHandler(async (req, res) => {
  res.json({
    limits: quotaService.QUOTA_LIMITS
  });
}));

/**
 * GET /api/quotas/check/:service
 * Check if quota is available for a service
 */
router.get('/check/:service', asyncHandler(async (req, res) => {
  const { service } = req.params;
  const { period = 'hourly' } = req.query;
  const tenantId = req.isSuperAdmin ? null : req.user.tenant_id;
  
  const hasQuota = quotaService.hasQuotaAvailable(service, tenantId, period);
  const usage = quotaService.getUsage(service, tenantId);
  const timeUntilReset = quotaService.getTimeUntilReset(service, period);
  
  res.json({
    service,
    has_quota_available: hasQuota,
    usage,
    time_until_reset_ms: timeUntilReset,
    time_until_reset_formatted: formatTime(timeUntilReset)
  });
}));

/**
 * GET /api/quotas/all
 * Get all quotas for current tenant
 */
router.get('/all', asyncHandler(async (req, res) => {
  const tenantId = req.isSuperAdmin ? null : req.user.tenant_id;
  
  const allQuotas = quotaService.getAllQuotas(tenantId);
  
  res.json({
    quotas: allQuotas,
    tenant_id: tenantId
  });
}));

/**
 * Helper: Format milliseconds to human readable time
 */
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default router;
