import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function fixDHLRole() {
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
      SELECT id, company_name, domain 
      FROM tenants 
      WHERE domain = 'dhl.se'
    `);
    
    if (dhlTenant.rows.length === 0) {
      console.log('❌ DHL-tenant hittades inte');
      process.exit(1);
    }
    
    const tenant = dhlTenant.rows[0];
    console.log(`\n📋 DHL Tenant: ${tenant.company_name}`);
    console.log(`   Domain: ${tenant.domain}`);
    console.log(`   ID: ${tenant.id}`);
    
    // Hitta alla användare kopplade till DHL-tenanten
    const dhlUsers = await mtClient.query(`
      SELECT id, email, full_name, role, is_super_admin, tenant_id
      FROM users 
      WHERE tenant_id = $1
    `, [tenant.id]);
    
    console.log(`\n👥 Användare i DHL-tenant: ${dhlUsers.rows.length}`);
    
    let fixedCount = 0;
    for (const user of dhlUsers.rows) {
      console.log(`\n   User: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Super Admin: ${user.is_super_admin}`);
      
      if (user.is_super_admin === true) {
        console.log('   ⚠️  PROBLEM: Tenant-användare har super admin!');
        
        // Ta bort super admin
        await mtClient.query(`
          UPDATE users 
          SET is_super_admin = false
          WHERE id = $1
        `, [user.id]);
        
        console.log('   ✅ Super admin borttagen');
        fixedCount++;
      } else {
        console.log('   ✓ OK - Inte super admin');
      }
    }
    
    if (fixedCount > 0) {
      console.log(`\n🔧 Fixade ${fixedCount} användare`);
    } else {
      console.log('\n✅ Alla DHL-användare har korrekta rättigheter');
    }
    
    // Visa super admins (ska inte vara kopplade till någon tenant)
    const superAdmins = await mtClient.query(`
      SELECT id, email, full_name, tenant_id
      FROM users 
      WHERE is_super_admin = true
    `);
    
    console.log(`\n🔐 Super Admins i systemet: ${superAdmins.rows.length}`);
    for (const admin of superAdmins.rows) {
      console.log(`   ${admin.email} - Tenant: ${admin.tenant_id || '(ingen - korrekt)'}`);
      
      if (admin.tenant_id) {
        console.log('   ⚠️  VARNING: Super admin ska inte ha tenant_id!');
      }
    }
    
    await mtClient.end();
    console.log('\n🎉 Klart!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
    await mtClient.end();
    process.exit(1);
  }
}

fixDHLRole();
