const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { buildEventStats } = require('../utils/reportStats');

function isCastError(error) {
  return error && error.name === 'CastError';
}

function getRegistrations(eventId) {
  return Registration.find({ event: eventId }).select('status attendanceStatus');
}

// GET /api/reports/events
// Short report for every event of the logged-in organizer, plus overall totals.
exports.getMyReports = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id }).sort({ startDateTime: 1 });

    const reports = await Promise.all(events.map(async (event) => {
      const registrations = await getRegistrations(event._id);
      const stats = buildEventStats(registrations, event.capacity);

      return {
        id: event._id,
        title: event.title,
        status: event.status,
        startDateTime: event.startDateTime,
        ...stats
      };
    }));

    const totals = reports.reduce((sum, report) => ({
      registrations: sum.registrations + report.registration.total,
      present: sum.present + report.attendance.present,
      absent: sum.absent + report.attendance.absent
    }), { registrations: 0, present: 0, absent: 0 });

    return res.json({ events: reports, totals });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/reports/event/:eventId
// Full report for one event.
exports.getEventReport = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrations = await getRegistrations(event._id);

    return res.json({
      event: {
        id: event._id,
        title: event.title,
        status: event.status,
        venue: event.venue,
        startDateTime: event.startDateTime
      },
      ...buildEventStats(registrations, event.capacity)
    });
  } catch (error) {
    if (isCastError(error)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
