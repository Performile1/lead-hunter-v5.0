import bcrypt from 'bcrypt';

const passwords = {
  'TenantAdmin2024!': 'admin@dhl.se',
  'Manager2024!': 'manager@dhl.se',
  'Terminal2024!': 'terminal@dhl.se',
  'Sales2024!': 'sales@dhl.se / telesales@dhl.se'
};

async function hashPasswords() {
  console.log('Generating password hashes...\n');
  
  for (const [password, email] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${email}`);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}\n`);
  }
}

hashPasswords();
