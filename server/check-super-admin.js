import { query } from './config/database.js';

async function checkSuperAdmin() {
  try {
    const result = await query(
      'SELECT id, email, role, tenant_id, full_name FROM users WHERE email = $1',
      ['admin@leadhunter.com']
    );
    
    console.log('Super Admin User:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    if (result.rows[0]?.tenant_id) {
      console.log('\n⚠️ WARNING: Super admin has tenant_id set!');
      console.log('Fixing...');
      
      await query(
        'UPDATE users SET tenant_id = NULL WHERE email = $1',
        ['admin@leadhunter.com']
      );
      
      console.log('✅ Fixed: tenant_id set to NULL');
    } else {
      console.log('✅ Super admin tenant_id is correctly NULL');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkSuperAdmin();
