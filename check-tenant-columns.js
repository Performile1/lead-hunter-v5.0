import { query } from './server/config/database.js';

async function checkColumns() {
  try {
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `);
    
    console.log('Tenants table columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Also get current DHL-Sweden data
    const tenant = await query("SELECT * FROM tenants WHERE subdomain = 'dhl-sweden'");
    if (tenant.rows.length > 0) {
      console.log('\nCurrent DHL-Sweden data:');
      console.log(JSON.stringify(tenant.rows[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkColumns();
