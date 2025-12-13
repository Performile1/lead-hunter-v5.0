import cron from 'node-cron';
import { query } from '../config/database.js';

/**
 * Cron job för att köra schemalagda batch-jobb
 * Körs var 15:e minut för att kolla om något jobb ska köras
 */

// Kör var 15:e minut
cron.schedule('*/15 * * * *', async () => {
  console.log('🔍 Checking scheduled batch jobs...');
  
  try {
    // Hämta jobb som ska köras
    const dueJobs = await query(
      `SELECT * FROM scheduled_batch_jobs
       WHERE is_active = true
         AND next_run_at <= NOW()
       ORDER BY next_run_at ASC
       LIMIT 10`
    );

    if (dueJobs.rows.length === 0) {
      console.log('✅ No batch jobs due');
      return;
    }

    console.log(`📊 Found ${dueJobs.rows.length} batch jobs to execute`);

    for (const job of dueJobs.rows) {
      try {
        await executeBatchJob(job);
      } catch (error) {
        console.error(`❌ Batch job execution failed for ${job.job_name}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Batch jobs cron failed:', error);
  }
});

/**
 * Kör ett batch-jobb
 */
async function executeBatchJob(job) {
  const startTime = Date.now();
  
  console.log(`🚀 Executing batch job: ${job.job_name} (${job.job_type})`);

  // Skapa execution record
  const executionResult = await query(
    `INSERT INTO batch_job_executions (job_id, status)
     VALUES ($1, 'running')
     RETURNING id`,
    [job.id]
  );

  const executionId = executionResult.rows[0].id;

  try {
    let leadsFound = 0;
    let leadsAnalyzed = 0;
    let leadsCreated = 0;
    let leadsSkipped = 0;
    const executionLog = [];

    // Steg 1: Sök efter leads (om job_type är 'search' eller 'both')
    if (job.job_type === 'search' || job.job_type === 'both') {
      executionLog.push({ step: 'search', status: 'started', timestamp: new Date() });
      
      const searchResults = await performSearch(job);
      leadsFound = searchResults.length;
      
      executionLog.push({ 
        step: 'search', 
        status: 'completed', 
        results: leadsFound,
        timestamp: new Date() 
      });

      // Steg 2: Analysera leads (om job_type är 'analysis' eller 'both')
      if (job.job_type === 'both' || job.job_type === 'analysis') {
        executionLog.push({ step: 'analysis', status: 'started', timestamp: new Date() });

        for (const searchResult of searchResults) {
          try {
            // Kolla om leadet redan finns
            const existingLead = await query(
              'SELECT id FROM leads WHERE org_number = $1',
              [searchResult.org_number]
            );

            if (existingLead.rows.length > 0) {
              leadsSkipped++;
              continue;
            }

            // Analysera leadet
            const analysisResult = await analyzeLead(searchResult, job);
            
            if (analysisResult.success) {
              leadsAnalyzed++;
              leadsCreated++;
              
              // Auto-assign om konfigurerat
              if (job.auto_assign && job.assign_to_terminal) {
                await assignLeadToTerminal(analysisResult.lead_id, job.assign_to_terminal);
              }
            }

          } catch (error) {
            console.error('Failed to analyze lead:', error);
            executionLog.push({ 
              step: 'analysis', 
              error: error.message, 
              lead: searchResult.company_name 
            });
          }
        }

        executionLog.push({ 
          step: 'analysis', 
          status: 'completed', 
          analyzed: leadsAnalyzed,
          created: leadsCreated,
          skipped: leadsSkipped,
          timestamp: new Date() 
        });
      }
    }

    // Steg 3: Endast analys av befintliga leads
    if (job.job_type === 'analysis' && (!job.job_type === 'both')) {
      executionLog.push({ step: 'reanalysis', status: 'started', timestamp: new Date() });
      
      // Hämta leads som ska omanalyseras (t.ex. gamla leads)
      const leadsToReanalyze = await query(
        `SELECT * FROM leads 
         WHERE analysis_date < NOW() - INTERVAL '90 days'
         LIMIT $1`,
        [job.max_results]
      );

      for (const lead of leadsToReanalyze.rows) {
        try {
          await reanalyzeLead(lead, job);
          leadsAnalyzed++;
        } catch (error) {
          console.error('Failed to reanalyze lead:', error);
        }
      }

      executionLog.push({ 
        step: 'reanalysis', 
        status: 'completed', 
        reanalyzed: leadsAnalyzed,
        timestamp: new Date() 
      });
    }

    const executionTime = Date.now() - startTime;

    // Uppdatera execution record
    await query(
      `UPDATE batch_job_executions
       SET status = 'completed',
           leads_found = $1,
           leads_analyzed = $2,
           leads_created = $3,
           leads_skipped = $4,
           execution_time_ms = $5,
           execution_log = $6,
           completed_at = NOW()
       WHERE id = $7`,
      [
        leadsFound,
        leadsAnalyzed,
        leadsCreated,
        leadsSkipped,
        executionTime,
        JSON.stringify(executionLog),
        executionId
      ]
    );

    // Uppdatera batch job statistik
    await query(
      `UPDATE scheduled_batch_jobs
       SET last_run_at = NOW(),
           next_run_at = $1,
           total_runs = total_runs + 1,
           total_leads_found = total_leads_found + $2,
           total_leads_analyzed = total_leads_analyzed + $3
       WHERE id = $4`,
      [
        calculateNextRun(job.schedule_time, job.schedule_days),
        leadsFound,
        leadsAnalyzed,
        job.id
      ]
    );

    console.log(`✅ Batch job completed: ${job.job_name}`);
    console.log(`   Found: ${leadsFound}, Analyzed: ${leadsAnalyzed}, Created: ${leadsCreated}, Skipped: ${leadsSkipped}`);
    console.log(`   Time: ${executionTime}ms`);

  } catch (error) {
    console.error(`❌ Batch job failed: ${job.job_name}`, error);

    // Uppdatera execution med fel
    await query(
      `UPDATE batch_job_executions
       SET status = 'failed',
           error_message = $1,
           completed_at = NOW()
       WHERE id = $2`,
      [error.message, executionId]
    );

    // Uppdatera nästa körning ändå
    await query(
      `UPDATE scheduled_batch_jobs
       SET next_run_at = $1
       WHERE id = $2`,
      [calculateNextRun(job.schedule_time, job.schedule_days), job.id]
    );
  }
}

/**
 * Utför sökning
 */
async function performSearch(job) {
  // Här skulle vi integrera med Bolagsverket eller annan datakälla
  // För nu, returnera mock-data
  
  console.log(`🔍 Searching with query: ${job.search_query}`);
  
  // I produktion skulle detta göra faktisk sökning
  // Exempel: await bolagsverketService.search(job.search_query, job.search_filters);
  
  return [];
}

/**
 * Analysera lead
 */
async function analyzeLead(searchResult, job) {
  console.log(`🔬 Analyzing: ${searchResult.company_name}`);
  
  // Här skulle vi köra faktisk AI-analys
  // Använd vald protocol och LLM provider från job
  
  // I produktion:
  // const result = await llmOrchestrator.analyze({
  //   company: searchResult,
  //   protocol: job.analysis_protocol,
  //   provider: job.llm_provider
  // });
  
  return {
    success: false, // Ändra till true när faktisk analys implementeras
    lead_id: null
  };
}

/**
 * Omanalysera befintligt lead
 */
async function reanalyzeLead(lead, job) {
  console.log(`🔄 Reanalyzing: ${lead.company_name}`);
  
  // Här skulle vi köra omanalys av befintligt lead
  // Uppdatera data från Bolagsverket, Kronofogden, etc.
  
  return { success: false };
}

/**
 * Tilldela lead till terminal
 */
async function assignLeadToTerminal(leadId, terminalId) {
  // Hämta en säljare från terminalen baserat på postnummer
  const salespersonResult = await query(
    `SELECT u.id 
     FROM users u
     JOIN user_postal_codes upc ON u.id = upc.user_id
     WHERE u.terminal_id = $1
     LIMIT 1`,
    [terminalId]
  );

  if (salespersonResult.rows.length > 0) {
    await query(
      'UPDATE leads SET assigned_to = $1 WHERE id = $2',
      [salespersonResult.rows[0].id, leadId]
    );
  }
}

/**
 * Beräkna nästa körning
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
    while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  } else if (scheduleDays === 'weekends') {
    while (nextRun.getDay() !== 0 && nextRun.getDay() !== 6) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  }

  return nextRun;
}

console.log('✅ Batch jobs cron initialized (runs every 15 minutes)');

export default cron;
