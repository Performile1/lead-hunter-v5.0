import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function checkAndUpdate() {
  // Kontrollera dhl_lead_hunter först
  console.log('🔍 Kontrollerar dhl_lead_hunter databas...');
  const dhlClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'dhl_lead_hunter',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });
  
  try {
    await dhlClient.connect();
    console.log('✅ Ansluten till dhl_lead_hunter');
    
    // Kontrollera att viktiga tabeller finns
    const tables = await dhlClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`✅ dhl_lead_hunter har ${tables.rows.length} tabeller:`);
    const importantTables = ['users', 'leads', 'customers', 'terminals'];
    const foundTables = tables.rows.map(r => r.table_name);
    
    for (const table of importantTables) {
      if (foundTables.includes(table)) {
        console.log(`   ✓ ${table}`);
      } else {
        console.log(`   ✗ ${table} (saknas)`);
      }
    }
    
    // Räkna data
    const userCount = await dhlClient.query('SELECT COUNT(*) FROM users');
    const leadCount = await dhlClient.query('SELECT COUNT(*) FROM leads');
    console.log(`\n📊 Data i dhl_lead_hunter:`);
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Leads: ${leadCount.rows[0].count}`);
    
    await dhlClient.end();
    console.log('\n✅ dhl_lead_hunter är intakt!\n');
    
  } catch (error) {
    console.error('❌ Problem med dhl_lead_hunter:', error.message);
    await dhlClient.end();
    process.exit(1);
  }
  
  // Nu uppdatera DHL i lead_hunter_mt
  console.log('🔄 Uppdaterar DHL-tenant i lead_hunter_mt...');
  const mtClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'lead_hunter_mt',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });
  
  try {
    await mtClient.connect();
    console.log('✅ Ansluten till lead_hunter_mt');
    
    // Hitta DHL-tenanten
    const dhlTenant = await mtClient.query(`
      SELECT id, company_name, domain, subdomain 
      FROM tenants 
      WHERE domain = 'dhl.se' OR company_name LIKE '%DHL%'
      LIMIT 1
    `);
    
    if (dhlTenant.rows.length === 0) {
      console.log('❌ DHL-tenant hittades inte');
      process.exit(1);
    }
    
    const tenant = dhlTenant.rows[0];
    console.log(`✅ Hittade tenant: ${tenant.company_name} (${tenant.domain})`);
    console.log(`   Nuvarande subdomain: ${tenant.subdomain || '(ingen)'}`);
    
    // Uppdatera subdomain
    await mtClient.query(`
      UPDATE tenants 
      SET subdomain = $1, updated_at = NOW()
      WHERE id = $2
    `, ['dhl-sweden', tenant.id]);
    
    console.log('✅ Subdomain uppdaterad till: dhl-sweden');
    console.log('🌐 Full URL: dhl-sweden.leadhunter.com');
    
    await mtClient.end();
    console.log('\n🎉 Klart! Båda databaserna är OK.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Problem med lead_hunter_mt:', error.message);
    await mtClient.end();
    process.exit(1);
  }
}

checkAndUpdate();
