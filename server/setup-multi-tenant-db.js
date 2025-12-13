import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

const SOURCE_DB = process.env.MT_SOURCE_DB || 'dhl_lead_hunter';
const TARGET_DB = process.env.MT_TARGET_DB || 'lead_hunter_mt';

// Admin connection (needs CREATEDB)
const ADMIN = {
  host: process.env.MT_DB_HOST || 'localhost',
  port: parseInt(process.env.MT_DB_PORT || '5432', 10),
  user: process.env.MT_DB_ADMIN_USER || 'postgres',
  password: process.env.MT_DB_ADMIN_PASSWORD || 'postgres',
  database: process.env.MT_DB_ADMIN_DATABASE || 'postgres'
};

const migrationFiles = [
  // Multi-tenant must run after base schema exists (we clone schema via template)
  path.join('server', 'migrations', '002_update_customers_to_segment.sql'),
  path.join('server', 'migrations', '003_multi_tenant_system.sql')
];

async function dbExists(client, dbName) {
  const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  return res.rowCount > 0;
}

async function createDbFromTemplate(client, targetDb, templateDb) {
  await client.query(`CREATE DATABASE ${targetDb} WITH TEMPLATE ${templateDb}`);
}

async function truncateAllTables(client) {
  // Truncate all tables in public schema (dynamic) – keeps schema intact
  // Excludes Postgres internal tables automatically.
  const tablesRes = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `);

  const tables = tablesRes.rows
    .map(r => r.tablename)
    // optional exclude list if you want to keep some data
    .filter(name => name !== 'spatial_ref_sys');

  if (tables.length === 0) return;

  const quoted = tables.map(t => `"public"."${t}"`).join(', ');
  await client.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
}

async function runSqlFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
}

async function main() {
  const adminClient = new Client(ADMIN);
  await adminClient.connect();

  try {
    console.log(`🔎 Checking source DB '${SOURCE_DB}' exists...`);
    if (!(await dbExists(adminClient, SOURCE_DB))) {
      throw new Error(`Source database '${SOURCE_DB}' not found. Update MT_SOURCE_DB env var or create it first.`);
    }

    console.log(`🔎 Checking target DB '${TARGET_DB}' exists...`);
    if (await dbExists(adminClient, TARGET_DB)) {
      console.log(`⚠️ Target database '${TARGET_DB}' already exists. Skipping CREATE DATABASE.`);
    } else {
      console.log(`🆕 Creating '${TARGET_DB}' from template '${SOURCE_DB}'...`);
      await createDbFromTemplate(adminClient, TARGET_DB, SOURCE_DB);
      console.log('✅ Database created');
    }
  } finally {
    await adminClient.end();
  }

  // Now connect to target DB to truncate + run migrations
  const targetClient = new Client({ ...ADMIN, database: TARGET_DB });
  await targetClient.connect();

  try {
    console.log('🧹 Truncating all tables (clean DB data)...');
    await truncateAllTables(targetClient);
    console.log('✅ Truncate complete');

    for (const relPath of migrationFiles) {
      const absPath = path.resolve(process.cwd(), relPath);
      if (!fs.existsSync(absPath)) {
        throw new Error(`Migration file not found: ${absPath}`);
      }
      console.log(`🔄 Running migration: ${relPath}`);
      await runSqlFile(targetClient, absPath);
      console.log('✅ Migration applied');
    }

    console.log('🎉 Multi-tenant DB setup complete!');
    console.log(`   Target DB: ${TARGET_DB}`);
  } finally {
    await targetClient.end();
  }
}

main().catch((err) => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
