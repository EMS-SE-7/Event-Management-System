jest.mock('../../src/models/Registration', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../../src/models/Event', () => ({ find: jest.fn(), findById: jest.fn() }));

const Registration = require('../../src/models/Registration');
const Event = require('../../src/models/Event');
const {
  getMyEvents,
  getEventAttendance,
  markAttendance
} = require('../../src/controllers/attendanceController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.resetAllMocks());

describe('markAttendance', () => {
  const makeReq = (status) => ({
    params: { registrationId: 'r1' },
    body: { status },
    user: { id: 'org1', role: 'Organizer' }
  });

  const activeReg = (extra = {}) => ({
    event: 'e1',
    status: 'Active',
    attendanceStatus: 'Not Marked',
    save: jest.fn(),
    ...extra
  });

  test('marks a student Present (ATT-01)', async () => {
    const reg = activeReg();
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'org1', status: 'Upcoming' });
    const res = mockRes();

    await markAttendance(makeReq('Present'), res);

    expect(reg.attendanceStatus).toBe('Present');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('marks a student Absent (ATT-02)', async () => {
    const reg = activeReg();
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'org1', status: 'Upcoming' });

    await markAttendance(makeReq('Absent'), mockRes());

    expect(reg.attendanceStatus).toBe('Absent');
  });

  test('saves the record on the registration document (ATT-03, ATT-04)', async () => {
    const reg = activeReg();
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'org1', status: 'Upcoming' });

    await markAttendance(makeReq('Present'), mockRes());

    expect(Registration.findById).toHaveBeenCalledWith('r1');
    expect(reg.save).toHaveBeenCalledTimes(1);
    expect(reg.attendanceMarkedBy).toBe('org1');
    expect(reg.attendanceMarkedAt).toBeInstanceOf(Date);
  });

  test('lets the organizer correct an existing record (ATT-05)', async () => {
    const reg = activeReg({ attendanceStatus: 'Absent' });
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'org1', status: 'Upcoming' });

    await markAttendance(makeReq('Present'), mockRes());

    expect(reg.attendanceStatus).toBe('Present');
  });

  test('403 when another organizer owns the event (ATT-06)', async () => {
    const reg = activeReg();
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'someoneElse', status: 'Upcoming' });
    const res = mockRes();

    await markAttendance(makeReq('Present'), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(reg.save).not.toHaveBeenCalled();
    expect(reg.attendanceStatus).toBe('Not Marked');
  });

  test('400 for a status other than Present/Absent', async () => {
    const res = mockRes();
    await markAttendance(makeReq('Late'), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Registration.findById).not.toHaveBeenCalled();
  });

  test('400 when status is missing', async () => {
    const res = mockRes();
    await markAttendance({ params: { registrationId: 'r1' }, body: {}, user: { id: 'org1' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('404 when the registration does not exist', async () => {
    Registration.findById.mockResolvedValue(null);
    const res = mockRes();
    await markAttendance(makeReq('Present'), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('400 for a cancelled registration', async () => {
    const reg = activeReg({ status: 'Cancelled' });
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'org1', status: 'Upcoming' });
    const res = mockRes();

    await markAttendance(makeReq('Present'), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(reg.save).not.toHaveBeenCalled();
  });

  test('400 when the event itself is cancelled', async () => {
    const reg = activeReg();
    Registration.findById.mockResolvedValue(reg);
    Event.findById.mockResolvedValue({ organizer: 'org1', status: 'Cancelled' });
    const res = mockRes();

    await markAttendance(makeReq('Present'), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(reg.save).not.toHaveBeenCalled();
  });

  test('400 for a malformed registration id', async () => {
    Registration.findById.mockRejectedValue({ name: 'CastError' });
    const res = mockRes();
    await markAttendance(makeReq('Present'), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('getEventAttendance', () => {
  const req = { params: { eventId: 'e1' }, user: { id: 'org1' } };

  test('403 for an organizer who does not own the event', async () => {
    Event.findById.mockResolvedValue({ _id: 'e1', organizer: 'other' });
    const res = mockRes();
    await getEventAttendance(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Registration.find).not.toHaveBeenCalled();
  });

  test('returns active registrations to the event owner', async () => {
    Event.findById.mockResolvedValue({ _id: 'e1', title: 'Hackathon', organizer: 'org1' });
    const populate = jest.fn().mockResolvedValue([{ _id: 'r1', attendanceStatus: 'Not Marked' }]);
    Registration.find.mockReturnValue({ populate });
    const res = mockRes();

    await getEventAttendance(req, res);

    expect(Registration.find).toHaveBeenCalledWith({ event: 'e1', status: 'Active' });
    expect(populate).toHaveBeenCalledWith('student', 'name email');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      event: { id: 'e1', title: 'Hackathon' }
    }));
  });

  test('404 when the event is missing', async () => {
    Event.findById.mockResolvedValue(null);
    const res = mockRes();
    await getEventAttendance(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('getMyEvents', () => {
  test('lists only the organizer\'s events with registration counts', async () => {
    Event.find.mockResolvedValue([
      { _id: 'e1', title: 'Hackathon', status: 'Upcoming' },
      { _id: 'e2', title: 'Workshop', status: 'Upcoming' }
    ]);
    Registration.countDocuments.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
    const res = mockRes();

    await getMyEvents({ user: { id: 'org1' } }, res);

    expect(Event.find).toHaveBeenCalledWith({ organizer: 'org1' });
    expect(res.json).toHaveBeenCalledWith({
      events: [
        { id: 'e1', title: 'Hackathon', status: 'Upcoming', registered: 3 },
        { id: 'e2', title: 'Workshop', status: 'Upcoming', registered: 0 }
      ]
    });
  });
});
