// backend/models/Product.js
const db = require('../config/db');

class Product {
  static async getAll({ cat, sort, q, limit, offset, isAdmin } = {}) {
    let sql = `
      SELECT p.*, c.slug AS category_slug, c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdmin) sql += ' AND p.is_active = 1';

    if (cat && cat !== 'all') {
      if (cat === 'sale') {
        sql += ' AND p.original_price IS NOT NULL';
      } else if (['men', 'women'].includes(cat)) {
        sql += ' AND c.slug = ?';
        params.push(cat);
      } else {
        sql += ' AND LOWER(p.brand) = ?';
        params.push(cat.toLowerCase());
      }
    }

    if (q) {
      sql += ' AND (LOWER(p.name) LIKE ? OR LOWER(p.brand) LIKE ?)';
      params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
    }

    const sortMap = {
      'price-asc':  'p.price ASC',
      'price-desc': 'p.price DESC',
      'rating':     'p.rating DESC',
      'name':       'p.name ASC',
      'default':    'p.id ASC',
    };
    sql += ` ORDER BY ${sortMap[sort] || 'p.id ASC'}`;

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(Number(offset));
      }
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, c.slug AS category_slug, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ name, description, price, original_price, image_url, category_id, brand, rating, stock }) {
    const [result] = await db.query(
      `INSERT INTO products (name, description, price, original_price, image_url, category_id, brand, rating, stock)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [name, description, price, original_price || null, image_url, category_id, brand, rating || 4.5, stock || 100]
    );
    return result.insertId;
  }

  static async update(id, fields) {
    const allowed = ['name','description','price','original_price','image_url','category_id','brand','rating','stock','is_active'];
    const sets = Object.keys(fields).filter(k => allowed.includes(k)).map(k => `${k}=?`);
    const vals = Object.keys(fields).filter(k => allowed.includes(k)).map(k => fields[k]);
    if (!sets.length) return;
    await db.query(`UPDATE products SET ${sets.join(',')} WHERE id=?`, [...vals, id]);
  }

  static async count({ cat, q, isAdmin } = {}) {
    let sql = 'SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id=p.category_id WHERE 1=1';
    const params = [];
    
    if (!isAdmin) sql += ' AND p.is_active = 1';

    if (cat && cat !== 'all') {
      if (cat === 'sale') sql += ' AND p.original_price IS NOT NULL';
      else if (['men','women'].includes(cat)) { sql += ' AND c.slug=?'; params.push(cat); }
      else { sql += ' AND LOWER(p.brand)=?'; params.push(cat); }
    }
    if (q) { sql += ' AND (LOWER(p.name) LIKE ? OR LOWER(p.brand) LIKE ?)'; params.push(`%${q}%`,`%${q}%`); }
    
    const [[{ total }]] = await db.query(sql, params);
    return total;
  }
}

module.exports = Product;