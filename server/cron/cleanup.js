import cron from 'node-cron';
import { query } from '../config/database.js';

/**
 * Cron job för att rensa gamla data
 * Körs varje natt kl 02:00
 */

// Kör varje natt kl 02:00
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Starting cleanup job...');
  
  try {
    let totalDeleted = 0;

    // 1. Rensa gamla activity logs (äldre än 90 dagar)
    const activityResult = await query(
      `DELETE FROM activity_logs 
       WHERE created_at < NOW() - INTERVAL '90 days'
       RETURNING id`
    );
    console.log(`✅ Deleted ${activityResult.rowCount} old activity logs`);
    totalDeleted += activityResult.rowCount;

    // 2. Rensa gamla search history (äldre än 60 dagar)
    const searchResult = await query(
      `DELETE FROM search_history 
       WHERE created_at < NOW() - INTERVAL '60 days'
       RETURNING id`
    );
    console.log(`✅ Deleted ${searchResult.rowCount} old search history entries`);
    totalDeleted += searchResult.rowCount;

    // 3. Rensa gamla API usage logs (äldre än 180 dagar)
    const apiResult = await query(
      `DELETE FROM api_usage 
       WHERE created_at < NOW() - INTERVAL '180 days'
       RETURNING id`
    );
    console.log(`✅ Deleted ${apiResult.rowCount} old API usage logs`);
    totalDeleted += apiResult.rowCount;

    // 4. Rensa gamla monitoring executions (äldre än 30 dagar)
    const monitoringResult = await query(
      `DELETE FROM monitoring_executions 
       WHERE executed_at < NOW() - INTERVAL '30 days'
       RETURNING id`
    );
    console.log(`✅ Deleted ${monitoringResult.rowCount} old monitoring executions`);
    totalDeleted += monitoringResult.rowCount;

    // 5. Rensa gamla downloads (äldre än 30 dagar)
    const downloadsResult = await query(
      `DELETE FROM downloads 
       WHERE created_at < NOW() - INTERVAL '30 days'
       RETURNING id`
    );
    console.log(`✅ Deleted ${downloadsResult.rowCount} old downloads`);
    totalDeleted += downloadsResult.rowCount;

    // 6. Rensa gamla candidate cache (äldre än 30 dagar eller inte accessade på 7 dagar)
    const cacheResult = await query(
      `DELETE FROM candidate_cache 
       WHERE cached_at < NOW() - INTERVAL '30 days'
          OR (last_accessed IS NOT NULL AND last_accessed < NOW() - INTERVAL '7 days')
          OR (last_accessed IS NULL AND cached_at < NOW() - INTERVAL '7 days')
       RETURNING id`
    );
    console.log(`✅ Deleted ${cacheResult.rowCount} old cache entries`);
    totalDeleted += cacheResult.rowCount;

    // 7. Rensa inaktiva bevakningar (inte körda på 365 dagar)
    const inactiveWatchesResult = await query(
      `UPDATE lead_monitoring 
       SET is_active = false 
       WHERE is_active = true 
         AND (last_check_date < NOW() - INTERVAL '365 days' 
              OR (last_check_date IS NULL AND created_at < NOW() - INTERVAL '365 days'))
       RETURNING id`
    );
    console.log(`✅ Deactivated ${inactiveWatchesResult.rowCount} inactive watches`);

    // 8. Vacuum analyze för att optimera databas
    await query('VACUUM ANALYZE');
    console.log('✅ Database vacuumed and analyzed');

    console.log(`🎉 Cleanup complete: ${totalDeleted} records deleted`);

    // Logga cleanup i activity_logs
    await query(
      `INSERT INTO activity_logs (user_id, action_type, details)
       VALUES (NULL, 'cleanup_job', $1)`,
      [JSON.stringify({
        total_deleted: totalDeleted,
        activity_logs: activityResult.rowCount,
        search_history: searchResult.rowCount,
        api_usage: apiResult.rowCount,
        monitoring_executions: monitoringResult.rowCount,
        downloads: downloadsResult.rowCount,
        cache: cacheResult.rowCount,
        deactivated_watches: inactiveWatchesResult.rowCount
      })]
    );

  } catch (error) {
    console.error('❌ Cleanup job failed:', error);
    
    // Logga fel
    await query(
      `INSERT INTO activity_logs (user_id, action_type, details)
       VALUES (NULL, 'cleanup_job_failed', $1)`,
      [JSON.stringify({ error: error.message })]
    ).catch(err => console.error('Failed to log cleanup error:', err));
  }
});

console.log('✅ Cleanup cron job initialized (runs daily at 02:00)');

export default cron;
