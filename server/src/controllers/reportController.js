const Registration = require('../models/Registration');
const Event = require('../models/Event');
const sendError = require('../utils/sendError');
const { computeStatus } = require('../utils/eventStatus');
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
        status: computeStatus(event),
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
    return sendError(res, 500, 'SERVER_ERROR', 'Server error');
  }
};

// GET /api/reports/event/:eventId
// Full report for one event.
exports.getEventReport = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return sendError(res, 404, 'NOT_FOUND', 'Event not found');
    }

    // An organizer only sees reports for the events they manage
    if (String(event.organizer) !== String(req.user.id)) {
      return sendError(res, 403, 'FORBIDDEN', 'Not the organizer of this event');
    }

    const registrations = await getRegistrations(event._id);

    return res.json({
      event: {
        id: event._id,
        title: event.title,
        status: computeStatus(event),
        venue: event.venue,
        category: event.category,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime
      },
      ...buildEventStats(registrations, event.capacity)
    });
  } catch (error) {
    if (isCastError(error)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid event id');
    }
    return sendError(res, 500, 'SERVER_ERROR', 'Server error');
  }
};
