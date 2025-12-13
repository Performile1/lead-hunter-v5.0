import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dhl_lead_hunter',
  user: process.env.DB_USER || 'dhl_user',
  password: process.env.DB_PASSWORD || 'dhl_secure_password_2024'
});

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting admin password...');
    
    const password = 'Test123!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, status = 'active'
       WHERE email = 'admin@dhl.se'
       RETURNING id, email, full_name, role, status`,
      [passwordHash]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User admin@dhl.se not found');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('✅ Password reset successful!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.full_name);
    console.log('🔑 Role:', user.role);
    console.log('📊 Status:', user.status);
    console.log('🔒 Password: Test123!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
