import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function setupAdminUsers() {
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
    
    // Hitta DHL-tenanten
    const dhlTenant = await mtClient.query(`
      SELECT id, company_name, domain, subdomain 
      FROM tenants 
      WHERE domain = 'dhl.se'
    `);
    
    if (dhlTenant.rows.length === 0) {
      console.log('❌ DHL-tenant hittades inte');
      process.exit(1);
    }
    
    const tenant = dhlTenant.rows[0];
    console.log(`📋 DHL Tenant: ${tenant.company_name}`);
    console.log(`   Domain: ${tenant.domain}`);
    console.log(`   Subdomain: ${tenant.subdomain}`);
    console.log(`   ID: ${tenant.id}\n`);
    
    // 1. Skapa Super Admin (leadhunter)
    console.log('🔐 Skapar Super Admin (leadhunter)...');
    const superAdminPassword = await bcrypt.hash('LeadHunter2024!', 10);
    
    const superAdminCheck = await mtClient.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@leadhunter.com']
    );
    
    if (superAdminCheck.rows.length > 0) {
      console.log('   ⚠️  Super admin finns redan');
    } else {
      await mtClient.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_super_admin, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin@leadhunter.com', superAdminPassword, 'Lead Hunter Admin', 'admin', true, null]);
      console.log('   ✅ Super Admin skapad: admin@leadhunter.com');
      console.log('   🔑 Lösenord: LeadHunter2024!');
    }
    
    // 2. Skapa DHL Admin
    console.log('\n👤 Skapar DHL Admin (admin@dhl.se)...');
    const dhlAdminPassword = await bcrypt.hash('DHL2024!', 10);
    
    const dhlAdminCheck = await mtClient.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@dhl.se']
    );
    
    if (dhlAdminCheck.rows.length > 0) {
      console.log('   ⚠️  DHL admin finns redan');
      // Uppdatera för att säkerställa korrekt tenant
      await mtClient.query(`
        UPDATE users 
        SET tenant_id = $1, is_super_admin = false, role = 'admin'
        WHERE email = $2
      `, [tenant.id, 'admin@dhl.se']);
      console.log('   ✅ DHL admin uppdaterad');
    } else {
      await mtClient.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_super_admin, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin@dhl.se', dhlAdminPassword, 'DHL Administrator', 'admin', false, tenant.id]);
      console.log('   ✅ DHL Admin skapad: admin@dhl.se');
      console.log('   🔑 Lösenord: DHL2024!');
    }
    
    // Visa sammanfattning
    console.log('\n📊 Användare i systemet:');
    const allUsers = await mtClient.query(`
      SELECT 
        u.email, 
        u.full_name, 
        u.role, 
        u.is_super_admin,
        t.company_name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      ORDER BY u.is_super_admin DESC, u.email
    `);
    
    for (const user of allUsers.rows) {
      console.log(`\n   ${user.email}`);
      console.log(`   Namn: ${user.full_name}`);
      console.log(`   Roll: ${user.role}`);
      console.log(`   Super Admin: ${user.is_super_admin ? 'Ja' : 'Nej'}`);
      console.log(`   Tenant: ${user.tenant_name || '(ingen - super admin)'}`);
    }
    
    await mtClient.end();
    console.log('\n🎉 Användare konfigurerade!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
    await mtClient.end();
    process.exit(1);
  }
}

setupAdminUsers();
