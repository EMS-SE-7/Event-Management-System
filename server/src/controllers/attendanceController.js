const Registration = require('../models/Registration');
const Event = require('../models/Event');

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
        status: 'Active'
      });

      return {
        id: event._id,
        title: event.title,
        status: event.status,
        registered
      };
    }));

    return res.json({ events: list });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/attendance/event/:eventId
// Active registrations of one event, so the organizer can mark attendance.
exports.getEventAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (String(event.organizer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not the organizer of this event' });
    }

    const registrations = await Registration.find({
      event: event._id,
      status: 'Active'
    }).populate('student', 'name email');

    return res.json({
      event: { id: event._id, title: event.title },
      registrations
    });
  } catch (error) {
    if (isCastError(error)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/attendance/:registrationId
// Body: { status: 'Present' | 'Absent' }
// The same call is used to mark attendance the first time and to correct it later.
exports.markAttendance = async (req, res) => {
  try {
    const { status } = req.body || {};

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: 'Status must be Present or Absent' });
    }

    const registration = await Registration.findById(req.params.registrationId);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = await Event.findById(registration.event);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // ownership is checked before anything about the registration is revealed
    if (String(event.organizer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not the organizer of this event' });
    }

    if (registration.status === 'Cancelled') {
      return res.status(400).json({ message: 'Registration is cancelled' });
    }

    if (event.status === 'Cancelled') {
      return res.status(400).json({ message: 'Event is cancelled' });
    }

    registration.attendanceStatus = status;
    registration.attendanceMarkedBy = req.user.id;
    registration.attendanceMarkedAt = new Date();
    await registration.save();

    return res.json({ status: 'success', registration });
  } catch (error) {
    if (isCastError(error)) {
      return res.status(400).json({ message: 'Invalid registration id' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
