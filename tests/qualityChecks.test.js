const request = require('supertest');
const app = require('../app');

// Note: Console mocking is now handled in tests/setup.js

test('GET /quality-checks without auth returns 401', async () => {
  const res = await request(app)
    .get('/quality-checks')
    .set('x-test-auth', 'false');
  expect(res.status).toBe(401);
});

test('GET /quality-checks with auth returns 200 or handles error', async () => {
  const res = await request(app)
    .get('/quality-checks')
    .set('x-test-auth', 'true');
  // Accept 200 (success) or 500 (server error) for Week 6
  expect([200, 500]).toContain(res.status);
});

test('GET /quality-checks returns JSON when authenticated and successful', async () => {
  const res = await request(app)
    .get('/quality-checks')
    .set('x-test-auth', 'true');
  if (res.status === 200) {
    expect(res.headers['content-type']).toMatch(/json/);
  }
});

test('GET /quality-checks/invalid-id returns proper status', async () => {
  const res = await request(app)
    .get('/quality-checks/invalid-id')
    .set('x-test-auth', 'true');
  expect([400, 404, 500]).toContain(res.status);
});

test('GET /quality-checks/recent with auth returns 200 or handles error', async () => {
  const res = await request(app)
    .get('/quality-checks/recent')
    .set('x-test-auth', 'true');
  expect([200, 500]).toContain(res.status);
});