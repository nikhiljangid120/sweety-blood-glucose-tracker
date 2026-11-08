const defaultDb = require('../config/db');

class ReadingRepository {
  constructor(db = defaultDb) {
    this.db = db;
  }

  async create({ userId, date, slot, value, notes = null }) {
    const result = await this.db.query(
      `INSERT INTO readings (user_id, date, slot, value, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, notes, created_at, updated_at`,
      [userId, date, slot, value, notes]
    );
    return result.rows[0];
  }

  async findById(id) {
    const result = await this.db.query(
      `SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, notes, created_at, updated_at
       FROM readings
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdAndUser(id, userId) {
    const result = await this.db.query(
      `SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, notes, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  async findByUserAndDate(userId, date) {
    const result = await this.db.query(
      `SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, notes, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND date = $2
       ORDER BY 
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC, id ASC`,
      [userId, date]
    );
    return result.rows;
  }

  async findSlotConflict(userId, date, slot, excludeReadingId = null) {
    let query = `
      SELECT id, slot, TO_CHAR(date, 'YYYY-MM-DD') AS date 
      FROM readings 
      WHERE user_id = $1 AND date = $2 AND slot = $3
    `;
    const params = [userId, date, slot];

    if (excludeReadingId) {
      query += ` AND id != $4`;
      params.push(excludeReadingId);
    }

    const result = await this.db.query(query, params);
    return result.rows[0] || null;
  }

  async countByUserAndDate(userId, date, excludeReadingId = null) {
    let query = `
      SELECT COUNT(*)::INTEGER AS count
      FROM readings
      WHERE user_id = $1 AND date = $2
    `;
    const params = [userId, date];

    if (excludeReadingId) {
      query += ` AND id != $3`;
      params.push(excludeReadingId);
    }

    const result = await this.db.query(query, params);
    return result.rows[0].count;
  }

  async findAllByUser(userId, { page = 1, limit = 20, date = null, sort = 'DESC' } = {}) {
    const offset = (page - 1) * limit;
    const params = [userId];
    let whereClause = `WHERE user_id = $1`;

    if (date) {
      params.push(date);
      whereClause += ` AND date = $${params.length}`;
    }

    const countQuery = `SELECT COUNT(*)::INTEGER AS total FROM readings ${whereClause}`;
    const countResult = await this.db.query(countQuery, params);
    const total = countResult.rows[0].total;

    params.push(limit, offset);
    const dataQuery = `
      SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, notes, created_at, updated_at
      FROM readings
      ${whereClause}
      ORDER BY date ${sort === 'ASC' ? 'ASC' : 'DESC'},
        CASE slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ${sort === 'ASC' ? 'ASC' : 'DESC'}, id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const dataResult = await this.db.query(dataQuery, params);

    return {
      readings: dataResult.rows,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByUserAndDateRange(userId, startDate, endDate) {
    const result = await this.db.query(
      `SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, notes, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC,
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC, id ASC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }

  async update(id, userId, { date, slot, value, notes }) {
    const result = await this.db.query(
      `UPDATE readings
       SET date = $1, slot = $2, value = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, slot, value, notes, created_at, updated_at`,
      [date, slot, value, notes, id, userId]
    );
    return result.rows[0] || null;
  }

  async delete(id, userId) {
    const result = await this.db.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );
    return result.rowCount > 0;
  }
}

module.exports = ReadingRepository;
