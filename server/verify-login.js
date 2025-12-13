import bcrypt from 'bcrypt';
import { query } from './config/database.js';

async function verifyLogin() {
  try {
    // Kontrollera användare
    const result = await query(
      `SELECT id, email, role, tenant_id, full_name, password_hash 
       FROM users WHERE email = $1`,
      ['admin@leadhunter.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Användare finns inte!');
      return;
    }
    
    const user = result.rows[0];
    console.log('\n✅ Användare hittad:');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Tenant ID:', user.tenant_id);
    console.log('Full Name:', user.full_name);
    
    // Testa lösenord
    const password = 'LeadHunter2024!';
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    console.log('\n🔐 Lösenord test:');
    console.log('Password:', password);
    console.log('Valid:', isValid ? '✅ JA' : '❌ NEJ');
    
    if (!isValid) {
      console.log('\n⚠️ Lösenordet matchar inte! Genererar nytt hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('Nytt hash:', newHash);
      console.log('\nKör detta för att uppdatera:');
      console.log(`UPDATE users SET password_hash = '${newHash}' WHERE email = 'admin@leadhunter.com';`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

verifyLogin();
