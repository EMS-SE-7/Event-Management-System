const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Event = require('../src/models/Event');
const db = require('./helpers/db');
const { createUser } = require('./helpers/auth');

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

let organizer, other, student;
beforeEach(async () => {
  organizer = await createUser('Organizer');
  other = await createUser('Organizer');
  student = await createUser('Student');
});

// Supertest calls made as a logged-in user (the organizer unless told otherwise).
const api = (user = organizer) => ({
  get: (url) => request(app).get(url).set('Authorization', user.header),
  patch: (url) => request(app).patch(url).set('Authorization', user.header),
});

// Saves an event owned by the organizer (7 days from now).
async function makeEvent(overrides = {}) {
  const start = new Date(Date.now() + 7 * DAY);
  return Event.create({
    title: 'Hackathon 2026',
    description: 'A 24 hour coding event',
    category: 'Technical',
    venue: 'MRD Auditorium',
    startDateTime: start,
    endDateTime: new Date(start.getTime() + 3 * HOUR),
    registrationDeadline: new Date(start.getTime() - DAY),
    capacity: 100,
    organizer: organizer.user.id,
    ...overrides,
  });
}

// Saves an event that has already finished (skips the "must be in the future" rule).
async function makeCompletedEvent() {
  const start = new Date(Date.now() - 3 * DAY);
  const result = await Event.collection.insertOne({
    title: 'Old Seminar',
    category: 'Seminar',
    venue: 'Room 1',
    startDateTime: start,
    endDateTime: new Date(start.getTime() + 2 * HOUR),
    registrationDeadline: new Date(start.getTime() - DAY),
    capacity: 10,
    registeredCount: 0,
    status: 'Upcoming',
    organizer: organizer.user._id,
  });
  return result.insertedId;
}

beforeAll(db.connect, 120000);
afterEach(db.clear);
afterAll(db.close);

describe('GET /api/events search and category filter', () => {
  beforeEach(async () => {
    await makeEvent({ title: 'Hackathon 2026', category: 'Technical', venue: 'Lab 1' });
    await makeEvent({ title: 'Dance Night', category: 'Cultural', description: 'Annual dance show', venue: 'Main Hall' });
    await makeEvent({ title: 'Robotics Workshop', category: 'Workshop', venue: 'Lab 2' });
  });

  test('TC-DISC-02: search finds events by title, ignoring case', async () => {
    const res = await api().get('/api/events').query({ search: 'HACKATHON' });

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].title).toBe('Hackathon 2026');
  });

  test('TC-DISC-02: search also looks at description and venue', async () => {
    const byDescription = await api().get('/api/events').query({ search: 'dance show' });
    const byVenue = await api().get('/api/events').query({ search: 'Lab 2' });

    expect(byDescription.body.data.map((e) => e.title)).toEqual(['Dance Night']);
    expect(byVenue.body.data.map((e) => e.title)).toEqual(['Robotics Workshop']);
  });

  test('TC-DISC-02: search with no match returns an empty list', async () => {
    const res = await api().get('/api/events').query({ search: 'zzzz' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  test('TC-DISC-02: special characters in search do not break the request', async () => {
    const res = await api().get('/api/events').query({ search: '(' });

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });

  test('TC-DISC-03: category filter returns only that category', async () => {
    const res = await api().get('/api/events').query({ category: 'Cultural' });

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].category).toBe('Cultural');
  });

  test('TC-DISC-02/03: search and category can be combined', async () => {
    const match = await api().get('/api/events').query({ search: 'lab', category: 'Workshop' });
    const noMatch = await api().get('/api/events').query({ search: 'hackathon', category: 'Cultural' });

    expect(match.body.data.map((e) => e.title)).toEqual(['Robotics Workshop']);
    expect(noMatch.body.meta.total).toBe(0);
  });

  test('TC-DISC-01: no filters still returns every event', async () => {
    const res = await api().get('/api/events');

    expect(res.body.meta.total).toBe(3);
  });
});

describe('GET /api/events/mine', () => {
  test('TC-EVENT-07: returns only the logged-in organizer\'s events', async () => {
    await makeEvent({ title: 'Mine' });
    await makeEvent({ title: 'Theirs', organizer: other.user.id });

    const mine = await api().get('/api/events/mine');
    const theirs = await api(other).get('/api/events/mine');

    expect(mine.status).toBe(200);
    expect(mine.body.data.map((e) => e.title)).toEqual(['Mine']);
    expect(theirs.body.data.map((e) => e.title)).toEqual(['Theirs']);
  });

  test('TC-EVENT-07: a student cannot use My Events', async () => {
    const res = await api(student).get('/api/events/mine');

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/events/:id (edit)', () => {
  test('TC-EVENT-04: the owner can edit an event', async () => {
    const event = await makeEvent();

    const res = await api()
      .patch(`/api/events/${event._id}`)
      .send({ title: 'Hackathon 2027', venue: 'Lab 5', capacity: 150 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Hackathon 2027', venue: 'Lab 5', capacity: 150 });
    const saved = await Event.findById(event._id);
    expect(saved.title).toBe('Hackathon 2027');
  });

  test('TC-EVENT-07: another organizer cannot edit the event', async () => {
    const event = await makeEvent();

    const res = await api(other).patch(`/api/events/${event._id}`).send({ title: 'Hacked' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect((await Event.findById(event._id)).title).toBe('Hackathon 2026');
  });

  test('TC-EVENT-07: a student cannot edit an event', async () => {
    const event = await makeEvent();

    const res = await api(student).patch(`/api/events/${event._id}`).send({ title: 'Nope' });

    expect(res.status).toBe(403);
  });

  test('TC-EVENT-07: a logged-out user cannot edit an event', async () => {
    const event = await makeEvent();

    const res = await request(app).patch(`/api/events/${event._id}`).send({ title: 'Nope' });

    expect(res.status).toBe(401);
  });

  test('TC-EVENT-04: editing a missing or malformed id returns 404', async () => {
    const missing = await api().patch(`/api/events/${new mongoose.Types.ObjectId()}`).send({ title: 'x' });
    const malformed = await api().patch('/api/events/not-an-id').send({ title: 'x' });

    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(404);
  });

  test('TC-EVENT-07: organizer, status and registeredCount cannot be changed through an edit', async () => {
    const event = await makeEvent();

    const res = await api()
      .patch(`/api/events/${event._id}`)
      .send({ title: 'Renamed', organizer: other.user.id, status: 'Cancelled', registeredCount: 50 });

    expect(res.status).toBe(200);
    const saved = await Event.findById(event._id);
    expect(saved.title).toBe('Renamed');
    expect(String(saved.organizer)).toBe(organizer.user.id);
    expect(saved.status).toBe('Upcoming');
    expect(saved.registeredCount).toBe(0);
  });

  test('TC-EVENT-08: an edit with an invalid capacity is rejected', async () => {
    const event = await makeEvent();

    const zero = await api().patch(`/api/events/${event._id}`).send({ capacity: 0 });
    const decimal = await api().patch(`/api/events/${event._id}`).send({ capacity: 10.5 });

    expect(zero.status).toBe(400);
    expect(decimal.status).toBe(400);
    expect((await Event.findById(event._id)).capacity).toBe(100);
  });

  test('TC-EVENT-08: capacity cannot be lowered below the registered count', async () => {
    const event = await makeEvent({ capacity: 10, registeredCount: 8 });

    const res = await api().patch(`/api/events/${event._id}`).send({ capacity: 5 });

    expect(res.status).toBe(400);
    expect((await Event.findById(event._id)).capacity).toBe(10);
  });

  test('TC-EVENT-08: an edit cannot put the end before the start', async () => {
    const event = await makeEvent();
    const before = new Date(event.startDateTime.getTime() - HOUR).toISOString();

    const res = await api().patch(`/api/events/${event._id}`).send({ endDateTime: before });

    expect(res.status).toBe(400);
  });

  test('TC-EVENT-08: an edit cannot move the start into the past', async () => {
    const event = await makeEvent();
    const yesterday = new Date(Date.now() - DAY).toISOString();

    const res = await api().patch(`/api/events/${event._id}`).send({ startDateTime: yesterday });

    expect(res.status).toBe(400);
  });

  test('TC-EVENT-08: an edit cannot put the registration deadline after the start', async () => {
    const event = await makeEvent();
    const late = new Date(event.startDateTime.getTime() + HOUR).toISOString();

    const res = await api().patch(`/api/events/${event._id}`).send({ registrationDeadline: late });

    expect(res.status).toBe(400);
  });

  test('TC-EVENT-04: a cancelled event cannot be edited', async () => {
    const event = await makeEvent({ status: 'Cancelled' });

    const res = await api().patch(`/api/events/${event._id}`).send({ title: 'Revived' });

    expect(res.status).toBe(409);
  });

  test('TC-EVENT-04: a completed event cannot be edited', async () => {
    const id = await makeCompletedEvent();

    const res = await api().patch(`/api/events/${id}`).send({ title: 'Changed' });

    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/events/:id/cancel', () => {
  test('TC-EVENT-05: the owner can cancel an event', async () => {
    const event = await makeEvent();

    const res = await api().patch(`/api/events/${event._id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Cancelled');
    expect((await Event.findById(event._id)).status).toBe('Cancelled');
  });

  test('TC-EVENT-05: a cancelled event stays in the database and shows as Cancelled', async () => {
    const event = await makeEvent();
    await api().patch(`/api/events/${event._id}/cancel`);

    const res = await api().get(`/api/events/${event._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Cancelled');
    expect(res.body.data.registrationOpen).toBe(false);
  });

  test('TC-EVENT-07: another organizer cannot cancel the event', async () => {
    const event = await makeEvent();

    const res = await api(other).patch(`/api/events/${event._id}/cancel`);

    expect(res.status).toBe(403);
    expect((await Event.findById(event._id)).status).toBe('Upcoming');
  });

  test('TC-EVENT-07: a student cannot cancel an event', async () => {
    const event = await makeEvent();

    const res = await api(student).patch(`/api/events/${event._id}/cancel`);

    expect(res.status).toBe(403);
  });

  test('TC-EVENT-07: a logged-out user cannot cancel an event', async () => {
    const event = await makeEvent();

    const res = await request(app).patch(`/api/events/${event._id}/cancel`);

    expect(res.status).toBe(401);
  });

  test('TC-EVENT-05: cancelling a missing event returns 404', async () => {
    const res = await api().patch(`/api/events/${new mongoose.Types.ObjectId()}/cancel`);

    expect(res.status).toBe(404);
  });

  test('TC-EVENT-05: cancelling an already cancelled event returns 409', async () => {
    const event = await makeEvent({ status: 'Cancelled' });

    const res = await api().patch(`/api/events/${event._id}/cancel`);

    expect(res.status).toBe(409);
  });

  test('TC-EVENT-05: a completed event cannot be cancelled', async () => {
    const id = await makeCompletedEvent();

    const res = await api().patch(`/api/events/${id}/cancel`);

    expect(res.status).toBe(409);
  });
});