// backend/controllers/orderController.js
const Order    = require('../models/Order');
const Cart     = require('../models/Cart');
const User     = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

const SHIPPING       = 40.00;
const IMPORT_CHARGES = 128.00;

exports.checkout = async (req, res, next) => {
  try {
    const { coupon_code } = req.body;
    const userId = req.user.id;

    const cartItems = await Cart.getByUser(userId);
    if (!cartItems.length) throw new AppError('Your cart is empty.', 400);

    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    let discount = 0;
    let validCoupon = null;
    if (coupon_code) {
      validCoupon = await Order.validateCoupon(coupon_code);
      if (!validCoupon) throw new AppError('Invalid or expired coupon code.', 400);
      if (validCoupon.discount_type === 'percent') {
        discount = +(subtotal * validCoupon.discount_value / 100).toFixed(2);
      } else {
        discount = validCoupon.discount_value;
      }
    }

    const total = +(subtotal + SHIPPING + IMPORT_CHARGES - discount).toFixed(2);
    const userProfile = await User.findById(userId);
    const shippingAddress = userProfile ? `${userProfile.street}, ${userProfile.city} ${userProfile.zip}, ${userProfile.country}` : null;

    const orderId = await Order.create({
      userId, subtotal: +subtotal.toFixed(2), shipping: SHIPPING, import_charges: IMPORT_CHARGES,
      discount, total, coupon_code: validCoupon?.code || null, shipping_address: shippingAddress,
      items: cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, size: i.size, price: i.price }))
    });

    await Cart.clearCart(userId);
    const order = await Order.getById(orderId, userId);
    
    res.status(201).json({ success: true, message: 'Order placed successfully! 🎉', order });
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.getByUser(req.user.id);
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.getById(req.params.id, req.user.id);
    if (!order) throw new AppError('Order not found.', 404);
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) throw new AppError('Coupon code is required.', 400);

    const coupon = await Order.validateCoupon(code);
    if (!coupon) throw new AppError('Invalid or expired coupon code.', 400);

    res.json({
      success: true,
      message: `Coupon applied! ${coupon.discount_value}${coupon.discount_type === 'percent' ? '%' : '$'} off.`,
      coupon: { code: coupon.code, discount_type: coupon.discount_type, discount_value: coupon.discount_value }
    });
  } catch (err) { next(err); }
};