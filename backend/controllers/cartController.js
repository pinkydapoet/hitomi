// backend/controllers/cartController.js
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

exports.getCart = async (req, res, next) => {
  try {
    const items = await Cart.getByUser(req.user.id);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ success: true, items, subtotal: +subtotal.toFixed(2) });
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { product_id, quantity = 1, size = 'US 8' } = req.body;
    if (!product_id) throw new AppError('product_id is required.', 400);

    const product = await Product.findById(product_id);
    if (!product) throw new AppError('Product not found.', 404);

    await Cart.addItem(req.user.id, product_id, quantity, size);
    const items = await Cart.getByUser(req.user.id);
    res.json({ success: true, message: 'Item added to cart.', items });
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity == null) throw new AppError('quantity is required.', 400);

    await Cart.updateQuantity(req.params.id, req.user.id, quantity);
    const items = await Cart.getByUser(req.user.id);
    res.json({ success: true, message: 'Cart updated.', items });
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    await Cart.removeItem(req.params.id, req.user.id);
    const items = await Cart.getByUser(req.user.id);
    res.json({ success: true, message: 'Item removed.', items });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.clearCart(req.user.id);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) { next(err); }
};