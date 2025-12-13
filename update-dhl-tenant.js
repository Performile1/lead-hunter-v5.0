import { query } from './server/config/database.js';

async function updateDHLTenant() {
  try {
    console.log('🔄 Updating DHL-Sweden tenant...\n');
    
    const result = await query(`
      UPDATE tenants 
      SET 
        checkout_search_term = 'DHL',
        primary_color = '#D40511',
        secondary_color = '#FFCC00'
      WHERE subdomain = 'dhl-sweden'
      RETURNING *
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ DHL-Sweden tenant updated successfully!\n');
      console.log('Tenant details:');
      console.log('  Company:', result.rows[0].company_name);
      console.log('  Subdomain:', result.rows[0].subdomain);
      console.log('  Search Term:', result.rows[0].checkout_search_term);
      console.log('  Primary Color:', result.rows[0].primary_color);
      console.log('  Secondary Color:', result.rows[0].secondary_color);
    } else {
      console.log('❌ DHL-Sweden tenant not found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateDHLTenant();
