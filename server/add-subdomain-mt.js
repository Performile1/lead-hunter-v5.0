import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function addSubdomain() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'lead_hunter_mt',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });
  
  try {
    await client.connect();
    console.log('✅ Ansluten till lead_hunter_mt');
    
    console.log('🔄 Lägger till subdomain kolumn till tenants...');
    
    // Kontrollera om tenants-tabellen finns
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tenants-tabellen finns inte i lead_hunter_mt.');
      process.exit(1);
    }
    
    console.log('✅ Tenants-tabellen hittad');
    
    // Kontrollera om subdomain-kolumnen redan finns
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
        AND column_name = 'subdomain'
      );
    `);
    
    if (columnCheck.rows[0].exists) {
      console.log('⚠️  Subdomain-kolumnen finns redan!');
      process.exit(0);
    }
    
    // Lägg till subdomain-kolumn
    await client.query('ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(100)');
    console.log('✅ Subdomain-kolumn tillagd');
    
    // Lägg till index
    await client.query('CREATE INDEX idx_tenants_subdomain ON tenants(subdomain)');
    console.log('✅ Index skapat');
    
    console.log('🎉 Migration klar!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fel:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addSubdomain();
