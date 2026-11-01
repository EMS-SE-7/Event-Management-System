const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Event = require('../src/models/Event');
const Registration = require('../src/models/Registration');
const User = require('../src/models/User');
const db = require('./helpers/db');
const { createUser } = require('./helpers/auth');

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

let organizer, student, otherStudent;
beforeEach(async () => {
  organizer = await createUser('Organizer');
  student = await createUser('Student');
  otherStudent = await createUser('Student');
});

const person = (name) => ({ name, email: `${name.toLowerCase()}@pesu.pes.edu`, password: 'secret123' });

// Inserted directly so tests can also create started, expired or cancelled events.
async function createEvent(overrides = {}) {
  const startDateTime = new Date(Date.now() + 7 * DAY);
  const result = await Event.collection.insertOne({
    title: 'Registration Test Event',
    description: 'Event created for registration tests',
    category: 'Technical',
    venue: 'PES University',
    startDateTime,
    endDateTime: new Date(startDateTime.getTime() + 3 * HOUR),
    registrationDeadline: new Date(Date.now() + 5 * DAY),
    capacity: 10,
    registeredCount: 0,
    status: 'Upcoming',
    organizer: organizer.user._id,
    ...overrides,
  });
  return Event.findById(result.insertedId);
}

function register(eventId, user = student) {
  return request(app)
    .post('/api/registrations')
    .set('Authorization', user.header)
    .send({ eventId: String(eventId) });
}

async function expectRejected(res, status, code, event, expectedCount = 0) {
  expect(res.status).toBe(status);
  expect(res.body.error.code).toBe(code);
  expect(await Registration.countDocuments()).toBe(0);
  expect((await Event.findById(event._id)).registeredCount).toBe(expectedCount);
}

beforeAll(async () => {
  await db.connect();
  await Registration.init();
}, 120000);
afterEach(db.clear);
afterAll(db.close);

describe('POST /api/registrations', () => {
  test('TC-REG-01: an authenticated student can register', async () => {
    const event = await createEvent();

    const res = await register(event._id);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      student: student.user.id,
      event: String(event._id),
      status: 'Registered',
      attendanceStatus: 'Not Marked',
    });
    expect((await Event.findById(event._id)).registeredCount).toBe(1);
  });

  test('TC-REG-02: an unauthenticated user cannot register', async () => {
    const event = await createEvent();

    const res = await request(app)
      .post('/api/registrations')
      .send({ eventId: String(event._id) });

    await expectRejected(res, 401, 'UNAUTHENTICATED', event);
  });

  test('TC-REG-02: an organizer cannot register for an event', async () => {
    const event = await createEvent();

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', organizer.header)
      .send({ eventId: String(event._id) });

    await expectRejected(res, 403, 'FORBIDDEN', event);
  });

  test('TC-REG-03: a student cannot register twice for the same event', async () => {
    const event = await createEvent();

    const first = await register(event._id);
    const second = await register(event._id);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ALREADY_REGISTERED');
    expect(await Registration.countDocuments()).toBe(1);
    expect((await Event.findById(event._id)).registeredCount).toBe(1);
  });

  test('TC-REG-04: registration after the deadline is rejected', async () => {
    const event = await createEvent({ registrationDeadline: new Date(Date.now() - DAY) });

    const res = await register(event._id);

    await expectRejected(res, 409, 'DEADLINE_PASSED', event);
  });

  test('TC-REG-05: registration is rejected when the event is full', async () => {
    const event = await createEvent({ capacity: 1, registeredCount: 1 });

    const res = await register(event._id);

    await expectRejected(res, 409, 'EVENT_FULL', event, 1);
  });

  test('TC-REG-05: two students racing for the last seat - only one gets it', async () => {
    const event = await createEvent({ capacity: 1 });

    const [a, b] = await Promise.all([register(event._id, student), register(event._id, otherStudent)]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await Registration.countDocuments()).toBe(1);
    expect((await Event.findById(event._id)).registeredCount).toBe(1);
  });

  test('TC-STATUS-04: registration for a cancelled event is rejected', async () => {
    const event = await createEvent({ status: 'Cancelled' });

    const res = await register(event._id);

    await expectRejected(res, 409, 'EVENT_CANCELLED', event);
  });

  test('TC-REG-01: registration for an event that already started is rejected', async () => {
    const event = await createEvent({
      startDateTime: new Date(Date.now() - HOUR),
      endDateTime: new Date(Date.now() + HOUR),
      registrationDeadline: new Date(Date.now() - DAY),
    });

    const res = await register(event._id);

    await expectRejected(res, 409, 'EVENT_NOT_UPCOMING', event);
  });

  test('TC-REG-01: an unknown or malformed event id returns 404, a missing one returns 400', async () => {
    const unknown = await register(new mongoose.Types.ObjectId());
    const malformed = await register('not-an-id');
    const missing = await request(app)
      .post('/api/registrations')
      .set('Authorization', student.header)
      .send({});

    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('NOT_FOUND');
    expect(malformed.status).toBe(404);
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-REG-06: different students can register for the same event', async () => {
    const event = await createEvent();

    const first = await register(event._id, student);
    const second = await register(event._id, otherStudent);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await Registration.countDocuments()).toBe(2);
    expect((await Event.findById(event._id)).registeredCount).toBe(2);
  });
});

describe('GET /api/events/:eventId/participants', () => {
  test('TC-PART-01: the organizer sees the participants of their event with name and email', async () => {
    const event = await createEvent();
    const asha = await User.create(person('Asha'));
    const ravi = await User.create(person('Ravi'));
    await Registration.create({ student: asha._id, event: event._id });
    await Registration.create({ student: ravi._id, event: event._id });

    const res = await request(app).get(`/api/events/${event._id}/participants`).set('Authorization', organizer.header);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    const people = res.body.data.map((r) => ({ name: r.student.name, email: r.student.email }));
    expect(people).toEqual(expect.arrayContaining([
      { name: 'Asha', email: 'asha@pesu.pes.edu' },
      { name: 'Ravi', email: 'ravi@pesu.pes.edu' },
    ]));
  });

  test('TC-PART-04: only participants of this event are returned, and cancelled ones are left out', async () => {
    const event = await createEvent();
    const otherEvent = await createEvent({ title: 'Another Event' });
    const asha = await User.create(person('Asha'));
    const ravi = await User.create(person('Ravi'));
    const meena = await User.create(person('Meena'));
    await Registration.create({ student: asha._id, event: event._id });
    await Registration.create({ student: ravi._id, event: otherEvent._id });
    await Registration.create({ student: meena._id, event: event._id, status: 'Cancelled' });

    const res = await request(app).get(`/api/events/${event._id}/participants`).set('Authorization', organizer.header);

    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => r.student.name)).toEqual(['Asha']);
    expect(res.body.data[0].event).toBe(String(event._id));
  });

  test('TC-PART-01: an event with no registrations returns an empty list', async () => {
    const event = await createEvent();

    const res = await request(app).get(`/api/events/${event._id}/participants`).set('Authorization', organizer.header);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  test('TC-PART-03: an organizer cannot view another organizer\'s participants', async () => {
    const event = await createEvent();

    const res = await request(app)
      .get(`/api/events/${event._id}/participants`)
      .set('Authorization', (await createUser('Organizer')).header);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('TC-PART-03: a student cannot view participants', async () => {
    const event = await createEvent();

    const res = await request(app)
      .get(`/api/events/${event._id}/participants`)
      .set('Authorization', student.header);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('TC-PART-03: a logged-out user cannot view participants', async () => {
    const event = await createEvent();

    const res = await request(app)
      .get(`/api/events/${event._id}/participants`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  test('TC-PART-01: participants of an unknown event return 404', async () => {
    const res = await request(app).get(`/api/events/${new mongoose.Types.ObjectId()}/participants`).set('Authorization', organizer.header);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});