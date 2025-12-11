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
// Swagger Documentation - UPDATED WITH OAUTH FIX
// -----------------------
const swaggerOptions = {
  swaggerOptions: {
    // FIX: Use your actual OAuth callback endpoint
    oauth2RedirectUrl: 'https://plastic-manufacturing-api.onrender.com/auth/google/callback',
    
    // FIX: Configure OAuth for Swagger UI
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      realm: 'https://plastic-manufacturing-api.onrender.com',
      appName: 'Plastic Manufacturing API',
      scopeSeparator: ' ',
      usePkceWithAuthorizationCodeGrant: true
    },
    
    // Optional: Disable "Try it out" for production security
    supportedSubmitMethods: ['get', 'post', 'put', 'delete'], // Enable only what you need
    persistAuthorization: true, // Keep auth token between page refreshes
    displayRequestDuration: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1
  },
  customSiteTitle: 'Plastic Manufacturing API',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .auth-wrapper { margin-top: 20px }
    .swagger-ui .btn.authorize {
      background-color: #4285f4;
      color: white;
      border: none;
    }
  `,
  customfavIcon: '/favicon.ico'
};

// Use the configured Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
console.log('✅ Swagger docs configured with OAuth');

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
    },
    swaggerOAuth: {
      enabled: true,
      note: 'Swagger UI uses separate OAuth flow. Use /auth/google for direct authentication.'
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
// Add OAuth debug route
// -----------------------
app.get('/oauth-debug', (req, res) => {
  res.json({
    googleConsoleUris: [
      'https://plastic-manufacturing-api.onrender.com/auth/google/callback',
      'https://plastic-manufacturing-api.onrender.com/api-docs/oauth2-redirect.html',
      'http://localhost:3000/auth/google/callback'
    ],
    checkThese: 'All these URIs must be in Google Console → Credentials → Authorized redirect URIs',
    currentEnv: {
      nodeEnv: process.env.NODE_ENV,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL
    }
  });
});

// -----------------------
// 404 handler
// -----------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      '/',
      '/machines', 
      '/production-runs', 
      '/employees', 
      '/quality-checks', 
      '/api-docs',
      '/auth/google',
      '/oauth-debug'
    ]
  });
});

// -----------------------
// Error handler
// -----------------------
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    tip: 'Check server logs for detailed error information'
  });
});

// -----------------------
// Start server (skip in test mode)
// -----------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📄 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🔗 Direct OAuth: http://localhost:${PORT}/auth/google`);
    console.log(`🔍 OAuth Debug: http://localhost:${PORT}/oauth-debug`);
    console.log('\n⚠️  IMPORTANT: Ensure these URIs are in Google Console:');
    console.log('   1. https://plastic-manufacturing-api.onrender.com/auth/google/callback');
    console.log('   2. https://plastic-manufacturing-api.onrender.com/api-docs/oauth2-redirect.html');
    console.log('   3. http://localhost:3000/auth/google/callback');
  });
}

module.exports = app;