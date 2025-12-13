import { query } from './server/config/database.js';

async function checkTenants() {
  try {
    console.log('🔍 Checking for tenants...\n');
    
    const result = await query('SELECT id, company_name, subdomain, domain FROM tenants ORDER BY created_at');
    
    if (result.rows.length === 0) {
      console.log('❌ No tenants found in database!');
      console.log('\n💡 You need to create a DHL-Sweden tenant first.');
      console.log('   Use the Super Admin dashboard to create a tenant with:');
      console.log('   - Company Name: DHL Sweden');
      console.log('   - Subdomain: dhl-sweden');
      console.log('   - Domain: dhl-sweden.leadhunter.com');
    } else {
      console.log(`✅ Found ${result.rows.length} tenant(s):\n`);
      result.rows.forEach((tenant, idx) => {
        console.log(`${idx + 1}. ${tenant.company_name}`);
        console.log(`   ID: ${tenant.id}`);
        console.log(`   Subdomain: ${tenant.subdomain || 'N/A'}`);
        console.log(`   Domain: ${tenant.domain || 'N/A'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTenants();
