const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function (app) {
  console.log('=== INITIALIZING GOOGLE OAUTH CONFIGURATION ===');

  // ---------------------------------------------------------------------------
  // 1. DEBUG ENV VALUES
  // ---------------------------------------------------------------------------
  console.log('Environment check:');
  console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ MISSING');
  console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Not set');

  // ---------------------------------------------------------------------------
  // 2. SESSION CONFIG (IMPORTANT FOR RENDER)
  // ---------------------------------------------------------------------------
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'plastic-manufacturing-secret-key',
      resave: true, // REQUIRED on Render
      saveUninitialized: true, // REQUIRED on Render
      proxy: true, // REQUIRED for Render’s proxy
      cookie: {
        secure: true, // REQUIRED for HTTPS
        httpOnly: true,
        sameSite: 'none', // REQUIRED for cross-site cookies (Google OAuth)
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        domain: '.onrender.com', // REQUIRED for Render subdomains
      },
    })
  );

  console.log('Session middleware configured');

  // ---------------------------------------------------------------------------
  // 3. INITIALIZE PASSPORT
  // ---------------------------------------------------------------------------
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('Passport initialized');

  // ---------------------------------------------------------------------------
  // 4. GOOGLE OAUTH STRATEGY
  // ---------------------------------------------------------------------------
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            'https://plastic-manufacturing-api.onrender.com/auth/google/callback',
          passReqToCallback: true,
        },
        function (req, accessToken, refreshToken, profile, done) {
          console.log('-----------------------------------------------');
          console.log('✅ Google authentication succeeded');
          console.log('👤 User:', profile.displayName);
          console.log('📧 Email:', profile.emails?.[0]?.value);
          console.log('-----------------------------------------------');
          return done(null, profile);
        }
      )
    );

    console.log('✅ Google OAuth strategy configured successfully');
  } else {
    console.warn('⚠️ Google OAuth credentials missing. Authentication disabled.');
  }

  // ---------------------------------------------------------------------------
  // 5. SERIALIZE & DESERIALIZE USERS
  // ---------------------------------------------------------------------------
  passport.serializeUser((user, done) => {
    console.log('📝 Serialize user:', user.id);
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    console.log('📝 Deserialize user:', user.id);
    done(null, user);
  });

  // ---------------------------------------------------------------------------
  // 6. GOOGLE AUTH ROUTES — THIS WAS THE MISSING PART
  // ---------------------------------------------------------------------------

  // ---- STEP 1: Redirect users to Google login ---- //
  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'], // REQUIRED — missing before
      prompt: 'select_account', // always allow switching accounts
    })
  );

  // ---- STEP 2: Google sends user back here ---- //
  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/auth/failure',
    }),
    (req, res) => {
      console.log('🎉 Login success — redirecting user');
      res.redirect('/auth/success');
    }
  );

  // ---------------------------------------------------------------------------
  // 7. OPTIONAL: SUCCESS & FAILURE ROUTES
  // ---------------------------------------------------------------------------

  app.get('/auth/success', (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    res.json({
      message: 'Google login successful',
      user: req.user,
    });
  });

  app.get('/auth/failure', (req, res) => {
    res.status(400).json({
      message: 'Google login failed',
    });
  });

  console.log('=== GOOGLE OAUTH SETUP COMPLETE ===');
};
