// backend/controllers/productController.js
const Product    = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

exports.getAll = async (req, res, next) => {
  try {
    const { cat, sort, q, limit = 50, offset = 0 } = req.query;
    const isAdmin = req.user?.role === 'admin';

    const [products, total] = await Promise.all([
      Product.getAll({ cat, sort, q, limit, offset, isAdmin }),
      Product.count({ cat, q, isAdmin }),
    ]);
    res.json({ success: true, total, products });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found.', 404);
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, price, original_price, image_url, category_id, brand, rating, stock } = req.body;
    if (!name || !price || !category_id) throw new AppError('Name, price and category_id are required.', 400);

    const id = await Product.create({ name, description, price, original_price, image_url, category_id, brand, rating, stock });
    const product = await Product.findById(id);
    res.status(201).json({ success: true, message: 'Product created.', product });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    await Product.update(req.params.id, req.body);
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found.', 404);
    res.json({ success: true, message: 'Product updated.', product });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Product.update(req.params.id, { is_active: 0 });
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (err) { next(err); }
};