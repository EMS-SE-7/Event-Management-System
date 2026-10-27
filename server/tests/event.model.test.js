const mongoose = require('mongoose');
const Event = require('../src/models/Event');
const db = require('./helpers/db');

const DAY = 24 * 60 * 60 * 1000;

// A valid event 7 days from now. Each test overrides one field.
function validEvent(overrides = {}) {
  const start = new Date(Date.now() + 7 * DAY);
  return {
    title: 'Hackathon 2026',
    description: 'A 24 hour coding event',
    category: 'Technical',
    venue: 'MRD Auditorium',
    startDateTime: start,
    endDateTime: new Date(start.getTime() + 3 * 60 * 60 * 1000),
    registrationDeadline: new Date(start.getTime() - DAY),
    capacity: 100,
    organizer: new mongoose.Types.ObjectId(),
    ...overrides,
  };
}

// Returns the validation errors keyed by field, or {} if the event is valid.
async function errorsFor(data) {
  try {
    await new Event(data).validate();
    return {};
  } catch (err) {
    return err.errors;
  }
}

// The first run downloads MongoDB (~100 MB), so allow up to 2 minutes.
beforeAll(db.connect, 120000);
afterEach(db.clear);
afterAll(db.close);

describe('Event model', () => {
  test('TC-EVENT-02: a valid event passes validation', async () => {
    expect(await errorsFor(validEvent())).toEqual({});
  });

  test.each(['title', 'category', 'venue', 'startDateTime', 'endDateTime', 'registrationDeadline', 'capacity', 'organizer'])(
    'TC-EVENT-02: rejects an event with no %s',
    async (field) => {
      const errors = await errorsFor(validEvent({ [field]: undefined }));
      expect(errors[field]).toBeDefined();
      expect(errors[field].kind).toBe('required');
    }
  );

  test('TC-EVENT-02: rejects a title that is only spaces', async () => {
    const errors = await errorsFor(validEvent({ title: '   ' }));
    expect(errors.title).toBeDefined();
  });

  test('TC-EVENT-03: rejects a title longer than 100 characters', async () => {
    const errors = await errorsFor(validEvent({ title: 'a'.repeat(101) }));
    expect(errors.title).toBeDefined();
  });

  test('TC-EVENT-03: rejects a venue longer than 150 characters', async () => {
    const errors = await errorsFor(validEvent({ venue: 'a'.repeat(151) }));
    expect(errors.venue).toBeDefined();
  });

  test('TC-EVENT-03: rejects a description longer than 1000 characters', async () => {
    const errors = await errorsFor(validEvent({ description: 'a'.repeat(1001) }));
    expect(errors.description).toBeDefined();
  });

  test('TC-EVENT-03: rejects a category not in the list', async () => {
    const errors = await errorsFor(validEvent({ category: 'Party' }));
    expect(errors.category).toBeDefined();
  });

  test('TC-EVENT-03: trims spaces around title and venue', () => {
    const event = new Event(validEvent({ title: '  Hackathon  ', venue: ' MRD ' }));
    expect(event.title).toBe('Hackathon');
    expect(event.venue).toBe('MRD');
  });

  test('TC-EVENT-08: rejects a start date in the past', async () => {
    const start = new Date(Date.now() - DAY);
    const errors = await errorsFor(
      validEvent({
        startDateTime: start,
        endDateTime: new Date(start.getTime() + DAY / 2),
        registrationDeadline: new Date(Date.now() + 60 * 1000),
      })
    );
    expect(errors.startDateTime).toBeDefined();
  });

  test('TC-EVENT-08: rejects an end date before the start', async () => {
    const event = validEvent();
    const errors = await errorsFor({ ...event, endDateTime: new Date(event.startDateTime.getTime() - 60 * 1000) });
    expect(errors.endDateTime).toBeDefined();
  });

  test('TC-EVENT-08: rejects an end date equal to the start', async () => {
    const event = validEvent();
    const errors = await errorsFor({ ...event, endDateTime: event.startDateTime });
    expect(errors.endDateTime).toBeDefined();
  });

  test('TC-EVENT-08: rejects a registration deadline in the past', async () => {
    const errors = await errorsFor(validEvent({ registrationDeadline: new Date(Date.now() - 60 * 1000) }));
    expect(errors.registrationDeadline).toBeDefined();
  });

  test('TC-EVENT-08: rejects a registration deadline after the start', async () => {
    const event = validEvent();
    const errors = await errorsFor({ ...event, registrationDeadline: new Date(event.startDateTime.getTime() + 60 * 1000) });
    expect(errors.registrationDeadline).toBeDefined();
  });

  test('TC-EVENT-08: rejects an invalid date string', async () => {
    const errors = await errorsFor(validEvent({ startDateTime: 'not a date' }));
    expect(errors.startDateTime).toBeDefined();
  });

  test.each([0, -5, 2.5, 100000, 'abc'])('TC-EVENT-08: rejects capacity of %p', async (capacity) => {
    const errors = await errorsFor(validEvent({ capacity }));
    expect(errors.capacity).toBeDefined();
  });

  test.each([1, 99999])('TC-EVENT-08: accepts capacity of %p', async (capacity) => {
    expect(await errorsFor(validEvent({ capacity }))).toEqual({});
  });

  test('TC-EVENT-08: rejects capacity lower than the registered count', async () => {
    const errors = await errorsFor(validEvent({ capacity: 5, registeredCount: 6 }));
    expect(errors.registeredCount).toBeDefined();
  });

  test('TC-EVENT-06: a new event is saved with status Upcoming and 0 registered', async () => {
    const saved = await Event.create(validEvent());
    const found = await Event.findById(saved._id);
    expect(found.status).toBe('Upcoming');
    expect(found.registeredCount).toBe(0);
    expect(found.createdAt).toBeInstanceOf(Date);
  });

  test('TC-STATUS-01: only Upcoming and Cancelled can be stored as status', async () => {
    expect(await errorsFor(validEvent({ status: 'Cancelled' }))).toEqual({});
    for (const status of ['Ongoing', 'Completed', 'Postponed']) {
      const errors = await errorsFor(validEvent({ status }));
      expect(errors.status).toBeDefined();
    }
  });

  test('TC-STATUS-01: an event that has already started can still be cancelled', async () => {
    const saved = await Event.create(validEvent());
    // Move the start into the past directly in the database, as if time had passed.
    await Event.collection.updateOne(
      { _id: saved._id },
      { $set: { startDateTime: new Date(Date.now() - DAY), registrationDeadline: new Date(Date.now() - 2 * DAY) } }
    );
    const event = await Event.findById(saved._id);
    event.status = 'Cancelled';
    await expect(event.save()).resolves.toBeDefined();
  });
});
