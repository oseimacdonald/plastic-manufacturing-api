const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger/swaggerConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database connection - WITH TEST MODE CHECK
if (process.env.NODE_ENV === 'test') {
  console.log('Test mode: Skipping MongoDB connection');
  // mongoose.connect will be mocked by jest in tests/setup.js
} else {
  // Database connection - only in non-test mode
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plastic-manufacturing')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// OAuth Configuration (must come before routes)
// Check if oauth config exists before requiring it
try {
  require('./config/oauth')(app);
  console.log('OAuth configuration loaded');
} catch (error) {
  console.warn('OAuth configuration not found, running without authentication');
  // Create a dummy isAuthenticated middleware if oauth not configured
  app.use((req, res, next) => {
    req.isAuthenticated = () => false;
    next();
  });
}

// Test authentication support
if (process.env.NODE_ENV === 'test') {
  console.log('Test mode: Setting up mock authentication');
  // Mock authentication middleware for tests
  app.use((req, res, next) => {
    // Check for test authentication headers
    if (req.headers['x-test-auth'] === 'true') {
      // Mock authenticated user for tests
      req.isAuthenticated = () => true;
      req.user = {
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }]
      };
    } else if (req.headers['x-test-auth'] === 'false') {
      // Mock unauthenticated user for tests
      req.isAuthenticated = () => false;
      req.user = null;
    }
    next();
  });
}

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
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

// Import routes - wrap in try-catch to handle missing files
try {
  const machineRoutes = require('./routes/machines');
  const productionRunRoutes = require('./routes/productionRuns');
  app.use('/machines', machineRoutes);
  app.use('/production-runs', productionRunRoutes);
  console.log('Machine and Production Run routes loaded');
} catch (error) {
  console.error('Error loading routes:', error.message);
}

// Try to load auth routes if they exist
try {
  const authRoutes = require('./routes/auth');
  app.use('/auth', authRoutes);
  console.log('Auth routes loaded');
} catch (error) {
  console.warn('Auth routes not found, skipping');
}

// Try to load employee and quality check routes
try {
  const employeeRoutes = require('./routes/employees');
  const qualityCheckRoutes = require('./routes/qualityChecks');
  
  // Apply routes WITHOUT additional middleware (authentication is in route files)
  app.use('/employees', employeeRoutes);
  app.use('/quality-checks', qualityCheckRoutes);
  console.log('Employee and Quality Check routes loaded (authentication handled in routes)');
} catch (error) {
  console.warn('Employee/Quality Check routes not found:', error.message);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: ['/machines', '/production-runs', '/employees', '/quality-checks', '/api-docs']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`Available endpoints:`);
    console.log(`  - GET  /              - API information`);
    console.log(`  - GET  /machines      - List all machines`);
    console.log(`  - POST /machines      - Create new machine`);
    console.log(`  - GET  /production-runs - List all production runs`);
    console.log(`  - POST /production-runs - Create new production run`);
    console.log(`  - GET  /employees     - List all employees (protected)`);
    console.log(`  - GET  /quality-checks - List all quality checks (protected)`);
    console.log(`  - GET  /api-docs      - API documentation`);
    console.log(`  - GET  /auth/google   - OAuth login`);
    console.log(`  - GET  /auth/logout   - Logout`);
  });
}

module.exports = app;