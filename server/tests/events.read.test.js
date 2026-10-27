const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Event = require('../src/models/Event');
const db = require('./helpers/db');
const { createUser } = require('./helpers/auth');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Saves an event straight to the database, skipping the "must be in the future"
// rules, so tests can also create ongoing, completed and past-deadline events.
// startsIn is in milliseconds from now (negative = already started).
async function insertEvent({ startsIn = 7 * DAY, ...overrides } = {}) {
  const start = new Date(Date.now() + startsIn);
  const event = new Event({
    title: 'Hackathon',
    category: 'Technical',
    venue: 'MRD Auditorium',
    startDateTime: start,
    endDateTime: new Date(start.getTime() + 3 * HOUR),
    registrationDeadline: new Date(start.getTime() - DAY),
    capacity: 10,
    organizer: new mongoose.Types.ObjectId(),
    ...overrides,
  });
  await Event.collection.insertOne(event.toObject());
  return event;
}

beforeAll(db.connect, 120000);
afterEach(db.clear);
afterAll(db.close);

let student;
beforeEach(async () => {
  student = await createUser('Student');
});

const get = (url) => request(app).get(url).set('Authorization', student.header);

describe('GET /api/events', () => {
  test('TC-DISC-01: lists events soonest first, with paging info', async () => {
    await insertEvent({ title: 'Later', startsIn: 10 * DAY });
    await insertEvent({ title: 'Sooner', startsIn: 2 * DAY });
    await insertEvent({ title: 'Middle', startsIn: 5 * DAY });

    const res = await get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.title)).toEqual(['Sooner', 'Middle', 'Later']);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 3 });
  });

  test('TC-DISC-01: returns an empty list when there are no events', async () => {
    const res = await get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  test('TC-DISC-01: page and limit pick the right slice', async () => {
    for (let i = 1; i <= 5; i++) {
      await insertEvent({ title: `Event ${i}`, startsIn: i * DAY });
    }

    const res = await get('/api/events?page=2&limit=2');

    expect(res.body.data.map((e) => e.title)).toEqual(['Event 3', 'Event 4']);
    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 5 });
  });

  test('TC-DISC-01: students can browse events too', async () => {
    await insertEvent();

    const res = await get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('TC-DISC-01: browsing without login is refused (401)', async () => {
    const res = await request(app).get('/api/events');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  test('TC-DISC-05: each event shows its calculated status', async () => {
    await insertEvent({ title: 'Soon', startsIn: 2 * DAY });
    await insertEvent({ title: 'Now', startsIn: -HOUR });
    await insertEvent({ title: 'Done', startsIn: -2 * DAY });
    await insertEvent({ title: 'Called off', startsIn: 3 * DAY, status: 'Cancelled' });

    const res = await get('/api/events');
    const statusByTitle = Object.fromEntries(res.body.data.map((e) => [e.title, e.status]));

    expect(statusByTitle).toEqual({ Soon: 'Upcoming', Now: 'Ongoing', Done: 'Completed', 'Called off': 'Cancelled' });
  });

  test('TC-DISC-06: each event shows seats left and whether registration is open', async () => {
    await insertEvent({ title: 'Open', registeredCount: 4 });
    await insertEvent({ title: 'Full', registeredCount: 10 });

    const res = await get('/api/events');
    const byTitle = Object.fromEntries(res.body.data.map((e) => [e.title, e]));

    expect(byTitle.Open).toMatchObject({ seatsLeft: 6, isFull: false, registrationOpen: true });
    expect(byTitle.Full).toMatchObject({ seatsLeft: 0, isFull: true, registrationOpen: false });
  });
});

describe('GET /api/events/:id', () => {
  test('TC-DISC-04: returns the details of one event', async () => {
    const event = await insertEvent({ title: 'Robotics Workshop', category: 'Workshop', description: 'Build a line follower' });

    const res = await get(`/api/events/${event._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      _id: event._id.toString(),
      title: 'Robotics Workshop',
      category: 'Workshop',
      description: 'Build a line follower',
      venue: 'MRD Auditorium',
      capacity: 10,
      status: 'Upcoming',
      seatsLeft: 10,
      isFull: false,
      registrationOpen: true,
    });
  });

  test('TC-DISC-06: registration is shown as closed after the deadline', async () => {
    const event = await insertEvent({ startsIn: 12 * HOUR }); // deadline was 12 hours ago

    const res = await get(`/api/events/${event._id}`);

    expect(res.body.data.status).toBe('Upcoming');
    expect(res.body.data.registrationOpen).toBe(false);
  });

  test('TC-DISC-04: an id that does not exist returns 404', async () => {
    const res = await get(`/api/events/${new mongoose.Types.ObjectId()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('TC-DISC-04: an id that is not a valid id returns 404', async () => {
    const res = await get('/api/events/not-an-id');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('TC-DISC-04: viewing without login is refused (401)', async () => {
    const event = await insertEvent();

    const res = await request(app).get(`/api/events/${event._id}`);

    expect(res.status).toBe(401);
  });
});
