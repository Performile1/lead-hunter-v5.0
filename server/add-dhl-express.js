import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function addDHLExpress() {
  const mtClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'lead_hunter_mt',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });
  
  try {
    await mtClient.connect();
    console.log('✅ Ansluten till lead_hunter_mt\n');
    
    // Uppdatera befintlig DHL tenant till DHL Freight
    console.log('🔄 Uppdaterar befintlig DHL till DHL Freight...');
    await mtClient.query(`
      UPDATE tenants 
      SET company_name = 'DHL Freight Sweden',
          checkout_search_term = 'DHL Freight'
      WHERE domain = 'dhl.se'
    `);
    console.log('✅ DHL Freight uppdaterad\n');
    
    // Skapa DHL Express Sweden tenant
    console.log('📦 Skapar DHL Express Sweden tenant...');
    
    const expressCheck = await mtClient.query(
      'SELECT id FROM tenants WHERE domain = $1',
      ['dhlexpress.se']
    );
    
    if (expressCheck.rows.length > 0) {
      console.log('⚠️  DHL Express tenant finns redan');
    } else {
      const result = await mtClient.query(`
        INSERT INTO tenants (
          company_name,
          domain,
          subdomain,
          checkout_search_term,
          main_competitor,
          subscription_tier,
          max_users,
          max_leads_per_month,
          max_customers,
          primary_color,
          secondary_color,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        'DHL Express Sweden',
        'dhlexpress.se',
        'dhl-express',
        'DHL Express',
        'PostNord',
        'enterprise',
        100,
        10000,
        5000,
        '#FFCC00',
        '#D40511',
        true
      ]);
      
      console.log('✅ DHL Express tenant skapad');
      console.log(`   Domain: ${result.rows[0].domain}`);
      console.log(`   Subdomain: ${result.rows[0].subdomain}`);
      console.log(`   Full URL: dhl-express.leadhunter.com\n`);
      
      // Skapa admin för DHL Express
      console.log('👤 Skapar admin för DHL Express...');
      const adminPassword = await bcrypt.hash('DHLExpress2024!', 10);
      
      await mtClient.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_super_admin, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'admin@dhlexpress.se',
        adminPassword,
        'DHL Express Administrator',
        'admin',
        false,
        result.rows[0].id
      ]);
      
      console.log('✅ Admin skapad: admin@dhlexpress.se');
      console.log('   🔑 Lösenord: DHLExpress2024!\n');
    }
    
    // Visa alla tenants
    console.log('📊 Alla tenants i systemet:\n');
    const tenants = await mtClient.query(`
      SELECT 
        company_name,
        domain,
        subdomain,
        checkout_search_term,
        subscription_tier,
        is_active
      FROM tenants
      ORDER BY company_name
    `);
    
    for (const tenant of tenants.rows) {
      console.log(`   ${tenant.company_name}`);
      console.log(`   Domain: ${tenant.domain}`);
      console.log(`   Subdomain: ${tenant.subdomain || '(ingen)'}`);
      console.log(`   Söker efter: ${tenant.checkout_search_term}`);
      console.log(`   Tier: ${tenant.subscription_tier}`);
      console.log(`   Status: ${tenant.is_active ? 'Aktiv' : 'Inaktiv'}\n`);
    }
    
    await mtClient.end();
    console.log('🎉 Klart!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
    await mtClient.end();
    process.exit(1);
  }
}

addDHLExpress();
