import cron from 'node-cron';
import { runMonitoringCycle } from '../services/customerMonitoringService.js';
import { logger } from '../utils/logger.js';

/**
 * Monitoring Scheduler
 * Kör automatisk övervakning av kunder enligt schema
 */

let monitoringJob = null;

/**
 * Starta scheduler
 */
export function startMonitoringScheduler() {
  if (monitoringJob) {
    logger.warn('Monitoring scheduler is already running');
    return;
  }

  // Kör varje timme vid :00
  monitoringJob = cron.schedule('0 * * * *', async () => {
    logger.info('Monitoring scheduler triggered');
    
    try {
      const result = await runMonitoringCycle();
      logger.info('Monitoring cycle completed', result);
    } catch (error) {
      logger.error('Monitoring cycle failed:', error);
    }
  });

  logger.info('✅ Monitoring scheduler started (runs every hour at :00)');
}

/**
 * Stoppa scheduler
 */
export function stopMonitoringScheduler() {
  if (monitoringJob) {
    monitoringJob.stop();
    monitoringJob = null;
    logger.info('Monitoring scheduler stopped');
  }
}

/**
 * Kör monitoring manuellt (för testning)
 */
export async function runManualMonitoring() {
  logger.info('Running manual monitoring cycle');
  return await runMonitoringCycle();
}

export default {
  startMonitoringScheduler,
  stopMonitoringScheduler,
  runManualMonitoring
};
