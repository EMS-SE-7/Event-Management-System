// Integration: HTTP request -> auth middleware -> role check -> controller.
// Only the database layer (Mongoose models) is mocked.
jest.mock('../../src/models/Registration', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../../src/models/Event', () => ({ find: jest.fn(), findById: jest.fn() }));

process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/index');
const Registration = require('../../src/models/Registration');
const Event = require('../../src/models/Event');

const tokenFor = (id, role, secret = 'test-secret') => jwt.sign({ id, role }, secret);
const organizer = `Bearer ${tokenFor('org1', 'Organizer')}`;
const student = `Bearer ${tokenFor('stu1', 'Student')}`;

beforeEach(() => jest.resetAllMocks());

describe('PATCH /api/attendance/:registrationId', () => {
  const mockOwnedRegistration = () => {
    const reg = { event: 'e1', status: 'Active', attendanceStatus: 'Not Marked', save: jest.fn() };
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'org1', status: 'Upcoming' });
    return reg;
  };

  test('401 without a token', async () => {
    const res = await request(app).patch('/api/attendance/r1').send({ status: 'Present' });
    expect(res.status).toBe(401);
  });

  test('401 with a tampered token', async () => {
    const res = await request(app)
      .patch('/api/attendance/r1')
      .set('Authorization', `Bearer ${tokenFor('org1', 'Organizer', 'wrong-secret')}`)
      .send({ status: 'Present' });
    expect(res.status).toBe(401);
  });

  test('403 when a student tries to mark attendance (ATT-06)', async () => {
    const res = await request(app)
      .patch('/api/attendance/r1')
      .set('Authorization', student)
      .send({ status: 'Present' });
    expect(res.status).toBe(403);
    expect(Registration.findById).not.toHaveBeenCalled();
  });

  test('200 when the event organizer marks Present (ATT-01)', async () => {
    const reg = mockOwnedRegistration();
    const res = await request(app)
      .patch('/api/attendance/r1')
      .set('Authorization', organizer)
      .send({ status: 'Present' });

    expect(res.status).toBe(200);
    expect(res.body.registration.attendanceStatus).toBe('Present');
    expect(reg.save).toHaveBeenCalled();
  });

  test('200 when the organizer marks Absent (ATT-02)', async () => {
    mockOwnedRegistration();
    const res = await request(app)
      .patch('/api/attendance/r1')
      .set('Authorization', organizer)
      .send({ status: 'Absent' });

    expect(res.status).toBe(200);
    expect(res.body.registration.attendanceStatus).toBe('Absent');
  });

  test('a second call changes the stored status (ATT-05)', async () => {
    const reg = mockOwnedRegistration();
    const send = (status) => request(app)
      .patch('/api/attendance/r1')
      .set('Authorization', organizer)
      .send({ status });

    await send('Absent');
    const res = await send('Present');

    expect(res.status).toBe(200);
    expect(reg.attendanceStatus).toBe('Present');
    expect(reg.save).toHaveBeenCalledTimes(2);
  });

  test('403 when a different organizer tries it (ATT-06)', async () => {
    const reg = { event: 'e1', status: 'Active', save: jest.fn() };
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'org2', status: 'Upcoming' });

    const res = await request(app)
      .patch('/api/attendance/r1')
      .set('Authorization', organizer)
      .send({ status: 'Present' });

    expect(res.status).toBe(403);
    expect(reg.save).not.toHaveBeenCalled();
  });

  test('400 for an invalid status value', async () => {
    const res = await request(app)
      .patch('/api/attendance/r1')
      .set('Authorization', organizer)
      .send({ status: 'Late' });
    expect(res.status).toBe(400);
  });

  test('404 for an unknown registration', async () => {
    Registration.findById.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/attendance/r1')
      .set('Authorization', organizer)
      .send({ status: 'Present' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/attendance/event/:eventId', () => {
  test('returns the participant list to the owner', async () => {
    Event.findById.mockResolvedValue({ _id: 'e1', title: 'Hackathon', organizer: 'org1' });
    Registration.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        { _id: 'r1', student: { name: 'Asha', email: 'asha@pes.edu' }, attendanceStatus: 'Not Marked' }
      ])
    });

    const res = await request(app).get('/api/attendance/event/e1').set('Authorization', organizer);

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('Hackathon');
    expect(res.body.registrations).toHaveLength(1);
  });

  test('403 for a student', async () => {
    const res = await request(app).get('/api/attendance/event/e1').set('Authorization', student);
    expect(res.status).toBe(403);
  });

  test('403 for an organizer who does not own the event', async () => {
    Event.findById.mockResolvedValue({ _id: 'e1', organizer: 'org2' });
    const res = await request(app).get('/api/attendance/event/e1').set('Authorization', organizer);
    expect(res.status).toBe(403);
  });

  test('404 for an unknown event', async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/attendance/event/e1').set('Authorization', organizer);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/attendance/events', () => {
  test('returns the organizer\'s events', async () => {
    Event.find.mockResolvedValue([{ _id: 'e1', title: 'Hackathon', status: 'Upcoming' }]);
    Registration.countDocuments.mockResolvedValue(2);

    const res = await request(app).get('/api/attendance/events').set('Authorization', organizer);

    expect(res.status).toBe(200);
    expect(res.body.events[0]).toMatchObject({ title: 'Hackathon', registered: 2 });
  });

  test('403 for a student', async () => {
    const res = await request(app).get('/api/attendance/events').set('Authorization', student);
    expect(res.status).toBe(403);
  });
});
