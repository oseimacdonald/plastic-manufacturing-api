const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger/swaggerConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------
// Middleware
// -----------------------
app.use(express.json());

// -----------------------
// Database connection
// -----------------------
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plastic-manufacturing')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.log('⚠️ Test mode: skipping MongoDB connection');
}

// -----------------------
// OAuth Configuration
// -----------------------
try {
  require('./config/oauth')(app);
} catch (err) {
  console.warn('⚠️ OAuth config not found, running without authentication');
  app.use((req, res, next) => {
    req.isAuthenticated = () => false;
    next();
  });
}

// -----------------------
// Mock authentication for tests
// -----------------------
if (process.env.NODE_ENV === 'test') {
  app.use((req, res, next) => {
    if (req.headers['x-test-auth'] === 'true') {
      req.isAuthenticated = () => true;
      req.user = { displayName: 'Test User', emails: [{ value: 'test@example.com' }] };
    } else {
      req.isAuthenticated = () => false;
      req.user = null;
    }
    next();
  });
}

// -----------------------
// Swagger Documentation
// -----------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// -----------------------
// Home route
// -----------------------
app.get('/', (req, res) => {
  res.json({
    message: 'Plastic Manufacturing API - Visit /api-docs for documentation',
    endpoints: {
      machines: '/machines',
      productionRuns: '/production-runs',
      employees: '/employees',
      qualityChecks: '/quality-checks',
      auth: '/auth/google',
      documentation: '/api-docs'
    },
    authentication: req.isAuthenticated?.() ? {
      authenticated: true,
      user: req.user
    } : {
      authenticated: false,
      message: 'Visit /auth/google to authenticate'
    }
  });
});

// -----------------------
// Routes
// -----------------------
try {
  app.use('/machines', require('./routes/machines'));
  app.use('/production-runs', require('./routes/productionRuns'));
  console.log('✅ Machine and ProductionRun routes loaded');
} catch (err) {
  console.warn('⚠️ Machine/ProductionRun routes missing:', err.message);
}

try {
  app.use('/auth', require('./routes/auth'));
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.warn('⚠️ Auth routes missing:', err.message);
}

try {
  app.use('/employees', require('./routes/employees'));
  app.use('/quality-checks', require('./routes/qualityChecks'));
  console.log('✅ Employee and QualityCheck routes loaded');
} catch (err) {
  console.warn('⚠️ Employee/QualityCheck routes missing:', err.message);
}

// -----------------------
// 404 handler
// -----------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: ['/machines', '/production-runs', '/employees', '/quality-checks', '/api-docs']
  });
});

// -----------------------
// Error handler
// -----------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// -----------------------
// Start server (skip in test mode)
// -----------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📄 API docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
