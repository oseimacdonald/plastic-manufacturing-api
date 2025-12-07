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
  passport.authenticate('google', { scope: ['profile', 'email'] })
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
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    // Successful authentication
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
        provider: req.user.provider
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
  res.status(401).json({
    message: 'Authentication failed',
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
      return res.status(500).json({ error: 'Logout failed' });
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
    } : null
  });
});

module.exports = router;