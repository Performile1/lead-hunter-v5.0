const { Pool } = require('pg');

// Serverless-optimized connection pool
let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
      pool = null;
    });
  }
  
  return pool;
}

const query = async (text, params) => {
  const client = getPool();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const transaction = async (callback) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { query, transaction, getPool };
