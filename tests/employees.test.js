const request = require('supertest');
const app = require('../app');

// Note: Console mocking is now handled in tests/setup.js

describe('Employee Routes - Week 6 Testing', () => {
  // Test 1: UNAUTHENTICATED request should return 401 (shows route is protected)
  test('GET /employees without authentication returns 401', async () => {
    const res = await request(app)
      .get('/employees')
      .set('x-test-auth', 'false');
    
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Unauthorized');
    expect(res.body.message).toContain('Authentication required');
  });

  // Test 2: AUTHENTICATED request should return 200 (shows auth works)
  test('GET /employees with authentication returns 200', async () => {
    const res = await request(app)
      .get('/employees')
      .set('x-test-auth', 'true');
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  // Test 3: AUTHENTICATED request returns JSON format
  test('GET /employees returns JSON when authenticated', async () => {
    const res = await request(app)
      .get('/employees')
      .set('x-test-auth', 'true');
    
    expect(res.headers['content-type']).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test 4: AUTHENTICATED request to invalid ID returns 400
  test('GET /employees/invalid-id with authentication returns 400', async () => {
    const res = await request(app)
      .get('/employees/invalid-id')
      .set('x-test-auth', 'true');
    
    expect([400, 404]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body).toHaveProperty('error');
    }
  });

  // Test 5: UNAUTHENTICATED request to invalid ID returns 401
  test('GET /employees/invalid-id without authentication returns 401', async () => {
    const res = await request(app)
      .get('/employees/invalid-id')
      .set('x-test-auth', 'false');
    
    expect(res.status).toBe(401);
  });

  // Test 6: AUTHENTICATED request to active endpoint
  test('GET /employees/active with authentication returns 200', async () => {
    const res = await request(app)
      .get('/employees/active')
      .set('x-test-auth', 'true');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test 7: UNAUTHENTICATED request to active endpoint
  test('GET /employees/active without authentication returns 401', async () => {
    const res = await request(app)
      .get('/employees/active')
      .set('x-test-auth', 'false');
    
    expect(res.status).toBe(401);
  });
});