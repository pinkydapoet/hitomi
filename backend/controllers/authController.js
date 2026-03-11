// backend/controllers/authController.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET || 'hitomi_secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

exports.register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!first_name || !email || !password) throw new AppError('first_name, email and password are required.', 400);
    if (password.length < 6) throw new AppError('Password must be at least 6 characters.', 400);

    const existing = await User.findByEmail(email);
    if (existing) throw new AppError('Email already registered.', 409);

    const userId = await User.create({ first_name, last_name, email, password });
    const newUser = await User.findById(userId);
    const token   = signToken(newUser);

    res.status(201).json({
      success: true, message: 'Account created successfully!', token,
      user: { id: newUser.id, first_name: newUser.first_name, last_name: newUser.last_name, email: newUser.email, role: newUser.role },
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required.', 400);

    const user = await User.findByEmail(email);
    if (!user) throw new AppError('Invalid email or password.', 401);

    const match = await User.verifyPassword(password, user.password);
    if (!match) throw new AppError('Invalid email or password.', 401);

    const token = signToken(user);
    res.json({
      success: true, message: 'Login successful!', token,
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role },
    });
  } catch (err) { next(err); }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found.', 404);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};