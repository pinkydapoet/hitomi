// backend/models/Cart.js
const db = require('../config/db');

class Cart {
  static async getByUser(userId) {
    const [rows] = await db.query(
      `SELECT ci.id, ci.quantity, ci.size,
              p.id AS product_id, p.name, p.price, p.original_price, p.image_url, p.brand
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.added_at DESC`,
      [userId]
    );
    return rows;
  }

  static async addItem(userId, productId, quantity = 1, size = 'US 8') {
    await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity, size)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [userId, productId, quantity, size, quantity]
    );
  }

  static async updateQuantity(cartItemId, userId, quantity) {
    if (quantity <= 0) return Cart.removeItem(cartItemId, userId);
    await db.query('UPDATE cart_items SET quantity=? WHERE id=? AND user_id=?', [quantity, cartItemId, userId]);
  }

  static async removeItem(cartItemId, userId) {
    await db.query('DELETE FROM cart_items WHERE id=? AND user_id=?', [cartItemId, userId]);
  }

  static async clearCart(userId) {
    await db.query('DELETE FROM cart_items WHERE user_id=?', [userId]);
  }

  static async countItems(userId) {
    const [[{ total }]] = await db.query('SELECT COALESCE(SUM(quantity),0) AS total FROM cart_items WHERE user_id=?', [userId]);
    return total;
  }
}

module.exports = Cart;