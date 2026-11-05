// Integration: HTTP request -> auth middleware -> role check -> report controller.
// Only the database layer (Mongoose models) is mocked.
jest.mock('../../src/models/Registration', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../../src/models/Event', () => ({ find: jest.fn(), findById: jest.fn() }));
// The real auth middleware loads the user from the token's id, so User is mocked too.
jest.mock('../../src/models/User', () => ({ findById: jest.fn() }));

process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/index');
const Registration = require('../../src/models/Registration');
const Event = require('../../src/models/Event');
const User = require('../../src/models/User');

const tokenFor = (id, role) => jwt.sign({ id, role }, 'test-secret');
const organizer = `Bearer ${tokenFor('org1', 'Organizer')}`;
const student = `Bearer ${tokenFor('stu1', 'Student')}`;

const reg = (attendanceStatus, status = 'Registered') => ({ status, attendanceStatus });

function mockRegistrations(list) {
  Registration.find.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(list) });
}

const USERS = {
  org1: { id: 'org1', role: 'Organizer' },
  org2: { id: 'org2', role: 'Organizer' },
  stu1: { id: 'stu1', role: 'Student' },
};

beforeEach(() => {
  jest.resetAllMocks();
  User.findById.mockImplementation(async (id) => USERS[id] || null);
});

describe('GET /api/reports/event/:eventId', () => {
  test('organizer gets registration and attendance statistics', async () => {
    Event.findById.mockResolvedValue({ _id: 'e1', title: 'Hackathon', capacity: 3, organizer: 'org1' });
    mockRegistrations([reg('Present'), reg('Absent'), reg('Present')]);

    const res = await request(app).get('/api/reports/event/e1').set('Authorization', organizer);

    expect(res.status).toBe(200);
    expect(res.body.registration.total).toBe(3);
    expect(res.body.registration.fillRate).toBe(100);
    expect(res.body.attendance.present).toBe(2);
    expect(res.body.attendance.absent).toBe(1);
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/reports/event/e1');
    expect(res.status).toBe(401);
  });

  test('403 for a student', async () => {
    const res = await request(app).get('/api/reports/event/e1').set('Authorization', student);
    expect(res.status).toBe(403);
    expect(Event.findById).not.toHaveBeenCalled();
  });

  test('403 for an organizer who does not own the event', async () => {
    Event.findById.mockResolvedValue({ _id: 'e1', title: 'Hackathon', capacity: 3, organizer: 'org2' });
    const res = await request(app).get('/api/reports/event/e1').set('Authorization', organizer);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('404 for an unknown event', async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/reports/event/e1').set('Authorization', organizer);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/reports/events', () => {
  test('returns a report per event and the totals', async () => {
    Event.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: 'e1', title: 'Hackathon', capacity: 10 }])
    });
    mockRegistrations([reg('Present'), reg('Absent'), reg('Not Marked', 'Cancelled')]);

    const res = await request(app).get('/api/reports/events').set('Authorization', organizer);

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.totals).toEqual({ registrations: 2, present: 1, absent: 1 });
  });

  test('403 for a student', async () => {
    const res = await request(app).get('/api/reports/events').set('Authorization', student);
    expect(res.status).toBe(403);
  });
});
