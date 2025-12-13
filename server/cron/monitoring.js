import cron from 'node-cron';
import { query } from '../config/database.js';
import { sendEmail } from '../services/emailService.js';
import { detectTriggers, formatTriggersForEmail, getHighestSeverity } from '../utils/triggerDetection.js';

/**
 * Cron job för automatisk körning av lead-bevakningar
 * Körs varje timme
 */

// Kör varje timme
cron.schedule('0 * * * *', async () => {
  console.log('🔍 Checking due monitors...');
  
  try {
    // Hämta bevakningar som ska köras
    const dueWatches = await query(
      `SELECT 
        lm.*,
        l.company_name,
        l.org_number,
        l.segment,
        l.revenue_tkr as current_revenue,
        u.email as user_email,
        u.full_name as user_name
      FROM lead_monitoring lm
      JOIN leads l ON lm.lead_id = l.id
      JOIN users u ON lm.user_id = u.id
      WHERE lm.is_active = true 
        AND lm.next_check_date <= NOW()
      ORDER BY lm.next_check_date ASC
      LIMIT 100`
    );

    if (dueWatches.rows.length === 0) {
      console.log('✅ No monitors due');
      return;
    }

    console.log(`📊 Found ${dueWatches.rows.length} monitors to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (const watch of dueWatches.rows) {
      try {
        const startTime = Date.now();
        
        // Här skulle vi köra re-analys om auto_reanalyze är true
        // För nu, simulera med att kontrollera ändringar
        const changes = await checkForChanges(watch);
        
        // Logga körning
        await query(
          `INSERT INTO monitoring_executions (
            monitoring_id,
            executed_at,
            changes_detected,
            changes_data,
            duration_ms
          ) VALUES ($1, NOW(), $2, $3, $4)`,
          [
            watch.id,
            JSON.stringify(changes),
            JSON.stringify(changes),
            Date.now() - startTime
          ]
        );
        
        // Uppdatera nästa körning
        await query(
          `UPDATE lead_monitoring 
           SET next_check_date = NOW() + INTERVAL '1 day' * $1,
               last_check_date = NOW(),
               check_count = check_count + 1
           WHERE id = $2`,
          [watch.interval_days, watch.id]
        );
        
        // Skicka email om ändringar upptäcktes
        if (hasSignificantChanges(changes)) {
          await sendMonitoringEmail(watch, changes);
        }
        
        successCount++;
        console.log(`✅ Monitor executed: ${watch.company_name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Monitor execution failed for ${watch.company_name}:`, error);
        
        // Logga fel
        await query(
          `INSERT INTO monitoring_executions (
            monitoring_id,
            executed_at,
            error_message
          ) VALUES ($1, NOW(), $2)`,
          [watch.id, error.message]
        );
      }
    }

    console.log(`🎉 Monitoring complete: ${successCount} success, ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Monitoring cron job failed:', error);
  }
});

/**
 * Kontrollera om det finns ändringar i leadet
 */
async function checkForChanges(watch) {
  // Hämta nuvarande lead-data
  const currentLeadResult = await query(
    `SELECT * FROM leads WHERE id = $1`,
    [watch.lead_id]
  );

  if (currentLeadResult.rows.length === 0) {
    return { triggered_events: [] };
  }

  const currentLead = currentLeadResult.rows[0];

  // Om auto_reanalyze är aktiverat, kör omanalys här
  // För nu använder vi befintlig data

  // Skapa "old lead" från watch-data
  const oldLead = {
    revenue_tkr: watch.current_revenue,
    segment: watch.segment,
    legal_status: watch.legal_status || '',
    kronofogden_check: watch.kronofogden_check || '',
    credit_rating: watch.credit_rating || '',
    address: watch.address || '',
    warehouse_address: watch.warehouse_address || '',
    latest_news: watch.latest_news || ''
  };

  // Detektera triggers
  const triggeredEvents = detectTriggers(watch, oldLead, currentLead);

  // Spara trigger events i databas
  for (const event of triggeredEvents) {
    await query(
      `INSERT INTO trigger_events (
        monitoring_id,
        lead_id,
        trigger_type,
        old_value,
        new_value,
        change_percentage,
        severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        watch.id,
        watch.lead_id,
        event.type,
        event.old_value?.toString() || '',
        event.new_value?.toString() || '',
        event.change_percentage || null,
        event.severity
      ]
    );
  }

  return {
    triggered_events: triggeredEvents,
    has_changes: triggeredEvents.length > 0
  };
}

/**
 * Kontrollera om ändringar är signifikanta nog för email
 */
function hasSignificantChanges(changes) {
  return changes.triggered_events && changes.triggered_events.length > 0;
}

/**
 * Skicka email om ändringar
 */
async function sendMonitoringEmail(watch, changes) {
  try {
    const severity = getHighestSeverity(changes.triggered_events);
    const severityEmojis = {
      critical: '🚨',
      high: '⚠️',
      medium: '🔔',
      low: 'ℹ️'
    };

    const emoji = severityEmojis[severity] || '🔔';
    const subject = `${emoji} Lead-bevakning: ${watch.company_name}`;
    
    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #D40511; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .severity-${severity} { border-left: 4px solid ${severity === 'critical' ? '#D40511' : severity === 'high' ? '#FF6600' : severity === 'medium' ? '#FFCC00' : '#0066CC'}; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${emoji} Lead-bevakning: Ändringar Upptäckta</h1>
        </div>
        
        <div class="content">
          <h2>${watch.company_name}</h2>
          <p><strong>Org.nummer:</strong> ${watch.org_number || 'N/A'}</p>
          <p><strong>Segment:</strong> ${watch.segment}</p>
          <p><strong>Severity:</strong> <span style="text-transform: uppercase; color: ${severity === 'critical' ? '#D40511' : severity === 'high' ? '#FF6600' : severity === 'medium' ? '#FFCC00' : '#0066CC'};">${severity}</span></p>
          
          <h3>Upptäckta Händelser:</h3>
          ${formatTriggersForEmail(changes.triggered_events)}
          
          <p style="margin-top: 20px;"><strong>Kontrollerad:</strong> ${new Date().toLocaleString('sv-SE')}</p>
          
          <p style="margin-top: 20px;">
            <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
               style="background-color: #D40511; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 4px;">
              Visa i DHL Lead Hunter
            </a>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} DHL Lead Hunter - Automatisk Bevakning</p>
          <p>Detta är en automatisk notifikation från ditt bevakningssystem.</p>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(watch.notification_email, subject, body);
    console.log(`📧 Email sent to ${watch.notification_email} (severity: ${severity})`);
    
  } catch (error) {
    console.error('Failed to send monitoring email:', error);
  }
}

console.log('✅ Monitoring cron job initialized (runs every hour)');

export default cron;
