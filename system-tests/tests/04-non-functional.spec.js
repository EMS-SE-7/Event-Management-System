// System tests for the non-functional requirements in Test Plan section 3 and 5.1.
const { test, expect } = require('@playwright/test');
const { apiToken, createEventViaApi, ACCOUNTS, PASSWORD } = require('./helpers');

test('TC-SYS-18 (PERF-01): main API calls answer within 2 seconds', async ({ request }) => {
  const event = await createEventViaApi(request, 'organizer');
  const token = await apiToken(request, 'student');
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const calls = {
    'POST /api/auth/login': () => request.post('/api/auth/login', { data: { email: ACCOUNTS.student.email, password: PASSWORD } }),
    'GET /api/events': () => request.get('/api/events', auth),
    'GET /api/events/:id': () => request.get(`/api/events/${event._id}`, auth),
    'GET /api/registrations/mine': () => request.get('/api/registrations/mine', auth),
  };
  const slowest = {};
  await test.step('Call each of 4 main endpoints 10 times and record the slowest response', async () => {
    for (const [name, call] of Object.entries(calls)) {
      const times = [];
      for (let i = 0; i < 10; i += 1) {
        const start = Date.now();
        const res = await call();
        times.push(Date.now() - start);
        expect(res.ok(), `${name} failed`).toBeTruthy();
      }
      slowest[name] = Math.max(...times);
      test.info().annotations.push({ type: 'timing', description: `${name}: slowest of 10 calls ${slowest[name]} ms` });
    }
  });
  await test.step('Every slowest response is at most 2000 ms', async () => {
    for (const [name, ms] of Object.entries(slowest)) expect(ms, `${name} took ${ms} ms`).toBeLessThanOrEqual(2000);
  });
});

test('TC-SYS-19 (SEC-01): protected APIs need a valid token and never return passwords', async ({ request }) => {
  await test.step('Calls with no token or a made-up token are rejected with 401', async () => {
    expect((await request.get('/api/registrations/mine')).status()).toBe(401);
    expect((await request.get('/api/events', { headers: { Authorization: 'Bearer not-a-real-token' } })).status()).toBe(401);
  });
  const token = await apiToken(request, 'student');
  await test.step('A real token with a changed signature is rejected with 401', async () => {
    const [header, payload] = token.split('.');
    expect((await request.get('/api/auth/me', { headers: { Authorization: `Bearer ${header}.${payload}.invalidsignature` } })).status()).toBe(401);
  });
  await test.step('The login and profile responses contain no password field or password value', async () => {
    const login = await request.post('/api/auth/login', { data: { email: ACCOUNTS.student.email, password: PASSWORD } });
    const me = await request.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    for (const body of [await login.text(), await me.text()]) {
      expect(body).not.toContain('password');
      expect(body).not.toContain(PASSWORD);
    }
  });
});
