import bcrypt from 'bcrypt';
import { query } from './config/database.js';

async function testLogin() {
  try {
    const email = 'admin@leadhunter.com';
    const password = 'LeadHunter2024!';
    
    const result = await query(
      'SELECT email, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('User:', user.email);
    console.log('Stored hash:', user.password_hash);
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', validPassword);
    
    if (validPassword) {
      console.log('✅ Login would succeed!');
    } else {
      console.log('❌ Password does not match');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testLogin();
