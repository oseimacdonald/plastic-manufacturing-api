const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger/swaggerConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------
// 1. BASIC MIDDLEWARE
// -------------------------------------------------------
app.use(express.json());

// -------------------------------------------------------
// 2. DATABASE CONNECTION (skip in tests)
// -------------------------------------------------------
if (process.env.NODE_ENV === 'test') {
  console.log('Test mode: Skipping MongoDB connection');
} else {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plastic-manufacturing')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// -------------------------------------------------------
// 3. LOAD OAUTH BEFORE AUTH ROUTES
// -------------------------------------------------------
try {
  console.log('Loading OAuth configuration...');
  require('./config/oauth')(app);
  console.log('OAuth configuration loaded successfully');
} catch (error) {
  console.warn('OAuth config not found, running without authentication.');
  app.use((req, res, next) => {
    req.isAuthenticated = () => false;
    next();
  });
}

// -------------------------------------------------------
// 4. MOCK AUTH IN TEST MODE
// -------------------------------------------------------
if (process.env.NODE_ENV === 'test') {
  console.log('Test mode: Setting up mock authentication middleware');
  app.use((req, res, next) => {
    if (req.headers['x-test-auth'] === 'true') {
      req.isAuthenticated = () => true;
      req.user = {
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }]
      };
    } else {
      req.isAuthenticated = () => false;
      req.user = null;
    }
    next();
  });
}

// -------------------------------------------------------
// 5. SWAGGER DOCUMENTATION
// -------------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// -------------------------------------------------------
// 6. ROOT ENDPOINT
// -------------------------------------------------------
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
    authentication: req.isAuthenticated ? (req.isAuthenticated() ? {
      authenticated: true,
      user: {
        displayName: req.user?.displayName,
        email: req.user?.emails?.[0]?.value
      }
    } : {
      authenticated: false,
      message: 'Visit /auth/google to authenticate'
    }) : {
      authenticated: false,
      message: 'OAuth not configured'
    }
  });
});

// -------------------------------------------------------
// 7. AUTH ROUTES (MUST BE LOADED IMMEDIATELY AFTER OAUTH)
// -------------------------------------------------------
try {
  const authRoutes = require('./routes/auth');
  app.use('/auth', authRoutes);
  console.log('Auth routes loaded successfully');
} catch (error) {
  console.warn('Auth routes missing:', error.message);
}

// -------------------------------------------------------
// 8. OTHER ROUTES (SAFE TO LOAD AFTER AUTH)
// -------------------------------------------------------
try {
  const machineRoutes = require('./routes/machines');
  const productionRunRoutes = require('./routes/productionRuns');
  const employeeRoutes = require('./routes/employees');
  const qualityCheckRoutes = require('./routes/qualityChecks');

  app.use('/machines', machineRoutes);
  app.use('/production-runs', productionRunRoutes);
  app.use('/employees', employeeRoutes);
  app.use('/quality-checks', qualityCheckRoutes);

  console.log('Machine, Production Run, Employee, and Quality Check routes loaded');
} catch (error) {
  console.warn('Error loading routes:', error.message);
}

// -------------------------------------------------------
// 9. 404 HANDLER
// -------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      '/machines',
      '/production-runs',
      '/employees',
      '/quality-checks',
      '/auth/google',
      '/api-docs'
    ]
  });
});

// -------------------------------------------------------
// 10. GLOBAL ERROR HANDLER
// -------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// -------------------------------------------------------
// 11. START SERVER
// -------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Docs: http://localhost:${PORT}/api-docs`);
    console.log('OAuth login: /auth/google');
  });
}

module.exports = app;
