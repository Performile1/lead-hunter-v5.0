/**
 * Test Users för Checkout Scraping
 * Används för att fylla i checkout-formulär och se fraktalternativ
 */

export const testUsers = [
  {
    id: 'stockholm_user',
    name: 'Test Testsson',
    email: 'test@dhlleadhunter.com',
    phone: '0701234567',
    address: {
      street: 'Testgatan 1',
      postalCode: '11122',
      city: 'Stockholm',
      country: 'SE',
      countryName: 'Sverige'
    },
    description: 'Stockholm - Storstadsadress för att testa alla fraktalternativ'
  },
  {
    id: 'gothenburg_user',
    name: 'Anna Andersson',
    email: 'anna@dhlleadhunter.com',
    phone: '0709876543',
    address: {
      street: 'Avenyn 10',
      postalCode: '41136',
      city: 'Göteborg',
      country: 'SE',
      countryName: 'Sverige'
    },
    description: 'Göteborg - Testar västra Sverige'
  },
  {
    id: 'malmo_user',
    name: 'Erik Eriksson',
    email: 'erik@dhlleadhunter.com',
    phone: '0731112233',
    address: {
      street: 'Södergatan 5',
      postalCode: '21134',
      city: 'Malmö',
      country: 'SE',
      countryName: 'Sverige'
    },
    description: 'Malmö - Testar södra Sverige'
  },
  {
    id: 'rural_user',
    name: 'Maria Svensson',
    email: 'maria@dhlleadhunter.com',
    phone: '0765554433',
    address: {
      street: 'Byvägen 12',
      postalCode: '82041',
      city: 'Färila',
      country: 'SE',
      countryName: 'Sverige'
    },
    description: 'Landsbygd - Testar glesbygd (färre fraktalternativ)'
  },
  {
    id: 'company_user',
    name: 'Företag AB',
    email: 'info@dhlleadhunter.com',
    phone: '0812345678',
    address: {
      street: 'Företagsvägen 20',
      postalCode: '16440',
      city: 'Kista',
      country: 'SE',
      countryName: 'Sverige'
    },
    company: 'DHL Lead Hunter AB',
    orgNumber: '5569123456',
    description: 'Företagsadress - Testar B2B-fraktalternativ'
  }
];

/**
 * Hämta random test user
 */
export function getRandomTestUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

/**
 * Hämta test user baserat på typ
 */
export function getTestUserByType(type = 'stockholm') {
  const userMap = {
    'stockholm': testUsers[0],
    'gothenburg': testUsers[1],
    'malmo': testUsers[2],
    'rural': testUsers[3],
    'company': testUsers[4]
  };
  return userMap[type] || testUsers[0];
}

/**
 * Hämta alla test users
 */
export function getAllTestUsers() {
  return testUsers;
}
