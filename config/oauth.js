const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function (app) {
  // Configure session
  app.use(require('express-session')({
    secret: process.env.SESSION_SECRET || 'plastic-manufacturing-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth Strategy
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you would typically find or create a user in your database
      // For simplicity, we'll just return the profile
      return done(null, profile);
    }
  ));

  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};