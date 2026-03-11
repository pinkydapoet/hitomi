// backend/models/Order.js
const db = require('../config/db');

class Order {
  static async create({ userId, subtotal, shipping, import_charges, discount, total, coupon_code, shipping_address, items }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO orders (user_id, subtotal, shipping, import_charges, discount, total, coupon_code, shipping_address)
         VALUES (?,?,?,?,?,?,?,?)`,
        [userId, subtotal, shipping, import_charges, discount, total, coupon_code || null, shipping_address || null]
      );
      const orderId = result.insertId;

      for (const item of items) {
        await conn.query(
          'INSERT INTO order_items (order_id, product_id, quantity, size, price) VALUES (?,?,?,?,?)',
          [orderId, item.product_id, item.quantity, item.size || 'US 8', item.price]
        );
      }

      if (coupon_code) {
        await conn.query('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [coupon_code]);
      }

      await conn.commit();
      return orderId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getByUser(userId) {
    const [orders] = await db.query(
      `SELECT o.*, COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return orders;
  }

  static async getById(orderId, userId) {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id=? AND user_id=? LIMIT 1', [orderId, userId]);
    if (!order) return null;

    const [items] = await db.query(
      `SELECT oi.*, p.name, p.image_url, p.brand
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    return { ...order, items };
  }

  static async validateCoupon(code) {
    const [[coupon]] = await db.query(
      'SELECT * FROM coupons WHERE code=? AND is_active=1 AND (expires_at IS NULL OR expires_at > NOW()) AND used_count < max_uses LIMIT 1',
      [code]
    );
    return coupon || null;
  }
}

module.exports = Order;