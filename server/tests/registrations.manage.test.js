const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Event = require('../src/models/Event');
const Registration = require('../src/models/Registration');
const { DEFAULT_USER_ID } = require('../src/middleware/authStub');
const db = require('./helpers/db');

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const STUDENT_ID = new mongoose.Types.ObjectId().toString();
const OTHER_STUDENT_ID = new mongoose.Types.ObjectId().toString();

// Inserted directly so tests can also create started or cancelled events.
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
    organizer: new mongoose.Types.ObjectId(DEFAULT_USER_ID),
    ...overrides,
  });
  return Event.findById(result.insertedId);
}

function student(studentId) {
  return { 'x-stub-role': 'student', 'x-stub-user-id': studentId };
}

function register(eventId, studentId = STUDENT_ID) {
  return request(app).post('/api/registrations').set(student(studentId)).send({ eventId: String(eventId) });
}

function cancel(registrationId, studentId = STUDENT_ID) {
  return request(app).patch(`/api/registrations/${registrationId}/cancel`).set(student(studentId));
}

function mine(studentId = STUDENT_ID, query = {}) {
  return request(app).get('/api/registrations/mine').set(student(studentId)).query(query);
}

async function seats(event) {
  return (await Event.findById(event._id)).registeredCount;
}

beforeAll(async () => {
  await db.connect();
  await Registration.init();
}, 120000);
afterEach(db.clear);
afterAll(db.close);

describe('PATCH /api/registrations/:id/cancel', () => {
  test('TC-REG-07: a student can cancel their registration, and the record is kept', async () => {
    const event = await createEvent();
    const registered = await register(event._id);

    const res = await cancel(registered.body.data._id);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Cancelled');
    expect(await Registration.countDocuments()).toBe(1);
    expect((await Registration.findById(registered.body.data._id)).status).toBe('Cancelled');
  });

  test('TC-REG-08: cancelling gives the seat back', async () => {
    const event = await createEvent();
    const registered = await register(event._id);
    expect(await seats(event)).toBe(1);

    await cancel(registered.body.data._id);

    expect(await seats(event)).toBe(0);
  });

  test('TC-REG-08: a seat freed by a cancellation can be taken by another student', async () => {
    const event = await createEvent({ capacity: 1 });
    const first = await register(event._id, STUDENT_ID);
    const blocked = await register(event._id, OTHER_STUDENT_ID);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('EVENT_FULL');

    await cancel(first.body.data._id, STUDENT_ID);
    const second = await register(event._id, OTHER_STUDENT_ID);

    expect(second.status).toBe(201);
    expect(await seats(event)).toBe(1);
  });

  test('TC-REG-07: a student cannot cancel someone else\'s registration', async () => {
    const event = await createEvent();
    const registered = await register(event._id, STUDENT_ID);

    const res = await cancel(registered.body.data._id, OTHER_STUDENT_ID);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect((await Registration.findById(registered.body.data._id)).status).toBe('Registered');
    expect(await seats(event)).toBe(1);
  });

  test('TC-REG-07: an organizer cannot use the student cancel route', async () => {
    const event = await createEvent();
    const registered = await register(event._id);

    const res = await request(app)
      .patch(`/api/registrations/${registered.body.data._id}/cancel`)
      .set('x-stub-role', 'organizer');

    expect(res.status).toBe(403);
  });

  test('TC-REG-07: a logged-out user cannot cancel', async () => {
    const event = await createEvent();
    const registered = await register(event._id);

    const res = await request(app)
      .patch(`/api/registrations/${registered.body.data._id}/cancel`)
      .set('x-stub-role', 'none');

    expect(res.status).toBe(401);
  });

  test('TC-REG-07: an unknown or malformed registration id returns 404', async () => {
    const unknown = await cancel(new mongoose.Types.ObjectId());
    const malformed = await cancel('not-an-id');

    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('NOT_FOUND');
    expect(malformed.status).toBe(404);
  });

  test('TC-REG-08: cancelling twice gives the seat back only once', async () => {
    const event = await createEvent();
    const mine1 = await register(event._id, STUDENT_ID);
    await register(event._id, OTHER_STUDENT_ID);
    expect(await seats(event)).toBe(2);

    const first = await cancel(mine1.body.data._id);
    const second = await cancel(mine1.body.data._id);

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ALREADY_CANCELLED');
    expect(await seats(event)).toBe(1);
  });

  test('TC-REG-07: a registration cannot be cancelled after the event has started', async () => {
    const event = await createEvent({
      startDateTime: new Date(Date.now() - HOUR),
      endDateTime: new Date(Date.now() + HOUR),
      registrationDeadline: new Date(Date.now() - DAY),
      registeredCount: 1,
    });
    const registration = await Registration.create({ student: STUDENT_ID, event: event._id });

    const res = await cancel(registration._id);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EVENT_NOT_UPCOMING');
    expect((await Registration.findById(registration._id)).status).toBe('Registered');
    expect(await seats(event)).toBe(1);
  });

  test('TC-REG-03: after cancelling, the student can register again using the same record', async () => {
    const event = await createEvent();
    const first = await register(event._id);
    await cancel(first.body.data._id);

    const again = await register(event._id);

    expect(again.status).toBe(201);
    expect(again.body.data.status).toBe('Registered');
    expect(again.body.data._id).toBe(first.body.data._id);
    expect(await Registration.countDocuments()).toBe(1);
    expect(await seats(event)).toBe(1);
  });
});

describe('GET /api/registrations/mine', () => {
  test('TC-HIST-01: a student sees only their own registrations, with event details', async () => {
    const alpha = await createEvent({ title: 'Alpha' });
    const beta = await createEvent({ title: 'Beta' });
    await register(alpha._id, STUDENT_ID);
    await register(beta._id, STUDENT_ID);
    await register(alpha._id, OTHER_STUDENT_ID);

    const res = await mine(STUDENT_ID);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.every((r) => r.student === STUDENT_ID)).toBe(true);
    expect(res.body.data.map((r) => r.event.title).sort()).toEqual(['Alpha', 'Beta']);
  });

  test('TC-HIST-03: each registration carries the event details, status and seats left', async () => {
    const event = await createEvent({ title: 'Alpha', venue: 'Lab 9', capacity: 5 });
    await register(event._id);

    const res = await mine();

    expect(res.body.data[0].event).toMatchObject({
      title: 'Alpha',
      venue: 'Lab 9',
      status: 'Upcoming',
      seatsLeft: 4,
    });
  });

  test('TC-HIST-02/04: the status is shown and active and cancelled registrations can be told apart', async () => {
    const alpha = await createEvent({ title: 'Alpha' });
    const beta = await createEvent({ title: 'Beta' });
    const first = await register(alpha._id);
    await register(beta._id);
    await cancel(first.body.data._id);

    const res = await mine();
    const byTitle = Object.fromEntries(res.body.data.map((r) => [r.event.title, r]));

    expect(byTitle.Alpha.status).toBe('Cancelled');
    expect(byTitle.Alpha.isActive).toBe(false);
    expect(byTitle.Beta.status).toBe('Registered');
    expect(byTitle.Beta.isActive).toBe(true);
  });

  test('TC-HIST-04: the status filter returns only active or only cancelled registrations', async () => {
    const alpha = await createEvent({ title: 'Alpha' });
    const beta = await createEvent({ title: 'Beta' });
    const first = await register(alpha._id);
    await register(beta._id);
    await cancel(first.body.data._id);

    const active = await mine(STUDENT_ID, { status: 'Registered' });
    const cancelled = await mine(STUDENT_ID, { status: 'Cancelled' });

    expect(active.body.data.map((r) => r.event.title)).toEqual(['Beta']);
    expect(cancelled.body.data.map((r) => r.event.title)).toEqual(['Alpha']);
  });

  test('TC-HIST-04: an invalid status filter is rejected', async () => {
    const res = await mine(STUDENT_ID, { status: 'Maybe' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-HIST-03: an event cancelled by its organizer shows as Cancelled in the history', async () => {
    const event = await createEvent({ title: 'Called off', status: 'Cancelled' });
    await Registration.create({ student: STUDENT_ID, event: event._id });

    const res = await mine();

    expect(res.body.data[0].event.status).toBe('Cancelled');
  });

  test('TC-HIST-01: a student with no registrations gets an empty list', async () => {
    const res = await mine();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  test('TC-HIST-01: organizers and logged-out users cannot read a student history', async () => {
    const organizer = await request(app).get('/api/registrations/mine').set('x-stub-role', 'organizer');
    const loggedOut = await request(app).get('/api/registrations/mine').set('x-stub-role', 'none');

    expect(organizer.status).toBe(403);
    expect(loggedOut.status).toBe(401);
  });
});