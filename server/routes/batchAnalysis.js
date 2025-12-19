/**
 * Batch Analysis Routes
 * API endpoints for batch technical analysis jobs
 */

import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { processBatchJob, getBatchJobStatus, cancelBatchJob } from '../services/batchAnalysisService.js';
import { triggerScheduledJob, getSchedulerStatus } from '../services/batchSchedulerService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/batch-analysis/jobs
 * Create a new batch analysis job
 */
router.post('/jobs',
  asyncHandler(async (req, res) => {
    const {
      job_name,
      job_type,
      lead_ids,
      filter_criteria,
      analysis_config,
      is_scheduled,
      schedule_cron
    } = req.body;
    
    // Validation
    if (!job_name || !job_type || !lead_ids || lead_ids.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: job_name, job_type, lead_ids'
      });
    }
    
    const validJobTypes = ['tech_analysis', 'checkout_scraping', 'full_analysis', 'ecommerce_detection', 'carrier_detection'];
    if (!validJobTypes.includes(job_type)) {
      return res.status(400).json({
        error: `Invalid job_type. Must be one of: ${validJobTypes.join(', ')}`
      });
    }
    
    // Create batch job
    const result = await query(`
      SELECT create_batch_analysis_job($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      req.tenantId,
      req.userId,
      job_name,
      job_type,
      lead_ids,
      analysis_config ? JSON.stringify(analysis_config) : null,
      is_scheduled || false,
      schedule_cron || null
    ]);
    
    const jobId = result.rows[0].create_batch_analysis_job;
    
    logger.info('Batch analysis job created', {
      jobId,
      jobType: job_type,
      leadCount: lead_ids.length,
      userId: req.userId,
      tenantId: req.tenantId
    });
    
    // If not scheduled, start processing immediately
    if (!is_scheduled) {
      processBatchJob(jobId).catch(error => {
        logger.error(`Error processing batch job ${jobId}:`, error);
      });
    }
    
    res.status(201).json({
      job_id: jobId,
      message: is_scheduled ? 'Scheduled job created' : 'Batch job started',
      status: is_scheduled ? 'scheduled' : 'running'
    });
  })
);

/**
 * GET /api/batch-analysis/jobs
 * List batch analysis jobs for tenant
 */
router.get('/jobs',
  asyncHandler(async (req, res) => {
    const { status, is_scheduled, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        bj.id,
        bj.job_name,
        bj.job_type,
        bj.status,
        bj.progress,
        bj.total_leads,
        bj.successful_count,
        bj.failed_count,
        bj.skipped_count,
        bj.is_scheduled,
        bj.schedule_cron,
        bj.next_run_at,
        bj.last_run_at,
        bj.created_at,
        bj.started_at,
        bj.completed_at,
        u.full_name as created_by_name
      FROM batch_analysis_jobs bj
      LEFT JOIN users u ON bj.created_by = u.id
      WHERE bj.tenant_id = $1
    `;
    
    const params = [req.tenantId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND bj.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (is_scheduled !== undefined) {
      sql += ` AND bj.is_scheduled = $${paramIndex}`;
      params.push(is_scheduled === 'true');
      paramIndex++;
    }
    
    sql += ` ORDER BY bj.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM batch_analysis_jobs
      WHERE tenant_id = $1
    `, [req.tenantId]);
    
    res.json({
      jobs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  })
);

/**
 * GET /api/batch-analysis/jobs/:id
 * Get batch job details and status
 */
router.get('/jobs/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const job = await getBatchJobStatus(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' });
    }
    
    // Check tenant access
    if (job.tenant_id !== req.tenantId && !req.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ job });
  })
);

/**
 * POST /api/batch-analysis/jobs/:id/cancel
 * Cancel a running or pending batch job
 */
router.post('/jobs/:id/cancel',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check ownership
    const checkResult = await query(`
      SELECT tenant_id FROM batch_analysis_jobs WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch job not found' });
    }
    
    if (checkResult.rows[0].tenant_id !== req.tenantId && !req.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await cancelBatchJob(id);
    
    logger.info('Batch job cancelled', {
      jobId: id,
      userId: req.userId
    });
    
    res.json({ message: 'Batch job cancelled' });
  })
);

/**
 * POST /api/batch-analysis/jobs/:id/trigger
 * Manually trigger a scheduled job
 */
router.post('/jobs/:id/trigger',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check ownership
    const checkResult = await query(`
      SELECT tenant_id, is_scheduled FROM batch_analysis_jobs WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch job not found' });
    }
    
    if (!checkResult.rows[0].is_scheduled) {
      return res.status(400).json({ error: 'Job is not scheduled' });
    }
    
    if (checkResult.rows[0].tenant_id !== req.tenantId && !req.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const newJobId = await triggerScheduledJob(id);
    
    logger.info('Scheduled job triggered manually', {
      scheduledJobId: id,
      newJobId,
      userId: req.userId
    });
    
    res.json({
      message: 'Scheduled job triggered',
      new_job_id: newJobId
    });
  })
);

/**
 * GET /api/batch-analysis/scheduler/status
 * Get scheduler status (admin only)
 */
router.get('/scheduler/status',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const status = getSchedulerStatus();
    
    // Get upcoming scheduled jobs
    const upcomingResult = await query(`
      SELECT 
        id,
        job_name,
        job_type,
        next_run_at,
        last_run_at,
        schedule_cron
      FROM batch_analysis_jobs
      WHERE is_scheduled = TRUE
        AND status NOT IN ('cancelled')
        AND (tenant_id = $1 OR $2 = TRUE)
      ORDER BY next_run_at ASC
      LIMIT 10
    `, [req.tenantId, req.isSuperAdmin]);
    
    res.json({
      scheduler: status,
      upcoming_jobs: upcomingResult.rows
    });
  })
);

/**
 * POST /api/batch-analysis/quick-analyze
 * Quick batch analysis for selected leads
 */
router.post('/quick-analyze',
  asyncHandler(async (req, res) => {
    const { lead_ids, analysis_type = 'tech_analysis' } = req.body;
    
    if (!lead_ids || lead_ids.length === 0) {
      return res.status(400).json({ error: 'No leads selected' });
    }
    
    if (lead_ids.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 leads per batch' });
    }
    
    // Create batch job
    const result = await query(`
      SELECT create_batch_analysis_job($1, $2, $3, $4, $5, $6, FALSE, NULL)
    `, [
      req.tenantId,
      req.userId,
      `Quick Analysis - ${new Date().toISOString()}`,
      analysis_type,
      lead_ids,
      JSON.stringify({ timeout: 20000, use_firecrawl: true })
    ]);
    
    const jobId = result.rows[0].create_batch_analysis_job;
    
    // Start processing
    processBatchJob(jobId).catch(error => {
      logger.error(`Error processing quick analysis ${jobId}:`, error);
    });
    
    res.json({
      job_id: jobId,
      message: 'Quick analysis started',
      lead_count: lead_ids.length
    });
  })
);

export default router;
