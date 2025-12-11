const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function (app) {
  console.log('=== INITIALIZING OAUTH CONFIGURATION ===');
  
  // Debug: Check environment variables
  console.log('Environment check:');
  console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ MISSING');
  console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Not set');

  // Configure session - CRITICAL FOR RENDER
  app.use(session({
    secret: process.env.SESSION_SECRET || 'plastic-manufacturing-secret-key',
    resave: true,  // MUST be true for production
    saveUninitialized: true,  // MUST be true for production
    cookie: {
      secure: true,  // MUST be true for HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'none',  // REQUIRED for cross-site
      httpOnly: true,
      domain: '.onrender.com'  // ADD THIS for Render
    },
    proxy: true  // REQUIRED for Render proxy
  }));

  console.log('Session middleware configured');

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('Passport initialized');

  // Configure Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    try {
      passport.use(new GoogleStrategy({
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://plastic-manufacturing-api.onrender.com/auth/google/callback',
          scope: ['profile', 'email'],
          passReqToCallback: true
        },
        function (req, accessToken, refreshToken, profile, done) {
          console.log('✅ Google auth success for:', profile.displayName);
          console.log('📧 User email:', profile.emails?.[0]?.value);
          return done(null, profile);
        }
      ));
      
      console.log('✅ Google OAuth strategy configured successfully');
      console.log('✅ Scope set: ["profile", "email"]');
    } catch (error) {
      console.error('❌ Error configuring Google OAuth:', error.message);
    }
  } else {
    console.warn('⚠️ Google OAuth credentials missing. Authentication will not work.');
  }

  // Serialize user to session
  passport.serializeUser((user, done) => {
    console.log('📝 Serializing user:', user.id);
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    console.log('📝 Deserializing user:', user.id);
    done(null, user);
  });

  console.log('=== OAUTH CONFIGURATION COMPLETE ===');
};