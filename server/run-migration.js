import fs from 'fs';
import { query } from './config/database.js';

async function executeSql(sql) {
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    if (statement.includes('COMMENT ON') || statement.includes('DO $$')) {
      continue;
    }
    
    try {
      await query(statement);
      console.log('✅ Statement executed');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Already exists, skipping...');
      } else {
        console.error('❌ Error:', error.message);
      }
    }
  }
}

async function runMigration() {
  try {
    console.log('🔄 Kör databas migration...');
    
    // Kör multi-tenant migration först
    console.log('📋 Steg 1: Kör multi-tenant migration...');
    const multiTenantSql = fs.readFileSync('./server/migrations/003_multi_tenant_system.sql', 'utf8');
    await executeSql(multiTenantSql);
    
    console.log('📋 Steg 2: Lägger till subdomain kolumn...');
    const subdomainSql = fs.readFileSync('./server/migrations/004_add_subdomain_to_tenants.sql', 'utf8');
    await executeSql(subdomainSql);
    
    console.log('✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
