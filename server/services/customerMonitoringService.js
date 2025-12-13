import { query } from '../config/database.js';
import { scrapeWebsite } from './websiteScraperService.js';
import { logger } from '../utils/logger.js';

/**
 * Customer Monitoring Service
 * Automatisk övervakning av kunders checkout-positioner
 */

/**
 * Hämta kunder som ska övervakas nu
 */
export async function getCustomersToMonitor() {
  try {
    const result = await query(`
      SELECT * FROM monitoring_queue
      LIMIT 50
    `);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching monitoring queue:', error);
    return [];
  }
}

/**
 * Övervaka en specifik kund
 */
export async function monitorCustomer(customerId) {
  try {
    logger.info(`Starting monitoring for customer: ${customerId}`);

    // Hämta kund
    const customerResult = await query(
      'SELECT * FROM customers WHERE id = $1',
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      logger.warn(`Customer not found: ${customerId}`);
      return { success: false, error: 'Customer not found' };
    }

    const customer = customerResult.rows[0];

    if (!customer.website_url) {
      logger.warn(`Customer has no website URL: ${customerId}`);
      return { success: false, error: 'No website URL' };
    }

    // Hämta senaste monitoring-data för jämförelse
    const previousResult = await query(
      `SELECT * FROM customer_monitoring_history 
       WHERE customer_id = $1 
       ORDER BY monitored_at DESC 
       LIMIT 1`,
      [customerId]
    );

    const previousMonitoring = previousResult.rows[0];

    // Scrapa webbplats
    const startTime = Date.now();
    let websiteData;
    
    try {
      websiteData = await scrapeWebsite(customer.website_url);
    } catch (scrapeError) {
      logger.error(`Scraping failed for ${customer.website_url}:`, scrapeError);
      
      // Spara misslyckad scraping
      await query(
        `INSERT INTO customer_monitoring_history (
          customer_id, monitored_at, scrape_success, scrape_error
        ) VALUES ($1, NOW(), false, $2)`,
        [customerId, scrapeError.message]
      );

      return { success: false, error: scrapeError.message };
    }

    const scrapeDuration = Date.now() - startTime;

    // Analysera data
    const dhlIndex = websiteData.shipping_providers?.findIndex(p => 
      p.toLowerCase().includes('dhl')
    );
    const dhlPosition = dhlIndex >= 0 ? dhlIndex + 1 : null;
    const totalOptions = websiteData.shipping_providers?.length || 0;

    // Jämför med tidigare data
    let positionChange = 0;
    let newCompetitors = [];
    let removedCompetitors = [];
    let alertTriggered = false;
    let alertType = null;
    let alertMessage = null;

    if (previousMonitoring) {
      // Beräkna positionsförändring
      if (previousMonitoring.dhl_position && dhlPosition) {
        positionChange = previousMonitoring.dhl_position - dhlPosition;
      }

      // Hitta nya konkurrenter
      const previousProviders = previousMonitoring.shipping_providers || [];
      const currentProviders = websiteData.shipping_providers || [];
      
      newCompetitors = currentProviders.filter(p => !previousProviders.includes(p));
      removedCompetitors = previousProviders.filter(p => !currentProviders.includes(p));

      // Trigga alerts
      if (positionChange < 0) {
        // Position försämrad
        alertTriggered = true;
        alertType = 'position_dropped';
        alertMessage = `DHL:s position har sjunkit från ${previousMonitoring.dhl_position} till ${dhlPosition}`;
      } else if (!dhlPosition && previousMonitoring.dhl_position) {
        // DHL borttagen från checkout
        alertTriggered = true;
        alertType = 'dhl_removed';
        alertMessage = 'DHL har tagits bort från checkout-alternativen';
      } else if (newCompetitors.length > 0) {
        // Nya konkurrenter
        alertTriggered = true;
        alertType = 'new_competitor';
        alertMessage = `Nya konkurrenter: ${newCompetitors.join(', ')}`;
      } else if (positionChange > 0) {
        // Position förbättrad (positiv alert)
        alertTriggered = true;
        alertType = 'position_improved';
        alertMessage = `DHL:s position har förbättrats från ${previousMonitoring.dhl_position} till ${dhlPosition}`;
      }
    }

    // Spara monitoring-data
    await query(
      `INSERT INTO customer_monitoring_history (
        customer_id, monitored_at, checkout_position, total_shipping_options,
        shipping_providers, dhl_position, new_competitors, removed_competitors,
        position_change, alert_triggered, alert_type, alert_message,
        scrape_duration_ms, scrape_success
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)`,
      [
        customerId,
        dhlPosition,
        totalOptions,
        websiteData.shipping_providers || [],
        dhlPosition,
        newCompetitors,
        removedCompetitors,
        positionChange,
        alertTriggered,
        alertType,
        alertMessage,
        scrapeDuration
      ]
    );

    // Uppdatera customer med senaste scraping-data
    await query(
      `UPDATE customers 
       SET website_analysis = $1, last_monitored_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(websiteData), customerId]
    );

    // Uppdatera monitoring schedule
    await updateNextRunTime(customerId);

    logger.info(`Monitoring completed for customer: ${customerId}`, {
      dhlPosition,
      positionChange,
      alertTriggered,
      alertType
    });

    return {
      success: true,
      dhlPosition,
      positionChange,
      alertTriggered,
      alertType,
      alertMessage,
      scrapeDuration
    };

  } catch (error) {
    logger.error(`Error monitoring customer ${customerId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Uppdatera nästa körning för en kund
 */
async function updateNextRunTime(customerId) {
  try {
    const scheduleResult = await query(
      'SELECT * FROM customer_monitoring_schedule WHERE customer_id = $1',
      [customerId]
    );

    if (scheduleResult.rows.length === 0) return;

    const schedule = scheduleResult.rows[0];
    const now = new Date();
    const times = schedule.schedule_times || [];

    // Hitta nästa tid
    let nextRun = null;
    
    if (schedule.frequency === 'hourly') {
      // Kör varje timme
      nextRun = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (schedule.frequency === 'daily') {
      // Hitta nästa tid idag eller imorgon
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const nextTime = times.find(t => t > currentTime);
      
      if (nextTime) {
        // Nästa tid idag
        const [hours, minutes] = nextTime.split(':');
        nextRun = new Date(now);
        nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        // Första tiden imorgon
        const [hours, minutes] = times[0].split(':');
        nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
    } else if (schedule.frequency === 'weekly') {
      // Kör en gång i veckan
      nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    if (nextRun) {
      await query(
        `UPDATE customer_monitoring_schedule 
         SET next_run_at = $1, last_run_at = NOW(), updated_at = NOW()
         WHERE customer_id = $2`,
        [nextRun, customerId]
      );
    }

  } catch (error) {
    logger.error(`Error updating next run time for customer ${customerId}:`, error);
  }
}

/**
 * Kör monitoring för alla kunder i kön
 */
export async function runMonitoringCycle() {
  logger.info('Starting monitoring cycle');

  const customers = await getCustomersToMonitor();
  
  if (customers.length === 0) {
    logger.info('No customers to monitor');
    return { processed: 0, success: 0, failed: 0 };
  }

  logger.info(`Found ${customers.length} customers to monitor`);

  let success = 0;
  let failed = 0;

  for (const customer of customers) {
    try {
      const result = await monitorCustomer(customer.id);
      
      if (result.success) {
        success++;
        
        // Logga alerts
        if (result.alertTriggered) {
          logger.warn(`Alert triggered for ${customer.company_name}:`, {
            type: result.alertType,
            message: result.alertMessage
          });
        }
      } else {
        failed++;
      }

      // Vänta 2 sekunder mellan varje scraping för att inte överbelasta
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      logger.error(`Error processing customer ${customer.id}:`, error);
      failed++;
    }
  }

  logger.info('Monitoring cycle completed', {
    processed: customers.length,
    success,
    failed
  });

  return { processed: customers.length, success, failed };
}

/**
 * Hämta kunder i riskzonen
 */
export async function getCustomersAtRisk() {
  try {
    const result = await query('SELECT * FROM customers_at_risk ORDER BY last_check DESC');
    return result.rows;
  } catch (error) {
    logger.error('Error fetching customers at risk:', error);
    return [];
  }
}

export default {
  getCustomersToMonitor,
  monitorCustomer,
  runMonitoringCycle,
  getCustomersAtRisk
};
