/**
 * Batch Scheduler Service
 * Manages scheduled batch analysis jobs (cronjobs)
 */

import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { processBatchJob } from './batchAnalysisService.js';

let schedulerInterval = null;
let isRunning = false;

/**
 * Start the batch scheduler
 * Checks for scheduled jobs every minute
 */
export function startScheduler() {
  if (schedulerInterval) {
    logger.warn('Batch scheduler already running');
    return;
  }
  
  logger.info('🕐 Starting batch analysis scheduler...');
  
  // Check immediately on start
  checkScheduledJobs();
  
  // Then check every minute
  schedulerInterval = setInterval(() => {
    checkScheduledJobs();
  }, 60000); // 60 seconds
  
  logger.info('✅ Batch scheduler started (checks every 60s)');
}

/**
 * Stop the batch scheduler
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('⏹️ Batch scheduler stopped');
  }
}

/**
 * Check for scheduled jobs that need to run
 */
async function checkScheduledJobs() {
  if (isRunning) {
    logger.debug('Scheduler check already in progress, skipping...');
    return;
  }
  
  isRunning = true;
  
  try {
    // Get jobs that need to run
    const result = await query(`
      SELECT * FROM get_scheduled_jobs_to_run()
    `);
    
    if (result.rows.length === 0) {
      logger.debug('No scheduled jobs to run');
      isRunning = false;
      return;
    }
    
    logger.info(`📋 Found ${result.rows.length} scheduled job(s) to run`);
    
    // Process each job
    for (const job of result.rows) {
      try {
        logger.info(`🚀 Starting scheduled job: ${job.job_name} (${job.job_id})`);
        
        // Create a new job instance based on the scheduled job
        const newJobResult = await query(`
          SELECT create_batch_analysis_job($1, $2, $3, $4, $5, $6, FALSE, NULL)
        `, [
          job.tenant_id,
          null, // System-created
          `${job.job_name} - ${new Date().toISOString()}`,
          job.job_type,
          job.lead_ids,
          job.analysis_config
        ]);
        
        const newJobId = newJobResult.rows[0].create_batch_analysis_job;
        
        // Update the scheduled job's last_run_at and next_run_at
        await query(`
          UPDATE batch_analysis_jobs
          SET 
            last_run_at = NOW(),
            next_run_at = calculate_next_run(schedule_cron)
          WHERE id = $1
        `, [job.job_id]);
        
        // Process the new job asynchronously
        processBatchJob(newJobId).catch(error => {
          logger.error(`Error processing scheduled job ${newJobId}:`, error);
        });
        
        logger.info(`✅ Scheduled job started: ${newJobId}`);
        
      } catch (error) {
        logger.error(`Error starting scheduled job ${job.job_id}:`, error);
      }
    }
    
  } catch (error) {
    logger.error('Error checking scheduled jobs:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Manually trigger a scheduled job
 */
export async function triggerScheduledJob(jobId) {
  const result = await query(`
    SELECT 
      id as job_id,
      job_name,
      job_type,
      tenant_id,
      lead_ids,
      analysis_config
    FROM batch_analysis_jobs
    WHERE id = $1 AND is_scheduled = TRUE
  `, [jobId]);
  
  if (result.rows.length === 0) {
    throw new Error('Scheduled job not found');
  }
  
  const job = result.rows[0];
  
  // Create a new job instance
  const newJobResult = await query(`
    SELECT create_batch_analysis_job($1, $2, $3, $4, $5, $6, FALSE, NULL)
  `, [
    job.tenant_id,
    null,
    `${job.job_name} - Manual Trigger - ${new Date().toISOString()}`,
    job.job_type,
    job.lead_ids,
    job.analysis_config
  ]);
  
  const newJobId = newJobResult.rows[0].create_batch_analysis_job;
  
  // Update last_run_at
  await query(`
    UPDATE batch_analysis_jobs
    SET last_run_at = NOW()
    WHERE id = $1
  `, [jobId]);
  
  // Start processing
  processBatchJob(newJobId).catch(error => {
    logger.error(`Error processing manually triggered job ${newJobId}:`, error);
  });
  
  return newJobId;
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null,
    processing: isRunning,
    check_interval_seconds: 60
  };
}

export default {
  startScheduler,
  stopScheduler,
  triggerScheduledJob,
  getSchedulerStatus
};
