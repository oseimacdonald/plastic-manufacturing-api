// tests/auth-helper.js - Authentication helper for tests

/**
 * Create a request with mock authentication
 */
const authenticatedRequest = (app) => {
  const req = request(app);
  
  // Add methods to set mock authentication
  req.asAuthenticatedUser = function(user = {}) {
    return this.set('X-Test-Authenticated', 'true')
               .set('X-Test-User', JSON.stringify(user));
  };
  
  return req;
};

/**
 * Create a request without authentication
 */
const unauthenticatedRequest = (app) => {
  return request(app);
};

module.exports = {
  authenticatedRequest,
  unauthenticatedRequest,
  request: require('supertest')
};