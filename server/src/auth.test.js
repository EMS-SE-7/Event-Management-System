const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret';
const app = require('./index');
const User = require('./models/User');
const { authenticate, requireRole, protect, authorizeRoles } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const student = { name: 'Stu', email: 'pes1ug24cs001@pesu.pes.edu', password: 'secret123' };
let mongod;

// First run downloads a mongod binary (also on a fresh CI runner)
jest.setTimeout(120000);

// Organizer-only route mounted the way other modules will use the middleware
const guarded = express();
guarded.get('/org', authenticate, requireRole('organizer'), (req, res) =>
  res.json({ id: req.user.id, role: req.user.role })
);
guarded.get('/either', authenticate, requireRole('Student', 'Organizer'), (req, res) => res.json({ ok: true }));
guarded.use(errorHandler);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // Jest's sandbox blocks the driver's dynamic import('os'), so hand it over
  await mongoose.connect(mongod.getUri(), { runtimeAdapters: { os: require('os') } });
  await User.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(() => User.deleteMany({}));

const register = (body = student) => request(app).post('/api/auth/register').send(body);
const login = (body) => request(app).post('/api/auth/login').send(body);

describe('register', () => {
  test('creates a Student and returns token + public user', async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: student.email, role: 'Student' });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('ignores a role sent by the client', async () => {
    const res = await register({ ...student, role: 'Organizer' });
    expect(res.body.user.role).toBe('Student');
  });

  test('stores a bcrypt hash, never the plain password (TC-SEC-01)', async () => {
    await register();
    const stored = await User.findOne({ email: student.email }).select('+password');
    expect(stored.password).not.toBe(student.password);
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  test('rejects non-PESU email, duplicates and missing fields', async () => {
    expect((await register({ ...student, email: 'a@gmail.com' })).status).toBe(400);
    expect((await register({ name: 'x' })).status).toBe(400);
    await register();
    expect((await register()).status).toBe(409);
  });
});

describe('login (TC-AUTH-01, TC-AUTH-07)', () => {
  beforeEach(() => register());

  test('valid credentials return token and role', async () => {
    const res = await login({ email: student.email, password: student.password });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('Student');
  });

  test('wrong password and unknown email get the same 401', async () => {
    const wrong = await login({ email: student.email, password: 'nope-nope' });
    const unknown = await login({ email: 'ghost@pesu.pes.edu', password: 'secret123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  test('non-string credentials are rejected, not queried', async () => {
    const res = await login({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  test('empty body does not crash', async () => {
    expect((await request(app).post('/api/auth/login')).status).toBe(400);
  });
});

describe('authenticate + requireRole (TC-AUTH-05, TC-AUTH-06)', () => {
  const sign = (user, opts) => jwt.sign({ id: user._id, role: user.role }, 'test-secret', opts);
  const mk = (role) => User.create({ ...student, email: `${role}@pesu.pes.edu`, role });

  test('no token, garbage token, wrong secret, wrong algorithm -> 401', async () => {
    const org = await mk('Organizer');
    expect((await request(guarded).get('/org')).status).toBe(401);
    expect((await request(guarded).get('/org').set('Authorization', 'Bearer garbage')).status).toBe(401);
    const forged = jwt.sign({ id: org._id }, 'other-secret');
    expect((await request(guarded).get('/org').set('Authorization', `Bearer ${forged}`)).status).toBe(401);
    const hs512 = jwt.sign({ id: org._id }, 'test-secret', { algorithm: 'HS512' });
    expect((await request(guarded).get('/org').set('Authorization', `Bearer ${hs512}`)).status).toBe(401);
  });

  test('Student -> 403, Organizer -> 200 with req.user.id/role', async () => {
    const stu = await mk('Student');
    const org = await mk('Organizer');
    expect((await request(guarded).get('/org').set('Authorization', `Bearer ${sign(stu)}`)).status).toBe(403);
    const ok = await request(guarded).get('/org').set('Authorization', `Bearer ${sign(org)}`);
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ id: org.id, role: 'Organizer' });
  });

  test('role comes from the DB, not the token; deleted user -> 401', async () => {
    const stu = await mk('Student');
    const token = sign(stu);
    await User.updateOne({ _id: stu._id }, { role: 'Organizer' });
    expect((await request(guarded).get('/org').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    await User.deleteOne({ _id: stu._id });
    expect((await request(guarded).get('/org').set('Authorization', `Bearer ${token}`)).status).toBe(401);
  });

  test('tampered token -> 401', async () => {
    const org = await mk('Organizer');
    const [header, , signature] = sign(org).split('.');
    const payload = Buffer.from(JSON.stringify({ id: org._id, role: 'Organizer' })).toString('base64url');
    const res = await request(guarded).get('/org').set('Authorization', `Bearer ${header}.${payload}.${signature}`);
    expect(res.status).toBe(401);
  });

  test('401 and 403 use the team error format', async () => {
    const stu = await mk('Student');
    const noToken = await request(guarded).get('/org');
    expect(noToken.body).toEqual({ error: { code: 'UNAUTHENTICATED', message: 'Please log in' } });
    const denied = await request(guarded).get('/org').set('Authorization', `Bearer ${sign(stu)}`);
    expect(denied.body.error.code).toBe('FORBIDDEN');
  });

  test('requireRole takes several roles and ignores case; old names are aliases', async () => {
    const stu = await mk('Student');
    expect((await request(guarded).get('/either').set('Authorization', `Bearer ${sign(stu)}`)).status).toBe(200);
    expect(protect).toBe(authenticate);
    expect(authorizeRoles).toBe(requireRole);
  });

  test('expired token -> 401', async () => {
    const org = await mk('Organizer');
    const expired = sign(org, { expiresIn: -10 });
    expect((await request(guarded).get('/org').set('Authorization', `Bearer ${expired}`)).status).toBe(401);
  });

  test('GET /api/auth/me returns the logged-in user', async () => {
    const { body } = await register();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(student.email);
  });
});

test('unknown route returns JSON 404', async () => {
  const res = await request(app).get('/api/nope');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found' } });
});
