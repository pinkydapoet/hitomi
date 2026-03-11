// backend/controllers/wishlistController.js
const Wishlist = require('../models/Wishlist');
const { AppError } = require('../middleware/errorHandler');

exports.getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.getByUser(req.user.id);
    res.json({ success: true, items });
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) throw new AppError('product_id is required.', 400);

    await Wishlist.add(req.user.id, product_id);
    const items = await Wishlist.getByUser(req.user.id);
    res.json({ success: true, message: 'Added to wishlist.', items });
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    await Wishlist.remove(req.user.id, req.params.productId);
    const items = await Wishlist.getByUser(req.user.id);
    res.json({ success: true, message: 'Removed from wishlist.', items });
  } catch (err) { next(err); }
};