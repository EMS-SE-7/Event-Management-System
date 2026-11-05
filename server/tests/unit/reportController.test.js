jest.mock('../../src/models/Registration', () => ({ find: jest.fn() }));
jest.mock('../../src/models/Event', () => ({ find: jest.fn(), findById: jest.fn() }));

const Registration = require('../../src/models/Registration');
const Event = require('../../src/models/Event');
const { getMyReports, getEventReport } = require('../../src/controllers/reportController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Registration.find(...).select(...) resolves to the given list
function mockRegistrations(...lists) {
  lists.forEach((list) => {
    Registration.find.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(list) });
  });
}

const reg = (attendanceStatus, status = 'Registered') => ({ status, attendanceStatus });

beforeEach(() => jest.resetAllMocks());

describe('getEventReport', () => {
  const req = { params: { eventId: 'e1' }, user: { id: 'org1', role: 'Organizer' } };

  test('returns registration and attendance totals for the event', async () => {
    Event.findById.mockResolvedValue({
      _id: 'e1', title: 'Hackathon', status: 'Upcoming', venue: 'MRD', capacity: 4, organizer: 'org1'
    });
    mockRegistrations([reg('Present'), reg('Present'), reg('Absent'), reg('Not Marked', 'Cancelled')]);
    const res = mockRes();

    await getEventReport(req, res);

    expect(Registration.find).toHaveBeenCalledWith({ event: 'e1' });
    const body = res.json.mock.calls[0][0];
    expect(body.event.title).toBe('Hackathon');
    expect(body.registration).toEqual({
      total: 3, cancelled: 1, capacity: 4, seatsLeft: 1, fillRate: 75
    });
    expect(body.attendance).toEqual({
      present: 2, absent: 1, notMarked: 0
    });
  });

  test('404 when the event does not exist', async () => {
    Event.findById.mockResolvedValue(null);
    const res = mockRes();
    await getEventReport(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('403 when the organizer does not own the event', async () => {
    Event.findById.mockResolvedValue({ _id: 'e1', title: 'Hackathon', capacity: 4, organizer: 'org2' });
    const res = mockRes();
    await getEventReport(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'FORBIDDEN', message: 'Not the organizer of this event' } });
    expect(Registration.find).not.toHaveBeenCalled();
  });

  test('a finished event is reported as Completed, not its stored status', async () => {
    Event.findById.mockResolvedValue({
      _id: 'e1', title: 'Old talk', status: 'Upcoming', capacity: 4, organizer: 'org1',
      startDateTime: new Date('2020-01-01T10:00:00Z'), endDateTime: new Date('2020-01-01T12:00:00Z')
    });
    mockRegistrations([]);
    const res = mockRes();
    await getEventReport(req, res);
    expect(res.json.mock.calls[0][0].event.status).toBe('Completed');
  });

  test('400 for a malformed event id', async () => {
    Event.findById.mockRejectedValue({ name: 'CastError' });
    const res = mockRes();
    await getEventReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('500 when the database fails', async () => {
    Event.findById.mockRejectedValue(new Error('db down'));
    const res = mockRes();
    await getEventReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getMyReports', () => {
  test('lists only the organizer\'s events with overall totals', async () => {
    const sort = jest.fn().mockResolvedValue([
      { _id: 'e1', title: 'Hackathon', status: 'Upcoming', capacity: 10 },
      { _id: 'e2', title: 'Workshop', status: 'Upcoming', capacity: 5 }
    ]);
    Event.find.mockReturnValue({ sort });
    mockRegistrations(
      [reg('Present'), reg('Absent')],
      [reg('Present'), reg('Not Marked')]
    );
    const res = mockRes();

    await getMyReports({ user: { id: 'org1' } }, res);

    expect(Event.find).toHaveBeenCalledWith({ organizer: 'org1' });
    const body = res.json.mock.calls[0][0];
    expect(body.events).toHaveLength(2);
    expect(body.events[0].registration.total).toBe(2);
    expect(body.totals).toEqual({ registrations: 4, present: 2, absent: 1 });
  });

  test('organizer with no events gets an empty list and zero totals', async () => {
    Event.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    const res = mockRes();

    await getMyReports({ user: { id: 'org1' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      events: [],
      totals: { registrations: 0, present: 0, absent: 0 }
    });
  });
});
