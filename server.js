const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { initializeFirebase } = require('./config/firebase');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const referralRoutes = require('./routes/referral');
const coinsRoutes = require('./routes/coins');
const transactionRoutes = require('./routes/transactions');
const reviewsRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

// Initialize Firebase
initializeFirebase();

const app = express();
const PORT = process.env.PORT || 3000;

// HTTPS redirect middleware (for production)
const enforceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

// Middleware
app.use(enforceHTTPS);
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/referral', referralRoutes);
app.use('/api/coins', coinsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);

// Referrals list route (separate from referral to avoid conflicts)
app.use('/api/referrals', referralRoutes);

// Referral redirect route (outside /api)
app.use('/', referralRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Domain: ${process.env.DOMAIN}`);
});

module.exports = app;