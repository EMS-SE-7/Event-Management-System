const Registration = require('../models/Registration');
const Event = require('../models/Event');
const sendError = require('../utils/sendError');
const { computeStatus } = require('../utils/eventStatus');

const ALLOWED_STATUS = ['Present', 'Absent'];

function isCastError(error) {
  return error && error.name === 'CastError';
}

// GET /api/attendance/events
// Events managed by the logged-in organizer, with how many students are registered.
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id });

    const list = await Promise.all(events.map(async (event) => {
      const registered = await Registration.countDocuments({
        event: event._id,
        status: 'Registered'
      });

      return {
        id: event._id,
        title: event.title,
        status: computeStatus(event),
        registered
      };
    }));

    return res.json({ events: list });
  } catch (error) {
    return sendError(res, 500, 'SERVER_ERROR', 'Server error');
  }
};

// GET /api/attendance/event/:eventId
// Registered (not cancelled) students of one event, so the organizer can mark attendance.
exports.getEventAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return sendError(res, 404, 'NOT_FOUND', 'Event not found');
    }

    if (String(event.organizer) !== String(req.user.id)) {
      return sendError(res, 403, 'FORBIDDEN', 'Not the organizer of this event');
    }

    const registrations = await Registration.find({
      event: event._id,
      status: 'Registered'
    }).populate('student', 'name email');

    return res.json({
      event: { id: event._id, title: event.title },
      registrations
    });
  } catch (error) {
    if (isCastError(error)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid event id');
    }
    return sendError(res, 500, 'SERVER_ERROR', 'Server error');
  }
};

// PATCH /api/attendance/:registrationId
// Body: { status: 'Present' | 'Absent' }
// The same call is used to mark attendance the first time and to correct it later.
exports.markAttendance = async (req, res) => {
  try {
    const { status } = req.body || {};

    if (!ALLOWED_STATUS.includes(status)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Status must be Present or Absent');
    }

    const registration = await Registration.findById(req.params.registrationId);

    if (!registration) {
      return sendError(res, 404, 'NOT_FOUND', 'Registration not found');
    }

    const event = await Event.findById(registration.event);

    if (!event) {
      return sendError(res, 404, 'NOT_FOUND', 'Event not found');
    }

    // ownership is checked before anything about the registration is revealed
    if (String(event.organizer) !== String(req.user.id)) {
      return sendError(res, 403, 'FORBIDDEN', 'Not the organizer of this event');
    }

    if (registration.status === 'Cancelled') {
      return sendError(res, 400, 'REGISTRATION_CANCELLED', 'Registration is cancelled');
    }

    if (event.status === 'Cancelled') {
      return sendError(res, 400, 'EVENT_CANCELLED', 'Event is cancelled');
    }

    registration.attendanceStatus = status;
    registration.attendanceMarkedBy = req.user.id;
    registration.attendanceMarkedAt = new Date();
    await registration.save();

    return res.json({ status: 'success', registration });
  } catch (error) {
    if (isCastError(error)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid registration id');
    }
    return sendError(res, 500, 'SERVER_ERROR', 'Server error');
  }
};
