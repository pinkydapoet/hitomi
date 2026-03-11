// backend/models/User.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.dob, u.role, u.created_at,
              a.street, a.city, a.zip, a.country
       FROM users u
       LEFT JOIN addresses a ON a.user_id = u.id AND a.is_default = 1
       WHERE u.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ first_name, last_name, email, password }) {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (first_name, last_name, email, password) VALUES (?,?,?,?)',
      [first_name, last_name || '', email, hashed]
    );
    return result.insertId;
  }

  static async updateProfile(id, { first_name, last_name, phone, dob }) {
    await db.query(
      'UPDATE users SET first_name=?, last_name=?, phone=?, dob=? WHERE id=?',
      [first_name, last_name, phone || null, dob || null, id]
    );
  }

  static async upsertAddress(userId, { street, city, zip, country }) {
    const [rows] = await db.query('SELECT id FROM addresses WHERE user_id=? AND is_default=1 LIMIT 1', [userId]);
    if (rows.length > 0) {
      await db.query(
        'UPDATE addresses SET street=?, city=?, zip=?, country=? WHERE id=?',
        [street, city, zip, country, rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO addresses (user_id, street, city, zip, country) VALUES (?,?,?,?,?)',
        [userId, street, city, zip, country]
      );
    }
  }

  static async updatePassword(id, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password=? WHERE id=?', [hashed, id]);
  }

  static async verifyPassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}

module.exports = User;