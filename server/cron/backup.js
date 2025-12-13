import cron from 'node-cron';
import { query } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Cron job för automatiska backups
 * Körs varje dag kl 03:00
 */

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';

// Kör varje dag kl 03:00
cron.schedule('0 3 * * *', async () => {
  console.log('💾 Starting backup job...');
  
  try {
    // Skapa backup-mapp om den inte finns
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

    // 1. Backup av leads
    const leadsResult = await query('SELECT * FROM leads');
    console.log(`📦 Backing up ${leadsResult.rowCount} leads`);

    // 2. Backup av decision makers
    const dmResult = await query('SELECT * FROM decision_makers');
    console.log(`📦 Backing up ${dmResult.rowCount} decision makers`);

    // 3. Backup av users (utan lösenord)
    const usersResult = await query(
      `SELECT id, email, full_name, role, status, created_at, last_login 
       FROM users`
    );
    console.log(`📦 Backing up ${usersResult.rowCount} users`);

    // 4. Backup av exclusions
    const exclusionsResult = await query('SELECT * FROM exclusions');
    console.log(`📦 Backing up ${exclusionsResult.rowCount} exclusions`);

    // 5. Backup av terminals
    const terminalsResult = await query('SELECT * FROM terminals');
    console.log(`📦 Backing up ${terminalsResult.rowCount} terminals`);

    // 6. Backup av lead monitoring
    const monitoringResult = await query('SELECT * FROM lead_monitoring WHERE is_active = true');
    console.log(`📦 Backing up ${monitoringResult.rowCount} active monitors`);

    // Skapa backup-objekt
    const backup = {
      created_at: new Date().toISOString(),
      version: '4.4',
      counts: {
        leads: leadsResult.rowCount,
        decision_makers: dmResult.rowCount,
        users: usersResult.rowCount,
        exclusions: exclusionsResult.rowCount,
        terminals: terminalsResult.rowCount,
        monitoring: monitoringResult.rowCount
      },
      data: {
        leads: leadsResult.rows,
        decision_makers: dmResult.rows,
        users: usersResult.rows,
        exclusions: exclusionsResult.rows,
        terminals: terminalsResult.rows,
        monitoring: monitoringResult.rows
      }
    };

    // Skriv till fil
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
    
    const stats = await fs.stat(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup saved: ${backupFile} (${fileSizeMB} MB)`);

    // Spara backup-info i databas
    await query(
      `INSERT INTO backups (name, backup_type, data, lead_count, file_size_bytes, created_by)
       VALUES ($1, $2, $3, $4, $5, NULL)`,
      [
        `backup-${timestamp}`,
        'automatic',
        JSON.stringify(backup.counts),
        leadsResult.rowCount,
        stats.size
      ]
    );

    // Rensa gamla backups (behåll senaste 30 dagarna)
    await cleanOldBackups();

    console.log('🎉 Backup complete');

  } catch (error) {
    console.error('❌ Backup job failed:', error);
    
    // Logga fel
    await query(
      `INSERT INTO activity_logs (user_id, action_type, details)
       VALUES (NULL, 'backup_job_failed', $1)`,
      [JSON.stringify({ error: error.message })]
    ).catch(err => console.error('Failed to log backup error:', err));
  }
});

/**
 * Rensa gamla backups
 */
async function cleanOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));

    // Sortera efter datum (nyaste först)
    backupFiles.sort().reverse();

    // Behåll senaste 30
    const filesToDelete = backupFiles.slice(30);

    for (const file of filesToDelete) {
      const filePath = path.join(BACKUP_DIR, file);
      await fs.unlink(filePath);
      console.log(`🗑️  Deleted old backup: ${file}`);
    }

    if (filesToDelete.length > 0) {
      console.log(`✅ Cleaned up ${filesToDelete.length} old backups`);
    }

    // Rensa gamla backups från databas
    await query(
      `DELETE FROM backups 
       WHERE backup_type = 'automatic' 
         AND created_at < NOW() - INTERVAL '30 days'`
    );

  } catch (error) {
    console.error('Failed to clean old backups:', error);
  }
}

console.log('✅ Backup cron job initialized (runs daily at 03:00)');

export default cron;
