// backend/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// global error handling so server exits cleanly on unexpected issues
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Promise Rejection:', reason);
  // application specific logging, clean up, etc. here
});
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  process.exit(1);
});

const { errorHandler } = require('./middleware/errorHandler');

const authRoutes     = require('./routes/authRoutes');
const productRoutes  = require('./routes/productRoutes');
const cartRoutes     = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const userRoutes     = require('./routes/userRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/user',     userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

app.use(errorHandler);

// start server and gracefully handle common failures
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// handle listen errors (port in use, permissions, etc.)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. ` +
      `Make sure no other process is listening on this port or set a different PORT in your .env.`);
  } else if (err.code === 'EACCES') {
    console.error(`❌ Permission denied when trying to bind to port ${PORT}. ` +
      `Try a higher port number or run with appropriate privileges.`);
  } else {
    console.error('❌ Server encountered an error:', err);
  }
  process.exit(1);
});
