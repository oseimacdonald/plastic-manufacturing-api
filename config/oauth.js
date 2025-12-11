const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function (app) {
  console.log('=== INITIALIZING GOOGLE OAUTH CONFIGURATION ===');

  // Debug environment
  console.log('Environment check:');
  console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ MISSING');
  console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

  // Session configuration for Render
  app.use(session({
    secret: process.env.SESSION_SECRET || 'plastic-manufacturing-secret-key',
    resave: true,
    saveUninitialized: true,
    proxy: true,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      domain: '.onrender.com',
    },
  }));

  console.log('Session middleware configured');

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('Passport initialized');

  // Google OAuth Strategy - THE CRITICAL FIX
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],  // ← MUST BE HERE TOO
        passReqToCallback: true,
        state: true
      },
      function (req, accessToken, refreshToken, profile, done) {
        console.log('✅ Google auth success for:', profile.displayName);
        return done(null, profile);
      }
    ));
    
    console.log('✅ Google OAuth strategy configured with scope');
  } else {
    console.warn('⚠️ Google OAuth credentials missing');
  }

  // Serialize/Deserialize
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  console.log('=== OAUTH CONFIGURATION COMPLETE ===');
  
  // DO NOT ADD ROUTES HERE - They're already in routes/auth.js
};