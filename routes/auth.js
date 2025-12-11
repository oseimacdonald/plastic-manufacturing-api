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
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',  // Forces account selection screen
    access_type: 'offline'     // Gets refresh token
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
  passport.authenticate('google', { 
    failureRedirect: '/auth/failure',
    failureMessage: true  // Passes error messages to session
  }),
  (req, res) => {
    // Successful authentication
    console.log('User authenticated:', req.user?.id);
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
      authenticated: true
    });
  } else {
    res.status(401).json({
      message: 'Not authenticated',
      authenticated: false
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
  
  res.status(401).json({
    message: error,
    error: 'Google OAuth authentication failed',
    authenticated: false
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
  req.logout((err) => {
    if (err) {
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
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user.id,
      displayName: req.user.displayName,
      email: req.user.emails?.[0]?.value,
      provider: req.user.provider
    } : null,
    timestamp: new Date().toISOString()
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
    sessionId: req.sessionID
  };
  
  res.json(config);
});

module.exports = router;