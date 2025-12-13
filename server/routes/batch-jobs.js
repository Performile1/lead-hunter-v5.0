import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

/**
 * Skapa nytt schemalagt batch-jobb
 * Endast admin och managers
 */
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  [
    body('job_name').notEmpty().trim(),
    body('job_type').isIn(['search', 'analysis', 'both']),
    body('schedule_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('schedule_days').optional().isIn(['daily', 'weekdays', 'weekends', 'custom']),
    body('search_query').optional().trim(),
    body('max_results').optional().isInt({ min: 1, max: 500 }),
    body('analysis_protocol').optional().isIn(['deep-pro', 'deep', 'quick', 'batch']),
    body('llm_provider').optional().isIn(['gemini', 'groq', 'openai', 'claude', 'ollama'])
  ],
  auditLog('create_batch_job'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      job_name,
      job_type,
      schedule_time,
      schedule_days,
      search_query,
      search_filters,
      max_results,
      analysis_protocol,
      llm_provider,
      auto_assign,
      assign_to_terminal
    } = req.body;

    // Beräkna nästa körning
    const nextRun = calculateNextRun(schedule_time, schedule_days);

    const result = await query(
      `INSERT INTO scheduled_batch_jobs (
        created_by,
        job_name,
        job_type,
        schedule_time,
        schedule_days,
        search_query,
        search_filters,
        max_results,
        analysis_protocol,
        llm_provider,
        auto_assign,
        assign_to_terminal,
        next_run_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        req.userId,
        job_name,
        job_type,
        schedule_time,
        schedule_days || 'weekdays',
        search_query,
        JSON.stringify(search_filters || {}),
        max_results || 50,
        analysis_protocol || 'quick',
        llm_provider || 'gemini',
        auto_assign || false,
        assign_to_terminal || null,
        nextRun
      ]
    );

    res.json({
      message: 'Batch-jobb skapat',
      job: result.rows[0]
    });
  })
);

/**
 * Hämta alla batch-jobb
 * Admin ser alla, managers ser sina egna
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    let queryStr = `
      SELECT 
        sbj.*,
        u.full_name as created_by_name,
        t.name as terminal_name,
        COUNT(bje.id) as execution_count
      FROM scheduled_batch_jobs sbj
      LEFT JOIN users u ON sbj.created_by = u.id
      LEFT JOIN terminals t ON sbj.assign_to_terminal = t.id
      LEFT JOIN batch_job_executions bje ON sbj.id = bje.job_id
    `;

    const params = [];

    // Managers ser bara sina egna jobb
    if (req.user.role === 'manager') {
      queryStr += ` WHERE sbj.created_by = $1`;
      params.push(req.userId);
    }

    queryStr += `
      GROUP BY sbj.id, u.full_name, t.name
      ORDER BY sbj.created_at DESC
    `;

    const result = await query(queryStr, params);

    res.json({
      jobs: result.rows
    });
  })
);

/**
 * Hämta specifikt batch-jobb
 */
router.get(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        sbj.*,
        u.full_name as created_by_name,
        t.name as terminal_name
      FROM scheduled_batch_jobs sbj
      LEFT JOIN users u ON sbj.created_by = u.id
      LEFT JOIN terminals t ON sbj.assign_to_terminal = t.id
      WHERE sbj.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch-jobb hittades inte' });
    }

    const job = result.rows[0];

    // Managers kan bara se sina egna jobb
    if (req.user.role === 'manager' && job.created_by !== req.userId) {
      return res.status(403).json({ error: 'Åtkomst nekad' });
    }

    res.json({ job });
  })
);

/**
 * Uppdatera batch-jobb
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  [
    body('job_name').optional().trim(),
    body('schedule_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('is_active').optional().isBoolean()
  ],
  auditLog('update_batch_job'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verifiera ägarskap för managers
    if (req.user.role === 'manager') {
      const ownerCheck = await query(
        'SELECT created_by FROM scheduled_batch_jobs WHERE id = $1',
        [id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Batch-jobb hittades inte' });
      }

      if (ownerCheck.rows[0].created_by !== req.userId) {
        return res.status(403).json({ error: 'Åtkomst nekad' });
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(req.body).forEach(key => {
      if (['job_name', 'schedule_time', 'schedule_days', 'is_active', 'search_query', 'max_results', 'analysis_protocol', 'llm_provider'].includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Inga fält att uppdatera' });
    }

    // Beräkna ny next_run om schedule ändrats
    if (req.body.schedule_time || req.body.schedule_days) {
      const jobResult = await query('SELECT schedule_time, schedule_days FROM scheduled_batch_jobs WHERE id = $1', [id]);
      const job = jobResult.rows[0];
      const newTime = req.body.schedule_time || job.schedule_time;
      const newDays = req.body.schedule_days || job.schedule_days;
      const nextRun = calculateNextRun(newTime, newDays);
      
      updates.push(`next_run_at = $${paramCount}`);
      values.push(nextRun);
      paramCount++;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE scheduled_batch_jobs 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      message: 'Batch-jobb uppdaterat',
      job: result.rows[0]
    });
  })
);

/**
 * Ta bort batch-jobb
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  auditLog('delete_batch_job'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verifiera ägarskap för managers
    if (req.user.role === 'manager') {
      const ownerCheck = await query(
        'SELECT created_by FROM scheduled_batch_jobs WHERE id = $1',
        [id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Batch-jobb hittades inte' });
      }

      if (ownerCheck.rows[0].created_by !== req.userId) {
        return res.status(403).json({ error: 'Åtkomst nekad' });
      }
    }

    await query('DELETE FROM scheduled_batch_jobs WHERE id = $1', [id]);

    res.json({ message: 'Batch-jobb borttaget' });
  })
);

/**
 * Hämta körningshistorik för batch-jobb
 */
router.get(
  '/:id/executions',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const result = await query(
      `SELECT * FROM batch_job_executions
       WHERE job_id = $1
       ORDER BY executed_at DESC
       LIMIT $2`,
      [id, limit]
    );

    res.json({
      executions: result.rows
    });
  })
);

/**
 * Kör batch-jobb manuellt
 */
router.post(
  '/:id/execute',
  requireAuth,
  requireRole('admin', 'manager'),
  auditLog('execute_batch_job'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const jobResult = await query(
      'SELECT * FROM scheduled_batch_jobs WHERE id = $1',
      [id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch-jobb hittades inte' });
    }

    const job = jobResult.rows[0];

    // Verifiera ägarskap för managers
    if (req.user.role === 'manager' && job.created_by !== req.userId) {
      return res.status(403).json({ error: 'Åtkomst nekad' });
    }

    // Skapa execution record
    const executionResult = await query(
      `INSERT INTO batch_job_executions (job_id, status)
       VALUES ($1, 'queued')
       RETURNING id`,
      [id]
    );

    // Här skulle vi trigga faktisk körning (via queue eller direkt)
    // För nu, returnera bara execution ID

    res.json({
      message: 'Batch-jobb körs',
      execution_id: executionResult.rows[0].id
    });
  })
);

/**
 * Beräkna nästa körning baserat på schema
 */
function calculateNextRun(scheduleTime, scheduleDays) {
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  // Om tiden redan passerat idag, börja från imorgon
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  // Justera för schedule_days
  if (scheduleDays === 'weekdays') {
    // Hoppa över helger
    while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  } else if (scheduleDays === 'weekends') {
    // Endast helger
    while (nextRun.getDay() !== 0 && nextRun.getDay() !== 6) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  }

  return nextRun;
}

export default router;
