import { query } from './config/database.js';

async function checkUser() {
  try {
    const result = await query(
      'SELECT email, role, full_name, status FROM users WHERE email = $1',
      ['admin@leadhunter.com']
    );
    
    console.log('User found:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('User does not exist!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkUser();
