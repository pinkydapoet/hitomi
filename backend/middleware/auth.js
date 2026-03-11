// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7)
    : req.cookies?.token;

  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'hitomi_secret');
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7)
    : req.cookies?.token;

  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'hitomi_secret'); } catch (_) {}
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

module.exports = { auth, optionalAuth, adminOnly };