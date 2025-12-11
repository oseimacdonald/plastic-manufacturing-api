const express = require('express');
const router = express.Router();
const passport = require('passport');

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Authenticate with Google
 *     description: Initiates Google OAuth authentication flow
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent screen
 */
router.get('/google',
  (req, res, next) => {
    console.log('🔐 Starting Google OAuth from /auth/google');
    console.log('Session ID:', req.sessionID);
    console.log('Cookies present:', !!req.headers.cookie);
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    access_type: 'offline'
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Callback URL for Google OAuth authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to home page on success, or login page on failure
 */
router.get('/google/callback',
  (req, res, next) => {
    console.log('🔄 Google callback received');
    console.log('Query params:', req.query);
    console.log('Session ID:', req.sessionID);
    console.log('Has code param:', !!req.query.code);
    console.log('Has error param:', !!req.query.error);
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: '/auth/failure',
    failureMessage: true
  }),
  (req, res) => {
    console.log('✅ Authentication successful');
    console.log('User ID:', req.user.id);
    console.log('User email:', req.user.emails?.[0]?.value);
    res.redirect('/auth/success');
  }
);

/**
 * @swagger
 * /auth/success:
 *   get:
 *     summary: Authentication success
 *     description: Returns authentication success information
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 authenticated:
 *                   type: boolean
 */
router.get('/success', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      message: 'Authentication successful',
      user: {
        id: req.user.id,
        displayName: req.user.displayName,
        email: req.user.emails?.[0]?.value,
        provider: req.user.provider,
        photos: req.user.photos?.[0]?.value
      },
      authenticated: true,
      sessionId: req.sessionID
    });
  } else {
    res.status(401).json({
      message: 'Not authenticated',
      authenticated: false,
      sessionId: req.sessionID
    });
  }
});

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     summary: Authentication failure
 *     description: Returns authentication failure information
 *     tags: [Authentication]
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get('/failure', (req, res) => {
  const error = req.session.messages?.[0] || 'Authentication failed';
  console.log('❌ Authentication failure:', error);
  
  res.status(401).json({
    message: error,
    error: 'Google OAuth authentication failed',
    authenticated: false,
    sessionMessages: req.session.messages,
    sessionId: req.sessionID
  });
});

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     description: Logs out the current user and clears session
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.get('/logout', (req, res) => {
  console.log('👋 Logout requested for session:', req.sessionID);
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        error: 'Logout failed',
        details: err.message 
      });
    }
    req.session.destroy();
    res.json({
      message: 'Logout successful',
      authenticated: false
    });
  });
});

/**
 * @swagger
 * /auth/status:
 *   get:
 *     summary: Check authentication status
 *     description: Returns current authentication status
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication status
 */
router.get('/status', (req, res) => {
  const isAuth = req.isAuthenticated();
  console.log('📊 Status check - Authenticated:', isAuth);
  
  res.json({
    authenticated: isAuth,
    user: isAuth ? {
      id: req.user.id,
      displayName: req.user.displayName,
      email: req.user.emails?.[0]?.value,
      provider: req.user.provider
    } : null,
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID,
    sessionExists: !!req.session
  });
});

/**
 * @swagger
 * /auth/debug:
 *   get:
 *     summary: Debug OAuth configuration
 *     description: Returns current OAuth configuration for debugging
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Debug information
 */
router.get('/debug', (req, res) => {
  const googleStrategy = passport._strategies.google;
  const config = {
    hasGoogleStrategy: !!googleStrategy,
    clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    scope: googleStrategy?._scope || 'Not configured',
    sessionId: req.sessionID,
    sessionExists: !!req.session,
    cookies: req.headers.cookie ? 'Present' : 'Missing',
    userAgent: req.get('user-agent')
  };
  
  console.log('🔧 Debug info:', config);
  res.json(config);
});

// ============================================
// NEW DEBUG ROUTES
// ============================================

/**
 * @swagger
 * /auth/debug-swagger-flow:
 *   get:
 *     summary: Debug Swagger OAuth flow
 *     tags: [Authentication]
 */
router.get('/debug-swagger-flow', (req, res) => {
  // URL that Swagger would generate
  const swaggerAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent('https://plastic-manufacturing-api.onrender.com/api-docs/oauth2-redirect.html')}&` +
    `response_type=code&` +
    `scope=profile%20email&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  // URL that your app generates
  const yourAppAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent('https://plastic-manufacturing-api.onrender.com/auth/google/callback')}&` +
    `response_type=code&` +
    `scope=profile%20email&` +
    `access_type=offline&` +
    `prompt=select_account`;
  
  res.json({
    comparison: {
      swaggerFlow: {
        url: swaggerAuthUrl,
        description: 'Swagger sends user directly to Google, uses /api-docs/oauth2-redirect.html as callback',
        test: 'Copy this URL and test in browser'
      },
      yourAppFlow: {
        url: yourAppAuthUrl,
        description: 'Your app uses Passport, uses /auth/google/callback as callback',
        test: 'Visit /auth/google to trigger this flow'
      }
    },
    requiredGoogleConsoleUris: [
      'https://plastic-manufacturing-api.onrender.com/auth/google/callback',
      'https://plastic-manufacturing-api.onrender.com/api-docs/oauth2-redirect.html',
      'http://localhost:3000/auth/google/callback'
    ],
    note: 'Swagger needs the second URI (/api-docs/oauth2-redirect.html) in Google Console'
  });
});

/**
 * @swagger
 * /auth/debug-session:
 *   get:
 *     summary: Debug session configuration
 *     tags: [Authentication]
 */
router.get('/debug-session', (req, res) => {
  // Test session functionality
  req.session.debugVisit = (req.session.debugVisit || 0) + 1;
  req.session.debugTime = new Date().toISOString();
  
  req.session.save((err) => {
    const sessionInfo = {
      sessionWorking: !err,
      error: err ? err.message : null,
      sessionId: req.sessionID,
      debugVisit: req.session.debugVisit,
      debugTime: req.session.debugTime,
      authenticated: req.isAuthenticated(),
      user: req.user,
      cookies: req.headers.cookie,
      secure: req.secure,
      host: req.get('host'),
      userAgent: req.get('user-agent')
    };
    
    console.log('🧪 Session debug:', sessionInfo);
    res.json(sessionInfo);
  });
});

/**
 * @swagger
 * /auth/debug-passport:
 *   get:
 *     summary: Debug Passport configuration
 *     tags: [Authentication]
 */
router.get('/debug-passport', (req, res) => {
  const strategy = passport._strategies.google;
  
  const debugInfo = {
    hasPassportGoogleStrategy: !!strategy,
    strategyDetails: strategy ? {
      name: strategy.name,
      scope: strategy._scope,
      callbackURL: strategy._callbackURL,
      clientId: strategy._oauth2?._clientId,
      clientSecret: strategy._oauth2?._clientSecret ? 'Set' : 'Not set'
    } : 'No Google strategy found',
    environment: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
      nodeEnv: process.env.NODE_ENV
    },
    session: {
      id: req.sessionID,
      exists: !!req.session,
      authenticated: req.isAuthenticated()
    }
  };
  
  console.log('🔐 Passport debug:', debugInfo);
  res.json(debugInfo);
});

/**
 * @swagger
 * /auth/test-manual-oauth:
 *   get:
 *     summary: Test manual OAuth URL
 *     tags: [Authentication]
 */
router.get('/test-manual-oauth', (req, res) => {
  // Generate the exact URL that should work
  const manualUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent('https://plastic-manufacturing-api.onrender.com/auth/google/callback')}&` +
    `response_type=code&` +
    `scope=profile%20email&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  res.json({
    message: 'Test this URL in browser to bypass Passport',
    url: manualUrl,
    instructions: [
      '1. Copy the URL above',
      '2. Paste in a new browser tab',
      '3. Grant permissions',
      '4. You should be redirected to /auth/google/callback',
      '5. Check /auth/status to see if authenticated'
    ],
    expectedBehavior: 'If this works but /auth/google doesn\'t, Passport has an issue'
  });
});

/**
 * @swagger
 * /auth/clear-session:
 *   get:
 *     summary: Clear current session (debug)
 *     tags: [Authentication]
 */
router.get('/clear-session', (req, res) => {
  const oldSessionId = req.sessionID;
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).json({ error: 'Failed to clear session' });
    }
    
    res.json({
      message: 'Session cleared',
      oldSessionId: oldSessionId,
      newSessionId: req.sessionID,
      note: 'Refresh page to get new session'
    });
  });
});

module.exports = router;