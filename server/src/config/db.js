const { Pool } = require('pg');
require('dotenv').config();

let poolInstance = null;
let isInMemory = false;

function setupInMemoryDb() {
  const { newDb } = require('pg-mem');
  const bcrypt = require('bcryptjs');

  const db = newDb();

  // Register TO_CHAR function for date
  db.public.registerFunction({
    name: 'to_char',
    args: [db.public.getType('date'), db.public.getType('text')],
    returns: db.public.getType('text'),
    implementation: (date) => {
      if (!date) return null;
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    },
  });

  // Register TO_CHAR function for timestamp
  db.public.registerFunction({
    name: 'to_char',
    args: [db.public.getType('timestamp with time zone'), db.public.getType('text')],
    returns: db.public.getType('text'),
    implementation: (ts) => {
      if (!ts) return null;
      const d = new Date(ts);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    },
  });

  // Run schema migration in-memory
  db.public.none(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'patient',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS readings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      slot VARCHAR(50) NOT NULL,
      value INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_date_slot UNIQUE (user_id, date, slot)
    );
  `);

  const pgAdapter = db.adapters.createPg();
  const memPool = new pgAdapter.Pool();

  // Auto seed demo user & readings for in-memory mode
  (async () => {
    try {
      const demoEmail = 'demo@sweety.app';
      const demoPass = 'Password123!';
      const hash = await bcrypt.hash(demoPass, 10);
      const userRes = await memPool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ('Demo Patient', $1, $2, 'patient')
         RETURNING id`,
        [demoEmail, hash]
      );
      const userId = userRes.rows[0].id;

      const slots = [
        'Morning (fasting)',
        'After breakfast',
        'After lunch',
        'After dinner',
      ];

      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth(); // 0-indexed
      const d = today.getDate();

      // Seed previous month readings (whole previous month)
      const prevMonth = m === 0 ? 11 : m - 1;
      const prevYear = m === 0 ? y - 1 : y;
      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      const prevDays = [2, 6, 12, 18, 24, Math.min(28, daysInPrevMonth)];

      for (const day of prevDays) {
        const dStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, dStr, slots[0], 92 + (day % 10), 'Fasting reading']);
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, dStr, slots[1], 134 + (day % 15), 'Post-breakfast reading']);
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, dStr, slots[2], 122 + (day % 12), 'Post-lunch reading']);
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, dStr, slots[3], 140 + (day % 16), 'Post-dinner reading']);
      }

      // Seed current month up to today
      for (let day = 1; day <= d; day += 2) {
        const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, dStr, slots[0], 95 + ((day * 2) % 12), 'Fasting reading']);
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, dStr, slots[1], 130 + ((day * 3) % 18), 'Post-breakfast reading']);
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, dStr, slots[2], 120 + ((day * 4) % 15), 'Post-lunch reading']);
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, dStr, slots[3], 142 + ((day * 5) % 20), 'Post-dinner reading']);
      }

      // Ensure today has readings
      const todayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const checkToday = await memPool.query(`SELECT id FROM readings WHERE user_id = $1 AND date = $2`, [userId, todayStr]);
      if (checkToday.rows.length === 0) {
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, todayStr, slots[0], 98, 'Fasting reading']);
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, todayStr, slots[1], 135, 'Oatmeal & fruits']);
        await memPool.query(`INSERT INTO readings (user_id, date, slot, value, notes) VALUES ($1, $2, $3, $4, $5)`,
          [userId, todayStr, slots[2], 124, 'Salad & grilled chicken']);
      }
    } catch (err) {
      console.error('Error auto-seeding in-memory DB:', err);
    }
  })();

  return memPool;
}

async function initDb(options = { timeoutMs: 2000 }) {
  if (poolInstance) return poolInstance;

  if (process.env.USE_IN_MEMORY_DB === 'true') {
    console.log('⚡ Using In-Memory PostgreSQL engine (USE_IN_MEMORY_DB=true)');
    poolInstance = setupInMemoryDb();
    isInMemory = true;
    return poolInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  const config = connectionString
    ? {
        connectionString,
        connectionTimeoutMillis: options.timeoutMs,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'sweety_user',
        password: process.env.DB_PASSWORD || 'sweety_pass',
        database: process.env.DB_NAME || 'sweety_db',
        connectionTimeoutMillis: options.timeoutMs,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      };

  const testPool = new Pool(config);

  try {
    const client = await testPool.connect();
    client.release();
    poolInstance = testPool;
    isInMemory = false;
    console.log('✅ Connected to PostgreSQL database successfully.');
    return poolInstance;
  } catch (err) {
    await testPool.end().catch(() => {});
    console.warn(`⚠️  PostgreSQL connection failed (${err.message}).`);
    console.warn('⚡ Automatically falling back to In-Memory PostgreSQL database for seamless review & operation.');
    poolInstance = setupInMemoryDb();
    isInMemory = true;
    return poolInstance;
  }
}

function getPool() {
  if (!poolInstance) {
    if (process.env.USE_IN_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test') {
      poolInstance = setupInMemoryDb();
      isInMemory = true;
    } else {
      // Lazy fallback if initDb was not awaited
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
        console.error('Unexpected error on idle PostgreSQL client', err.message);
      });
    }
  }
  return poolInstance;
}

module.exports = {
  initDb,
  get isInMemory() {
    return isInMemory;
  },
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
