const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Event = require('../src/models/Event');
const { DEFAULT_USER_ID } = require('../src/middleware/authStub');
const db = require('./helpers/db');

const DAY = 24 * 60 * 60 * 1000;

// A valid request body for an event 7 days from now, sent as ISO strings like the client will.
function validBody(overrides = {}) {
  const start = new Date(Date.now() + 7 * DAY);
  return {
    title: 'Hackathon 2026',
    description: 'A 24 hour coding event',
    category: 'Technical',
    venue: 'MRD Auditorium',
    startDateTime: start.toISOString(),
    endDateTime: new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    registrationDeadline: new Date(start.getTime() - DAY).toISOString(),
    capacity: 100,
    ...overrides,
  };
}

beforeAll(db.connect, 120000);
afterEach(db.clear);
afterAll(db.close);

describe('POST /api/events', () => {
  test('TC-EVENT-01: an organizer creates an event', async () => {
    const res = await request(app).post('/api/events').send(validBody());

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Hackathon 2026',
      category: 'Technical',
      venue: 'MRD Auditorium',
      capacity: 100,
      status: 'Upcoming',
      registeredCount: 0,
      organizer: DEFAULT_USER_ID,
    });
    expect(res.body.data._id).toBeDefined();
    expect(await Event.countDocuments()).toBe(1);
  });

  test('TC-EVENT-01: organizer, status and registeredCount in the body are ignored', async () => {
    const someoneElse = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/events')
      .send(validBody({ organizer: someoneElse, status: 'Cancelled', registeredCount: 50 }));

    expect(res.status).toBe(201);
    expect(res.body.data.organizer).toBe(DEFAULT_USER_ID);
    expect(res.body.data.status).toBe('Upcoming');
    expect(res.body.data.registeredCount).toBe(0);
  });

  test('TC-EVENT-02: an empty body is rejected with a message for each required field', async () => {
    const res = await request(app).post('/api/events').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.details).sort()).toEqual(
      ['capacity', 'category', 'endDateTime', 'registrationDeadline', 'startDateTime', 'title', 'venue'].sort()
    );
    expect(await Event.countDocuments()).toBe(0);
  });

  test('TC-EVENT-02: a missing title is rejected', async () => {
    const res = await request(app).post('/api/events').send(validBody({ title: undefined }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.title).toBe('Title is required');
  });

  test('TC-EVENT-03: a category not in the list is rejected', async () => {
    const res = await request(app).post('/api/events').send(validBody({ category: 'Party' }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.category).toBeDefined();
  });

  test('TC-EVENT-03: a date that is not a date is rejected', async () => {
    const res = await request(app).post('/api/events').send(validBody({ startDateTime: 'next friday' }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.startDateTime).toBeDefined();
  });

  test('TC-EVENT-08: capacity of 0 is rejected', async () => {
    const res = await request(app).post('/api/events').send(validBody({ capacity: 0 }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.capacity).toBe('Capacity must be at least 1');
  });

  test('TC-EVENT-08: an end date before the start is rejected', async () => {
    const body = validBody();
    body.endDateTime = new Date(new Date(body.startDateTime).getTime() - 60 * 1000).toISOString();
    const res = await request(app).post('/api/events').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.details.endDateTime).toBe('End date and time must be after the start');
  });

  test('TC-EVENT-08: a start date in the past is rejected', async () => {
    const res = await request(app)
      .post('/api/events')
      .send(validBody({ startDateTime: new Date(Date.now() - DAY).toISOString() }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.startDateTime).toBe('Start date and time must be in the future');
  });

  test('TC-EVENT-01: a body that is not valid JSON is rejected', async () => {
    const res = await request(app).post('/api/events').set('Content-Type', 'application/json').send('{"title": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-EVENT-01: a student cannot create an event (403)', async () => {
    const res = await request(app).post('/api/events').set('x-stub-role', 'student').send(validBody());

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(await Event.countDocuments()).toBe(0);
  });

  test('TC-EVENT-01: a request without login cannot create an event (401)', async () => {
    const res = await request(app).post('/api/events').set('x-stub-role', 'none').send(validBody());

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(await Event.countDocuments()).toBe(0);
  });
});
