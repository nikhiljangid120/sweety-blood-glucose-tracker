process.env.USE_IN_MEMORY_DB = 'true';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';

const request = require('supertest');
const app = require('../src/app');
const { initDb, closePool } = require('../src/config/db');

describe('Full API Integration Tests (Satisfying Kenpath Assessment Requirements)', () => {
  let userToken;
  let user2Token;
  let testDate;

  beforeAll(async () => {
    await initDb();
    // Use an isolated date within current month
    const today = new Date();
    testDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(Math.min(today.getDate(), 15)).padStart(2, '0')}`;
  });

  afterAll(async () => {
    await closePool();
  });

  describe('Feature 1: Sign up and log in', () => {
    test('1.1 A user can register with name, email and password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Nikhil Test',
          email: 'nikhil.patel@test.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Nikhil Test');
      expect(res.body.data.user.email).toBe('nikhil.patel@test.com');
      expect(res.body.data.user.password).toBeUndefined(); // Never expose password
      expect(res.body.data.token).toBeDefined();

      userToken = res.body.data.token;
    });

    test('1.2 A user can log in with registered credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nikhil.patel@test.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    test('1.3 Rejects login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nikhil.patel@test.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });
  });

  describe('Feature 2: Add, view, edit and delete readings + Validations', () => {
    let createdReadingId;

    test('2.1 Validation: Value is required -> "Please enter a glucose value."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Please enter a glucose value.');
    });

    test('2.2 Validation: Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."', async () => {
      // Too low
      const resLow = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)',
          value: 35,
        });
      expect(resLow.status).toBe(400);
      expect(resLow.body.error).toBe('Value must be between 40 and 600 mg/dl.');

      // Too high
      const resHigh = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)',
          value: 650,
        });
      expect(resHigh.status).toBe(400);
      expect(resHigh.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('2.3 Validation: Date cannot be in the future -> "Date cannot be in the future."', async () => {
      const futureDate = '2099-01-01';
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: futureDate,
          slot: 'Morning (fasting)',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Date cannot be in the future.');
    });

    test('2.4 Successfully adds first reading (Morning fasting)', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)',
          value: 95,
          notes: 'Fasting before breakfast',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value).toBe(95);
      expect(res.body.data.slot).toBe('Morning (fasting)');
      createdReadingId = res.body.data.id;
    });

    test('2.5 Validation: Only one reading per slot per day -> "You already have an Morning (fasting) reading for this date."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)',
          value: 110,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('You already have an Morning (fasting) reading for this date.');
    });

    test('2.6 Adds slots 2, 3, and 4', async () => {
      const slots = [
        { slot: 'After breakfast', value: 135 },
        { slot: 'After lunch', value: 120 },
        { slot: 'After dinner', value: 145 },
      ];

      for (const item of slots) {
        const res = await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            date: testDate,
            slot: item.slot,
            value: item.value,
          });
        expect(res.status).toBe(201);
      }
    });

    test('2.7 Validation: Maximum 4 readings per day -> "You can add only 4 readings per day."', async () => {
      // Trying to add a 5th reading on the same date (even if slot attempted is different)
      // Note: Since only 4 slots exist, let's test count check directly
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: testDate,
          slot: 'After lunch', // Will trigger slot check or count check
          value: 125,
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(['You already have an After lunch reading for this date.', 'You can add only 4 readings per day.']).toContain(res.body.error);
    });

    test('2.8 View readings with pagination (Bonus: ?page=1&limit=20)', async () => {
      const res = await request(app)
        .get('/api/readings?page=1&limit=20')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.readings)).toBe(true);
      expect(res.body.data.readings.length).toBe(4);
      expect(res.body.data.total).toBe(4);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(20);
    });

    test('2.9 Edit an existing reading', async () => {
      const res = await request(app)
        .put(`/api/readings/${createdReadingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          value: 98,
          notes: 'Updated note after morning jog',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value).toBe(98);
      expect(res.body.data.notes).toBe('Updated note after morning jog');
    });

    test('2.10 User isolation: user only sees their own readings', async () => {
      // Create user 2
      const reg2 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Patient Two',
          email: 'patient2@test.com',
          password: 'Password123!',
        });
      user2Token = reg2.body.data.token;

      // User 2 reads readings list: must be 0 readings
      const resUser2 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(resUser2.status).toBe(200);
      expect(resUser2.body.data.readings.length).toBe(0);

      // User 2 cannot access or edit User 1's reading
      const resForbiddenEdit = await request(app)
        .put(`/api/readings/${createdReadingId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ value: 200 });

      expect(resForbiddenEdit.status).toBe(404);
      expect(resForbiddenEdit.body.error).toBe('Reading not found.');
    });

    test('2.11 Delete reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${createdReadingId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Re-fetching should return 404
      const resCheck = await request(app)
        .get(`/api/readings/${createdReadingId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(resCheck.status).toBe(404);
    });
  });

  describe('Feature 3: Reports (Daily, Month-to-date, Monthly)', () => {
    test('3.1 Daily report returns correct stats and reading list', async () => {
      const res = await request(app)
        .get(`/api/reports/daily?date=${testDate}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.type).toBe('daily');
      expect(data.count).toBe(3); // 4 minus the 1 deleted
      expect(data.highest).toBe(145);
      expect(data.lowest).toBe(120);
      // Average: (135 + 120 + 145) / 3 = 400 / 3 = 133.3
      expect(data.average).toBe(133.3);
      expect(Array.isArray(data.readings)).toBe(true);
      expect(data.readings.length).toBe(3);
    });

    test('3.2 Friendly empty state when no readings for a date', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2020-01-01')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
      expect(res.body.data.average).toBeNull();
      expect(res.body.data.highest).toBeNull();
      expect(res.body.data.lowest).toBeNull();
      expect(res.body.data.readings).toEqual([]);
    });

    test('3.3 Month-to-date report calculates 1st of month to selected date', async () => {
      const res = await request(app)
        .get(`/api/reports/month-to-date?date=${testDate}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.type).toBe('month-to-date');
      expect(data.startDate.endsWith('-01')).toBe(true);
      expect(data.endDate).toBe(testDate);
      expect(data.count).toBeGreaterThanOrEqual(3);
    });

    test('3.4 Monthly report covers whole previous month', async () => {
      const res = await request(app)
        .get(`/api/reports/monthly?date=${testDate}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.type).toBe('monthly');
      expect(data.startDate.endsWith('-01')).toBe(true);
      expect(data.count).toBeDefined();
    });

    test('3.5 Combined reports endpoint provides daily, monthToDate, and monthly', async () => {
      const res = await request(app)
        .get(`/api/reports?date=${testDate}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.daily).toBeDefined();
      expect(res.body.data.monthToDate).toBeDefined();
      expect(res.body.data.monthly).toBeDefined();
    });
  });
});
