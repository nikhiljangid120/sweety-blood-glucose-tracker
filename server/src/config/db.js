const { Pool } = require('pg');
require('dotenv').config();

let poolInstance = null;

function getPool() {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    poolInstance = connectionString
      ? new Pool({
          connectionString,
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        })
      : new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          user: process.env.DB_USER || 'sweety_user',
          password: process.env.DB_PASSWORD || 'sweety_pass',
          database: process.env.DB_NAME || 'sweety_db',
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return poolInstance;
}

module.exports = {
  get pool() {
    return getPool();
  },
  query: (text, params) => getPool().query(text, params),
  getClient: () => getPool().connect(),
  closePool: async () => {
    if (poolInstance) {
      await poolInstance.end();
      poolInstance = null;
    }
  },
};
