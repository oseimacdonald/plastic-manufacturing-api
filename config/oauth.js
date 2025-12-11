const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function (app) {
  console.log('=== INITIALIZING GOOGLE OAUTH CONFIGURATION ===');

  // Debug environment
  console.log('Environment check:');
  console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ MISSING');
  console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
  console.log('- NODE_ENV:', process.env.NODE_ENV);

  // Session configuration - FIXED
  app.use(session({
    secret: process.env.SESSION_SECRET || 'plastic-manufacturing-secret-key',
    resave: false,  // CHANGED: false for better performance
    saveUninitialized: false,  // CHANGED: false for security
    proxy: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Dynamic based on environment
      httpOnly: true,
      sameSite: 'lax',  // CHANGED: 'lax' works better with OAuth
      maxAge: 24 * 60 * 60 * 1000,
      // REMOVED: domain: '.onrender.com' - let browser handle domain
    },
  }));

  console.log('Session middleware configured');

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('Passport initialized');

  // Google OAuth Strategy - SIMPLIFIED
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Configuring Google OAuth strategy...');
    
    const googleStrategy = new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        // REMOVED: scope - will be set in routes/auth.js
        // REMOVED: state - let Passport handle it
        passReqToCallback: false  // SIMPLIFIED: no need for req parameter
      },
      function (accessToken, refreshToken, profile, done) {
        console.log('✅ PASSPORT VERIFY CALLBACK EXECUTED');
        console.log('User authenticated:', profile.id, profile.displayName);
        console.log('Email:', profile.emails?.[0]?.value);
        
        // Simply return the profile
        return done(null, profile);
      }
    );
    
    passport.use(googleStrategy);
    
    console.log('✅ Google OAuth strategy configured');
    console.log('Callback URL configured:', process.env.GOOGLE_CALLBACK_URL);
  } else {
    console.error('❌ Google OAuth credentials missing!');
    console.error('Check environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
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

  // Debug middleware
  app.use((req, res, next) => {
    // Log important auth requests
    if (req.path.includes('/auth/google') || req.path.includes('/callback')) {
      console.log(`🔐 Auth Request: ${req.method} ${req.path}`);
      console.log('Session ID:', req.sessionID);
      console.log('Has session:', !!req.session);
    }
    next();
  });

  // Test endpoint to verify OAuth setup
  app.get('/oauth-test', (req, res) => {
    const strategy = passport._strategies.google;
    res.json({
      status: 'OAuth Configuration Test',
      hasGoogleStrategy: !!strategy,
      strategyConfigured: strategy ? {
        hasClientId: !!strategy._oauth2?._clientId,
        hasClientSecret: !!strategy._oauth2?._clientSecret,
        callbackUrl: strategy._callbackURL,
        name: strategy.name
      } : 'No strategy found',
      session: {
        id: req.sessionID,
        cookie: req.session?.cookie,
        secure: req.secure,
        authenticated: req.isAuthenticated?.() || false
      },
      environment: {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        nodeEnv: process.env.NODE_ENV
      },
      instructions: [
        '1. Visit /auth/google to start OAuth',
        '2. Check server logs for callback execution',
        '3. Visit /auth/status to check authentication'
      ]
    });
  });

  console.log('=== OAUTH CONFIGURATION COMPLETE ===');
};