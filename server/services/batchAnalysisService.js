/**
 * Batch Analysis Service
 * Process multiple leads in batch for technical analysis
 */

import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { scrapeWebsite } from './websiteScraperService.js';
import { detectCheckoutCarriers } from './checkoutDetectionService.js';

/**
 * Process a batch analysis job
 */
export async function processBatchJob(batchJobId) {
  logger.info(`🚀 Starting batch job: ${batchJobId}`);
  
  try {
    // Mark job as running
    await query(`
      UPDATE batch_analysis_jobs
      SET status = 'running', started_at = NOW()
      WHERE id = $1
    `, [batchJobId]);
    
    // Get job details
    const jobResult = await query(`
      SELECT 
        id,
        job_type,
        analysis_config,
        total_leads,
        tenant_id
      FROM batch_analysis_jobs
      WHERE id = $1
    `, [batchJobId]);
    
    if (jobResult.rows.length === 0) {
      throw new Error('Batch job not found');
    }
    
    const job = jobResult.rows[0];
    const config = job.analysis_config || {};
    
    logger.info(`📊 Processing ${job.total_leads} leads with job type: ${job.job_type}`);
    
    // Process items one by one
    let processedCount = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Get next pending item
      const itemResult = await query(`
        SELECT * FROM get_next_batch_item($1)
      `, [batchJobId]);
      
      if (itemResult.rows.length === 0) {
        hasMore = false;
        break;
      }
      
      const item = itemResult.rows[0];
      processedCount++;
      
      logger.info(`[${processedCount}/${job.total_leads}] Processing lead: ${item.company_name}`);
      
      // Mark item as running
      await query(`
        UPDATE batch_analysis_items
        SET status = 'running', started_at = NOW()
        WHERE id = $1
      `, [item.item_id]);
      
      try {
        // Perform analysis based on job type
        let analysisResult = {};
        
        switch (job.job_type) {
          case 'tech_analysis':
            analysisResult = await performTechAnalysis(item, config);
            break;
          
          case 'checkout_scraping':
            analysisResult = await performCheckoutScraping(item, config);
            break;
          
          case 'full_analysis':
            analysisResult = await performFullAnalysis(item, config);
            break;
          
          case 'ecommerce_detection':
            analysisResult = await performEcommerceDetection(item, config);
            break;
          
          case 'carrier_detection':
            analysisResult = await performCarrierDetection(item, config);
            break;
          
          default:
            throw new Error(`Unknown job type: ${job.job_type}`);
        }
        
        // Save results to lead
        await saveAnalysisToLead(item.lead_id, analysisResult);
        
        // Mark item as completed
        await query(`
          SELECT update_batch_item_status($1, 'completed', $2::JSONB, NULL)
        `, [item.item_id, JSON.stringify(analysisResult)]);
        
        logger.info(`✅ Completed: ${item.company_name}`);
        
      } catch (error) {
        logger.error(`❌ Failed: ${item.company_name}`, error);
        
        // Mark item as failed
        await query(`
          SELECT update_batch_item_status($1, 'failed', NULL, $2)
        `, [item.item_id, error.message]);
      }
      
      // Small delay to avoid overwhelming external services
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info(`✅ Batch job completed: ${batchJobId} (${processedCount} leads processed)`);
    
    // Update job as completed (if not already done by trigger)
    await query(`
      UPDATE batch_analysis_jobs
      SET 
        status = 'completed',
        completed_at = NOW()
      WHERE id = $1 AND status = 'running'
    `, [batchJobId]);
    
    return {
      success: true,
      processed: processedCount
    };
    
  } catch (error) {
    logger.error('Batch job failed:', error);
    
    // Mark job as failed
    await query(`
      UPDATE batch_analysis_jobs
      SET 
        status = 'failed',
        completed_at = NOW(),
        errors = $2::JSONB
      WHERE id = $1
    `, [batchJobId, JSON.stringify([{ message: error.message, timestamp: new Date() }])]);
    
    throw error;
  }
}

/**
 * Perform tech analysis (technologies, platform detection)
 */
async function performTechAnalysis(item, config) {
  if (!item.domain) {
    throw new Error('No domain available for analysis');
  }
  
  const url = item.domain.startsWith('http') ? item.domain : `https://${item.domain}`;
  const result = await scrapeWebsite(url);
  
  return {
    technologies: result.technologies || [],
    ecommerce_platform: result.ecommerce_platform,
    detection_method: result.detection_method,
    confidence: result.confidence,
    analyzed_at: new Date().toISOString()
  };
}

/**
 * Perform checkout scraping
 */
async function performCheckoutScraping(item, config) {
  if (!item.domain) {
    throw new Error('No domain available for scraping');
  }
  
  const url = item.domain.startsWith('http') ? item.domain : `https://${item.domain}`;
  const result = await detectCheckoutCarriers(url, item.company_name);
  
  return {
    has_checkout: result.has_checkout,
    shipping_providers: result.shipping_providers || [],
    shipping_providers_with_position: result.shipping_providers_with_position || [],
    checkout_providers: result.checkout_providers || [],
    detection_method: result.detection_method,
    confidence: result.confidence,
    scraped_at: new Date().toISOString()
  };
}

/**
 * Perform full analysis (tech + checkout)
 */
async function performFullAnalysis(item, config) {
  if (!item.domain) {
    throw new Error('No domain available for analysis');
  }
  
  const url = item.domain.startsWith('http') ? item.domain : `https://${item.domain}`;
  
  // Run both analyses
  const [techResult, checkoutResult] = await Promise.all([
    scrapeWebsite(url),
    detectCheckoutCarriers(url, item.company_name)
  ]);
  
  return {
    ...techResult,
    ...checkoutResult,
    analyzed_at: new Date().toISOString()
  };
}

/**
 * Perform ecommerce platform detection only
 */
async function performEcommerceDetection(item, config) {
  if (!item.domain) {
    throw new Error('No domain available for detection');
  }
  
  const url = item.domain.startsWith('http') ? item.domain : `https://${item.domain}`;
  const result = await scrapeWebsite(url);
  
  return {
    ecommerce_platform: result.ecommerce_platform,
    technologies: result.technologies || [],
    detected_at: new Date().toISOString()
  };
}

/**
 * Perform carrier detection only
 */
async function performCarrierDetection(item, config) {
  if (!item.domain) {
    throw new Error('No domain available for detection');
  }
  
  const url = item.domain.startsWith('http') ? item.domain : `https://${item.domain}`;
  const result = await detectCheckoutCarriers(url, item.company_name);
  
  return {
    shipping_providers: result.shipping_providers || [],
    shipping_providers_with_position: result.shipping_providers_with_position || [],
    detection_method: result.detection_method,
    confidence: result.confidence,
    detected_at: new Date().toISOString()
  };
}

/**
 * Save analysis results to lead
 */
async function saveAnalysisToLead(leadId, analysisResult) {
  const updates = [];
  const values = [leadId];
  let paramIndex = 2;
  
  // Build dynamic update query based on available data
  if (analysisResult.ecommerce_platform) {
    updates.push(`ecommerce_platform = $${paramIndex}`);
    values.push(analysisResult.ecommerce_platform);
    paramIndex++;
  }
  
  if (analysisResult.shipping_providers && analysisResult.shipping_providers.length > 0) {
    updates.push(`carriers = $${paramIndex}`);
    values.push(analysisResult.shipping_providers.join(','));
    paramIndex++;
  }
  
  if (analysisResult.shipping_providers_with_position) {
    updates.push(`checkout_position = $${paramIndex}`);
    values.push(JSON.stringify(analysisResult.shipping_providers_with_position));
    paramIndex++;
  }
  
  if (analysisResult.checkout_providers && analysisResult.checkout_providers.length > 0) {
    updates.push(`checkout_providers = $${paramIndex}`);
    values.push(analysisResult.checkout_providers);
    paramIndex++;
  }
  
  if (analysisResult.has_checkout !== undefined) {
    updates.push(`has_checkout = $${paramIndex}`);
    values.push(analysisResult.has_checkout);
    paramIndex++;
  }
  
  if (analysisResult.detection_method) {
    updates.push(`checkout_detection_method = $${paramIndex}`);
    values.push(analysisResult.detection_method);
    paramIndex++;
  }
  
  updates.push(`checkout_scraped_at = NOW()`);
  updates.push(`updated_at = NOW()`);
  
  if (updates.length > 0) {
    const sql = `
      UPDATE leads
      SET ${updates.join(', ')}
      WHERE id = $1
    `;
    
    await query(sql, values);
  }
}

/**
 * Get batch job status
 */
export async function getBatchJobStatus(batchJobId) {
  const result = await query(`
    SELECT 
      bj.*,
      u.full_name as created_by_name,
      (
        SELECT json_agg(
          json_build_object(
            'id', bi.id,
            'lead_id', bi.lead_id,
            'company_name', l.company_name,
            'status', bi.status,
            'error_message', bi.error_message,
            'duration_seconds', bi.duration_seconds
          )
        )
        FROM batch_analysis_items bi
        JOIN leads l ON bi.lead_id = l.id
        WHERE bi.batch_job_id = bj.id
        ORDER BY bi.started_at DESC
        LIMIT 100
      ) as items
    FROM batch_analysis_jobs bj
    LEFT JOIN users u ON bj.created_by = u.id
    WHERE bj.id = $1
  `, [batchJobId]);
  
  return result.rows[0];
}

/**
 * Cancel batch job
 */
export async function cancelBatchJob(batchJobId) {
  await query(`
    UPDATE batch_analysis_jobs
    SET status = 'cancelled', completed_at = NOW()
    WHERE id = $1 AND status IN ('pending', 'running', 'paused')
  `, [batchJobId]);
  
  // Cancel pending items
  await query(`
    UPDATE batch_analysis_items
    SET status = 'skipped'
    WHERE batch_job_id = $1 AND status = 'pending'
  `, [batchJobId]);
}

export default {
  processBatchJob,
  getBatchJobStatus,
  cancelBatchJob
};
