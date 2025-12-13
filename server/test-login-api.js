import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing login API...\n');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@leadhunter.com',
        password: 'LeadHunter2024!'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.user) {
      console.log('\n✅ Login successful!');
      console.log('User role:', data.user.role);
      console.log('User tenant_id:', data.user.tenant_id);
      console.log('Is Super Admin:', data.user.tenant_id === null || data.user.tenant_id === undefined);
    } else {
      console.log('\n❌ Login failed!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
