const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const { computeStatus, withCalculatedFields } = require('../utils/eventStatus');

// Checks in the SRS 5.4.2 order: status, deadline, capacity.
// Error codes come from section 3 of the team integration guide.
function assertOpenForRegistration(event, now) {
  const status = computeStatus(event, now);
  if (status === 'Cancelled') {
    throw new AppError(409, 'EVENT_CANCELLED', 'This event is cancelled');
  }
  if (status !== 'Upcoming') {
    throw new AppError(409, 'EVENT_NOT_UPCOMING', 'Registration is only open for upcoming events');
  }
  if (now >= event.registrationDeadline) {
    throw new AppError(409, 'DEADLINE_PASSED', 'The registration deadline has passed');
  }
  if (event.registeredCount >= event.capacity) {
    throw new AppError(409, 'EVENT_FULL', 'This event is full');
  }
}

// POST /api/registrations (REG-01 to REG-06, STATUS-03, STATUS-04)
// Authentication and the student role are checked by the route middleware.
async function registerForEvent(req, res) {
  const eventId = req.body && req.body.eventId;
  if (!eventId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'eventId is required');
  }
  const event = mongoose.isValidObjectId(eventId) ? await Event.findById(eventId) : null;
  if (!event) {
    throw new AppError(404, 'NOT_FOUND', 'Event not found');
  }

  const now = new Date();
  assertOpenForRegistration(event, now);

  // A cancelled registration is reused, so the history keeps one record per student and event.
  const existing = await Registration.findOne({ student: req.user.id, event: event._id });
  if (existing && existing.status === 'Registered') {
    throw new AppError(409, 'ALREADY_REGISTERED', 'You are already registered for this event');
  }

  // Take one seat atomically, so two students cannot take the last seat.
  const seat = await Event.findOneAndUpdate(
    {
      _id: event._id,
      status: 'Upcoming',
      startDateTime: { $gt: now },
      registrationDeadline: { $gt: now },
      $expr: { $lt: ['$registeredCount', '$capacity'] },
    },
    { $inc: { registeredCount: 1 } },
    { returnDocument: 'after' }
  );
  if (!seat) {
    // Someone else changed the event since our first check: report the real reason.
    const latest = await Event.findById(event._id);
    if (!latest) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }
    assertOpenForRegistration(latest, new Date());
    throw new AppError(409, 'EVENT_FULL', 'This event is full');
  }

  try {
    let registration;
    if (existing) {
      registration = await Registration.findOneAndUpdate(
        { _id: existing._id, status: 'Cancelled' },
        { status: 'Registered', attendanceStatus: 'Not Marked' },
        { returnDocument: 'after' }
      );
      if (!registration) {
        throw new AppError(409, 'ALREADY_REGISTERED', 'You are already registered for this event');
      }
    } else {
      registration = await Registration.create({ student: req.user.id, event: event._id });
    }
    res.status(201).json({ data: registration });
  } catch (error) {
    // Give the seat back if the registration could not be saved.
    await Event.updateOne({ _id: event._id, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
    if (error.code === 11000) {
      throw new AppError(409, 'ALREADY_REGISTERED', 'You are already registered for this event');
    }
    throw error;
  }
}

// PATCH /api/registrations/:id/cancel (REG-07, REG-08)
// The record is kept with status Cancelled (history), and the seat is given back.
async function cancelRegistration(req, res) {
  const { id } = req.params;
  const registration = mongoose.isValidObjectId(id) ? await Registration.findById(id) : null;
  if (!registration) {
    throw new AppError(404, 'NOT_FOUND', 'Registration not found');
  }
  if (String(registration.student) !== String(req.user.id)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only cancel your own registration');
  }
  if (registration.status === 'Cancelled') {
    throw new AppError(409, 'ALREADY_CANCELLED', 'This registration is already cancelled');
  }

  const event = await Event.findById(registration.event);
  if (event) {
    const current = computeStatus(event);
    if (current === 'Ongoing' || current === 'Completed') {
      throw new AppError(409, 'EVENT_NOT_UPCOMING', 'A registration cannot be cancelled once the event has started');
    }
  }

  // Only one request can switch Registered -> Cancelled, so the seat is given back exactly once.
  const cancelled = await Registration.findOneAndUpdate(
    { _id: registration._id, status: 'Registered' },
    { status: 'Cancelled' },
    { returnDocument: 'after' }
  );
  if (!cancelled) {
    throw new AppError(409, 'ALREADY_CANCELLED', 'This registration is already cancelled');
  }
  await Event.updateOne({ _id: registration.event, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });

  res.json({ data: cancelled });
}

// GET /api/registrations/mine (HIST-01 to HIST-04)
// Optional: ?status=Registered or ?status=Cancelled
async function listMyRegistrations(req, res) {
  const filter = { student: req.user.id };
  const wanted = req.query.status;
  if (wanted !== undefined) {
    if (wanted !== 'Registered' && wanted !== 'Cancelled') {
      throw new AppError(400, 'VALIDATION_ERROR', 'status must be Registered or Cancelled');
    }
    filter.status = wanted;
  }

  const registrations = await Registration.find(filter).sort({ createdAt: -1 }).populate('event').lean();
  const now = new Date();
  const data = registrations.map((registration) => ({
    ...registration,
    isActive: registration.status === 'Registered', // HIST-04
    event: registration.event ? withCalculatedFields(registration.event, now) : null, // HIST-03
  }));

  res.json({ data, meta: { total: data.length } });
}

// GET /api/events/:eventId/participants (PART-01 to PART-04)
// Role is checked by the route middleware; ownership is checked here (403).
async function getEventParticipants(req, res) {
  const { eventId } = req.params;
  const event = mongoose.isValidObjectId(eventId) ? await Event.findById(eventId) : null;
  if (!event) {
    throw new AppError(404, 'NOT_FOUND', 'Event not found');
  }
  if (String(event.organizer) !== String(req.user.id)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only view participants of your own events');
  }

  let query = Registration.find({ event: event._id, status: 'Registered' }).sort({ createdAt: -1 });
  // The User model belongs to the auth module. Fill in name and email only once it is registered.
  if (mongoose.models.User) {
    query = query.populate('student', 'name email');
  }
  const registrations = await query.lean();

  res.json({ data: registrations, meta: { total: registrations.length } });
}

module.exports = { registerForEvent, cancelRegistration, listMyRegistrations, getEventParticipants };