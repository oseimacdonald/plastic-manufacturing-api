const request = require('supertest');
const app = require('../app');

// Note: Console mocking is now handled in tests/setup.js

test('GET /machines returns 200', async () => {
  const res = await request(app).get('/machines');
  expect(res.status).toBe(200);
});

test('GET /machines returns JSON', async () => {
  const res = await request(app).get('/machines');
  expect(res.headers['content-type']).toMatch(/json/);
});

test('GET /machines/invalid-id returns 400 or 404', async () => {
  const res = await request(app).get('/machines/invalid-id');
  expect([400, 404]).toContain(res.status);
});

test('POST /machines with empty data returns 400', async () => {
  const res = await request(app).post('/machines').send({});
  expect(res.status).toBe(400);
});