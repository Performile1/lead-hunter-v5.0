import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function verifySuperAdmin() {
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
    
    // Kontrollera super admin
    const result = await mtClient.query(`
      SELECT id, email, full_name, role, is_super_admin, tenant_id, password_hash
      FROM users 
      WHERE email = 'admin@leadhunter.com'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Super admin hittades inte i databasen');
    } else {
      const user = result.rows[0];
      console.log('📋 Super Admin i databasen:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Namn: ${user.full_name}`);
      console.log(`   Roll: ${user.role}`);
      console.log(`   Super Admin: ${user.is_super_admin}`);
      console.log(`   Tenant ID: ${user.tenant_id || '(ingen - korrekt)'}`);
      
      // Testa lösenord
      const testPassword = 'LeadHunter2024!';
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`\n🔑 Lösenord "LeadHunter2024!" är: ${isValid ? '✅ KORREKT' : '❌ FELAKTIGT'}`);
      
      if (!isValid) {
        console.log('\n🔧 Återställer lösenord...');
        const newHash = await bcrypt.hash(testPassword, 10);
        await mtClient.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [newHash, user.id]
        );
        console.log('✅ Lösenord återställt till: LeadHunter2024!');
      }
    }
    
    await mtClient.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fel:', error.message);
    await mtClient.end();
    process.exit(1);
  }
}

verifySuperAdmin();
