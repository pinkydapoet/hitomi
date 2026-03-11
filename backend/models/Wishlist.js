// backend/models/Wishlist.js
const db = require('../config/db');

class Wishlist {
  static async getByUser(userId) {
    const [rows] = await db.query(
      `SELECT wi.id, wi.added_at,
              p.id AS product_id, p.name, p.price, p.original_price, p.image_url, p.brand, p.rating
       FROM wishlist_items wi
       JOIN products p ON p.id = wi.product_id
       WHERE wi.user_id = ?
       ORDER BY wi.added_at DESC`,
      [userId]
    );
    return rows;
  }

  static async add(userId, productId) {
    await db.query('INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (?,?)', [userId, productId]);
  }

  static async remove(userId, productId) {
    await db.query('DELETE FROM wishlist_items WHERE user_id=? AND product_id=?', [userId, productId]);
  }

  static async isInWishlist(userId, productId) {
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM wishlist_items WHERE user_id=? AND product_id=?', [userId, productId]);
    return cnt > 0;
  }

  static async getProductIds(userId) {
    const [rows] = await db.query('SELECT product_id FROM wishlist_items WHERE user_id=?', [userId]);
    return new Set(rows.map(r => r.product_id));
  }
}

module.exports = Wishlist;