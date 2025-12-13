import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';

/**
 * Seed test data för lokal utveckling
 */

async function seedTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding test data...\n');
    
    await client.query('BEGIN');

    // 1. Skapa test-användare
    console.log('👤 Creating test users...');
    
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    const users = [
      {
        email: 'admin@dhl.se',
        password_hash: hashedPassword,
        full_name: 'Admin User',
        role: 'admin',
        status: 'active'
      },
      {
        email: 'manager@dhl.se',
        password_hash: hashedPassword,
        full_name: 'Manager User',
        role: 'manager',
        status: 'active'
      },
      {
        email: 'terminal@dhl.se',
        password_hash: hashedPassword,
        full_name: 'Terminal Chef',
        role: 'terminal_manager',
        status: 'active'
      },
      {
        email: 'kam@dhl.se',
        password_hash: hashedPassword,
        full_name: 'KAM Säljare',
        role: 'kam',
        status: 'active'
      },
      {
        email: 'fs@dhl.se',
        password_hash: hashedPassword,
        full_name: 'FS Säljare',
        role: 'fs',
        status: 'active'
      }
    ];

    for (const user of users) {
      await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (email) DO NOTHING
      `, [user.email, user.password_hash, user.full_name, user.role, user.status]);
      
      console.log(`  ✓ ${user.email} (${user.role})`);
    }

    // 2. Skapa test-leads
    console.log('\n📊 Creating test leads...');
    
    const leads = [
      {
        company_name: 'Boozt AB',
        org_number: '5567933674',
        address: 'Mäster Samuelsgatan 36',
        postal_code: '111 57',
        city: 'Stockholm',
        segment: 'KAM',
        revenue_tkr: 2500000,
        freight_budget_tkr: 125000,
        website_url: 'https://www.boozt.com',
        status: 'new',
        source: 'manual'
      },
      {
        company_name: 'Ellos AB',
        org_number: '5560648761',
        address: 'Fabriksgatan 2',
        postal_code: '504 64',
        city: 'Borås',
        segment: 'KAM',
        revenue_tkr: 1800000,
        freight_budget_tkr: 90000,
        website_url: 'https://www.ellos.se',
        status: 'new',
        source: 'manual'
      },
      {
        company_name: 'Revolution Race AB',
        org_number: '5591234567',
        address: 'Kungsgatan 1',
        postal_code: '411 19',
        city: 'Göteborg',
        segment: 'FS',
        revenue_tkr: 850000,
        freight_budget_tkr: 42500,
        website_url: 'https://www.revolutionrace.se',
        status: 'analyzed',
        source: 'api'
      },
      {
        company_name: 'Lager 157 AB',
        org_number: '5566778899',
        address: 'Storgatan 10',
        postal_code: '211 42',
        city: 'Malmö',
        segment: 'FS',
        revenue_tkr: 650000,
        freight_budget_tkr: 32500,
        website_url: 'https://www.lager157.com',
        status: 'new',
        source: 'manual'
      },
      {
        company_name: 'Nelly AB',
        org_number: '5569876543',
        address: 'Drottninggatan 50',
        postal_code: '411 07',
        city: 'Göteborg',
        segment: 'FS',
        revenue_tkr: 720000,
        freight_budget_tkr: 36000,
        website_url: 'https://www.nelly.com',
        status: 'contacted',
        source: 'api'
      }
    ];

    for (const lead of leads) {
      const result = await client.query(`
        INSERT INTO leads (
          company_name, org_number, address, postal_code, city,
          segment, revenue_tkr, freight_budget_tkr, website_url,
          status, source, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (org_number) DO NOTHING
        RETURNING id
      `, [
        lead.company_name, lead.org_number, lead.address, lead.postal_code,
        lead.city, lead.segment, lead.revenue_tkr, lead.freight_budget_tkr,
        lead.website_url, lead.status, lead.source
      ]);

      if (result.rows.length > 0) {
        console.log(`  ✓ ${lead.company_name} (${lead.segment})`);

        // Lägg till decision makers för några leads
        if (lead.company_name === 'Boozt AB') {
          await client.query(`
            INSERT INTO decision_makers (lead_id, name, title, email, phone)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            result.rows[0].id,
            'Anna Svensson',
            'Head of Logistics',
            'anna.svensson@boozt.com',
            '+46 70 123 45 67'
          ]);
        }

        if (lead.company_name === 'Ellos AB') {
          await client.query(`
            INSERT INTO decision_makers (lead_id, name, title, email, phone)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            result.rows[0].id,
            'Erik Johansson',
            'Logistics Manager',
            'erik.johansson@ellos.se',
            '+46 70 234 56 78'
          ]);
        }
      }
    }

    // 3. Skapa system settings
    console.log('\n⚙️  Creating system settings...');
    
    const settings = [
      { key: 'scraping_method', value: 'traditional', type: 'string' },
      { key: 'scraping_timeout', value: '30000', type: 'number' },
      { key: 'scraping_retries', value: '3', type: 'number' },
      { key: 'scraping_cache_enabled', value: 'true', type: 'boolean' },
      { key: 'scraping_cache_duration', value: '24', type: 'number' },
      { key: 'api_openai_model', value: 'gpt-4', type: 'string' },
      { key: 'api_rate_limit', value: '100', type: 'number' },
      { key: 'search_default_protocol', value: 'Djupanalys', type: 'string' },
      { key: 'search_default_llm', value: 'GPT-4', type: 'string' },
      { key: 'search_max_batch_size', value: '1000', type: 'number' },
      { key: 'ui_theme', value: 'light', type: 'string' },
      { key: 'ui_primary_color', value: '#D40511', type: 'string' },
      { key: 'ui_secondary_color', value: '#FFCC00', type: 'string' },
      { key: 'data_auto_backup', value: 'true', type: 'boolean' },
      { key: 'data_backup_frequency', value: 'daily', type: 'string' },
      { key: 'security_session_timeout', value: '60', type: 'number' }
    ];

    for (const setting of settings) {
      await client.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (setting_key) DO NOTHING
      `, [setting.key, setting.value, setting.type]);
    }
    
    console.log('  ✓ System settings created');

    await client.query('COMMIT');

    console.log('\n✅ Test data seeded successfully!\n');
    console.log('📝 Test Users:');
    console.log('  Email: admin@dhl.se     | Password: Test123! | Role: Admin');
    console.log('  Email: manager@dhl.se   | Password: Test123! | Role: Manager');
    console.log('  Email: terminal@dhl.se  | Password: Test123! | Role: Terminal Chef');
    console.log('  Email: kam@dhl.se       | Password: Test123! | Role: KAM');
    console.log('  Email: fs@dhl.se        | Password: Test123! | Role: FS');
    console.log('\n📊 Test Leads: 5 companies created');
    console.log('⚙️  Settings: Default system settings configured\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Kör seed
seedTestData()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
