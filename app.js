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
// Swagger Documentation - UPDATED: DISABLED SWAGGER OAUTH
// -----------------------
const swaggerOptions = {
  swaggerOptions: {
    // DISABLE Swagger's OAuth completely
    oauth2RedirectUrl: null, // No OAuth redirect
    
    // Disable "Try it out" buttons to prevent confusion with authentication
    supportedSubmitMethods: [], // Empty array = no try buttons
    
    // Clean up the UI
    docExpansion: 'list',
    defaultModelsExpandDepth: -1, // Hide schemas by default
    displayRequestDuration: false,
    persistAuthorization: false, // Don't save auth in browser
    displayOperationId: false
  },
  customSiteTitle: 'Plastic Manufacturing API - Documentation',
  customCss: `
    /* Hide unnecessary elements */
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .auth-wrapper { display: none !important; }
    .swagger-ui .btn.authorize { display: none !important; }
    .swagger-ui .scheme-container { display: none !important; }
    .swagger-ui .model-box { display: none !important; }
    
    /* Add authentication instructions */
    .swagger-ui .information-container {
      position: relative;
    }
    .swagger-ui .information-container::before {
      content: "🔐 AUTHENTICATION INSTRUCTIONS:";
      display: block;
      font-weight: bold;
      font-size: 16px;
      color: #d93025;
      margin-bottom: 10px;
      padding: 10px;
      background-color: #fff8e1;
      border-left: 4px solid #4285f4;
      border-radius: 4px;
    }
    .swagger-ui .information-container::after {
      content: "1. Visit /auth/google to authenticate with Google\\A 2. After authentication, your session will be active\\A 3. Use the endpoints below\\A\\A Do NOT use any 'Authorize' buttons in this documentation.";
      display: block;
      white-space: pre-wrap;
      font-size: 14px;
      color: #333;
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f0f8ff;
      border-left: 4px solid #34a853;
      border-radius: 4px;
    }
    
    /* Style the main content */
    .swagger-ui .opblock-tag {
      font-size: 18px;
      font-weight: bold;
      color: #1a73e8;
      border-bottom: 2px solid #1a73e8;
      padding-bottom: 5px;
    }
    
    /* Make it clear this is documentation only */
    .swagger-ui .opblock-summary-description::before {
      content: "📋 ";
    }
  `,
  customJs: `
    // Remove any OAuth initialization
    window.onload = function() {
      // Hide any remaining OAuth elements
      setTimeout(function() {
        var authElements = document.querySelectorAll('.auth-wrapper, .btn.authorize, .scheme-container');
        authElements.forEach(function(el) {
          el.style.display = 'none';
        });
        
        // Add a clear message at the top
        var infoContainer = document.querySelector('.information-container');
        if (infoContainer) {
          var authAlert = document.createElement('div');
          authAlert.className = 'auth-alert';
          authAlert.innerHTML = '<div style="background: #fff8e1; padding: 15px; border-left: 4px solid #d93025; margin-bottom: 20px; border-radius: 4px;"><strong>⚠️ IMPORTANT:</strong> To authenticate, visit <a href="/auth/google" style="color: #1a73e8; font-weight: bold;">/auth/google</a> in a new tab. Do not use any "Authorize" buttons on this page.</div>';
          infoContainer.parentNode.insertBefore(authAlert, infoContainer);
        }
      }, 100);
    }
  `,
  customfavIcon: '/favicon.ico'
};

// Use the configured Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
console.log('✅ Swagger docs loaded (with clear authentication instructions)');

// -----------------------
// Home route - UPDATED with clearer instructions
// -----------------------
app.get('/', (req, res) => {
  const authStatus = req.isAuthenticated?.();
  
  res.json({
    message: 'Plastic Manufacturing API',
    description: 'API for injection machine production reporting system',
    documentation: '/api-docs',
    
    // Clear authentication status
    authentication: authStatus ? {
      authenticated: true,
      user: req.user?.displayName || 'Authenticated User',
      email: req.user?.emails?.[0]?.value,
      message: 'You are logged in. Access protected endpoints below.'
    } : {
      authenticated: false,
      message: 'You need to authenticate to access protected endpoints.'
    },
    
    // Clear authentication instructions
    howToAuthenticate: {
      step1: 'Visit /auth/google to start Google OAuth authentication',
      step2: 'Grant permissions to "Plastic Manufacturing API" (not Swagger UI)',
      step3: 'You will be redirected back to /auth/success',
      step4: 'Your session will be active for all protected endpoints',
      importantNote: 'Do NOT use the "Authorize" button in the documentation. Use /auth/google directly.'
    },
    
    // Available endpoints
    endpoints: {
      public: {
        home: '/',
        apiDocs: '/api-docs',
        authentication: '/auth/google',
        authStatus: '/auth/status',
        authDebug: '/oauth-debug'
      },
      protected: {
        machines: '/machines',
        productionRuns: '/production-runs',
        employees: '/employees',
        qualityChecks: '/quality-checks'
      },
      authEndpoints: {
        googleAuth: '/auth/google',
        authStatus: '/auth/status',
        authSuccess: '/auth/success',
        authLogout: '/auth/logout',
        authDebug: '/auth/debug'
      }
    },
    
    // Quick links for testing
    quickTest: authStatus ? [
      '✅ You are authenticated!',
      'Test: /employees - Should return employee data',
      'Test: /machines - Should return machine data',
      'Logout: /auth/logout'
    ] : [
      '🔒 You are NOT authenticated',
      'Click: /auth/google - To authenticate with Google',
      'After auth, return here to see status change'
    ]
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
// Add OAuth test route
// -----------------------
app.get('/test-auth', (req, res) => {
  const isAuthenticated = req.isAuthenticated?.();
  
  res.json({
    authenticationTest: 'Testing authentication status',
    isAuthenticated: isAuthenticated,
    userInfo: isAuthenticated ? {
      displayName: req.user?.displayName,
      email: req.user?.emails?.[0]?.value,
      id: req.user?.id
    } : null,
    
    instructions: isAuthenticated ? [
      '✅ SUCCESS! You are authenticated.',
      'You can now access protected endpoints:',
      '  • /employees',
      '  • /machines',
      '  • /production-runs',
      '  • /quality-checks',
      '',
      'To logout: /auth/logout'
    ] : [
      '❌ You are NOT authenticated.',
      'To authenticate:',
      '1. Open a new browser tab',
      '2. Visit: /auth/google',
      '3. Grant permissions to "Plastic Manufacturing API"',
      '4. Return here and refresh',
      '',
      'IMPORTANT: Use /auth/google, not Swagger OAuth buttons!'
    ],
    
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID?.substring(0, 10) + '...'
  });
});

// -----------------------
// Simple authentication success page
// -----------------------
app.get('/auth/simple-success', (req, res) => {
  if (!req.isAuthenticated?.()) {
    return res.redirect('/auth/google');
  }
  
  res.json({
    title: '✅ Authentication Successful!',
    message: 'You are now logged into the Plastic Manufacturing API',
    user: {
      name: req.user?.displayName,
      email: req.user?.emails?.[0]?.value
    },
    nextSteps: [
      'You can now access all protected endpoints',
      'Test: Visit /employees to see employee data',
      'Test: Visit /machines to see machine data',
      'Check status: /auth/status',
      'Logout: /auth/logout'
    ],
    quickLinks: {
      home: '/',
      employees: '/employees',
      machines: '/machines',
      status: '/auth/status',
      logout: '/auth/logout'
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
      '/test-auth',
      '/auth/google',
      '/auth/status',
      '/auth/simple-success',
      '/machines', 
      '/production-runs', 
      '/employees', 
      '/quality-checks', 
      '/api-docs'
    ],
    authenticationNote: 'Protected endpoints (/employees, /machines, etc.) require authentication via /auth/google'
  });
});

// -----------------------
// Error handler
// -----------------------
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    suggestion: 'Check authentication status at /auth/status or authenticate at /auth/google'
  });
});

// -----------------------
// Start server (skip in test mode)
// -----------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
🚀 PLASTIC MANUFACTURING API
────────────────────────────────
✅ Server running on port ${PORT}

📖 DOCUMENTATION:
   • API Docs: http://localhost:${PORT}/api-docs

🔐 AUTHENTICATION:
   • Authenticate: http://localhost:${PORT}/auth/google
   • Check Status: http://localhost:${PORT}/auth/status
   • Test Auth: http://localhost:${PORT}/test-auth

📊 TEST ENDPOINTS:
   • Employees: http://localhost:${PORT}/employees (protected)
   • Machines: http://localhost:${PORT}/machines (public)
   • Home: http://localhost:${PORT}/

⚠️  IMPORTANT FOR USERS:
   • Use /auth/google to authenticate (NOT Swagger buttons)
   • After auth, visit /test-auth to verify
   • Protected routes need authentication

────────────────────────────────
`);
  });
}

module.exports = app;