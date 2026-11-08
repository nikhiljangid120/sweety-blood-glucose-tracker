const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seeding...');
    await client.query('BEGIN');

    // 1. Ensure tables exist
    await client.query(`
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

    // 2. Clear existing demo data or upsert
    const demoEmail = 'demo@sweety.app';
    const demoPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    const userRes = await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) 
       DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name
       RETURNING id, name, email`,
      ['Demo Patient', demoEmail, hashedPassword, 'patient']
    );

    const demoUser = userRes.rows[0];
    console.log(`👤 Demo User ready: ${demoUser.email} (ID: ${demoUser.id})`);

    // Clear previous readings for this demo user to prevent duplicates during re-seeding
    await client.query('DELETE FROM readings WHERE user_id = $1', [demoUser.id]);

    // 3. Generate sample readings
    // Let's create readings across current month and previous month
    const slots = [
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner',
    ];

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentDay = today.getDate();

    const sampleReadings = [];

    // Readings for previous month (e.g., 5 distinct days with 4 readings each)
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();
    const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const prevDaysToSeed = [1, 5, 12, 18, 25, Math.min(28, lastDayOfPrevMonth)];
    for (const d of prevDaysToSeed) {
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      sampleReadings.push(
        { date: dateStr, slot: slots[0], value: 92 + (d % 8), notes: 'Good fasting level' },
        { date: dateStr, slot: slots[1], value: 135 + (d % 15), notes: 'Oatmeal & berries' },
        { date: dateStr, slot: slots[2], value: 124 + (d % 12), notes: 'Salad with grilled chicken' },
        { date: dateStr, slot: slots[3], value: 142 + (d % 18), notes: 'Brown rice bowl' }
      );
    }

    // Readings for current month up to today
    // Seed 1st of month, 3rd, 5th, etc., up to currentDay
    for (let day = 1; day <= currentDay; day += 2) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      sampleReadings.push(
        { date: dateStr, slot: slots[0], value: 95 + ((day * 3) % 15), notes: 'Fasting reading' },
        { date: dateStr, slot: slots[1], value: 128 + ((day * 4) % 20), notes: 'Post breakfast' },
        { date: dateStr, slot: slots[2], value: 118 + ((day * 2) % 18), notes: 'Post lunch' },
        { date: dateStr, slot: slots[3], value: 138 + ((day * 5) % 22), notes: 'Post dinner' }
      );
    }

    // Ensure today always has readings if not already added
    const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    const todayExists = sampleReadings.some((r) => r.date === todayStr);
    if (!todayExists) {
      sampleReadings.push(
        { date: todayStr, slot: slots[0], value: 98, notes: 'Woke up at 7am' },
        { date: todayStr, slot: slots[1], value: 132, notes: 'Eggs and avocado toast' },
        { date: todayStr, slot: slots[2], value: 120, notes: 'Grilled salmon & greens' },
        { date: todayStr, slot: slots[3], value: 145, notes: 'Light vegetable soup' }
      );
    }

    // Insert all readings
    for (const r of sampleReadings) {
      await client.query(
        `INSERT INTO readings (user_id, date, slot, value, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, date, slot) DO NOTHING`,
        [demoUser.id, r.date, r.slot, r.value, r.notes]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${sampleReadings.length} readings for demo user!`);
    console.log(`🔑 Demo credentials:`);
    console.log(`   Email: ${demoEmail}`);
    console.log(`   Password: ${demoPassword}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
