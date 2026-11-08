const defaultDb = require('../config/db');

class UserRepository {
  constructor(db = defaultDb) {
    this.db = db;
  }

  async findByEmail(email) {
    const result = await this.db.query(
      'SELECT id, name, email, password, role, created_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id) {
    const result = await this.db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create({ name, email, password, role = 'patient' }) {
    const result = await this.db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase(), password, role]
    );
    return result.rows[0];
  }
}

module.exports = UserRepository;
