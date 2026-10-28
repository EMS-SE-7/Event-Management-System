const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const { computeStatus } = require('../utils/eventStatus');

// REG-01 to REG-06 and STATUS-03/STATUS-04
// POST /api/registrations
async function registerForEvent(req, res, next) {
  let reservedEventId = null;

  try {
    const { eventId } = req.body;
    const studentId = req.user.id;

    // Validate the event ID.
    if (!eventId) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Event ID is required'
      );
    }

    if (!mongoose.isValidObjectId(eventId)) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }

    // Find the event.
    let event = await Event.findById(eventId);

    if (!event) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }

    let now = new Date();

    // Check 1: Cancelled events cannot accept registrations.
    if (event.status === 'Cancelled') {
      throw new AppError(
        409,
        'EVENT_CANCELLED',
        'This event has been cancelled'
      );
    }

    // Check 2: The event must still be upcoming.
    if (computeStatus(event, now) !== 'Upcoming') {
      throw new AppError(
        409,
        'EVENT_NOT_UPCOMING',
        'This event is not upcoming'
      );
    }

    // Check 3: The registration deadline must not have passed.
    if (now >= event.registrationDeadline) {
      throw new AppError(
        409,
        'DEADLINE_PASSED',
        'The registration deadline has passed'
      );
    }

    // Check 4: The event must have available seats.
    if (event.registeredCount >= event.capacity) {
      throw new AppError(
        409,
        'EVENT_FULL',
        'This event is full'
      );
    }

    // Check 5: Prevent duplicate registration.
    const existingRegistration = await Registration.findOne({
      student: studentId,
      event: eventId,
    });

    if (existingRegistration) {
      throw new AppError(
        409,
        'ALREADY_REGISTERED',
        'You already have a registration record for this event'
      );
    }

    // Atomically reserve one seat.
    // The database condition prevents registeredCount from exceeding capacity.
    now = new Date();

    const reservedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: { $ne: 'Cancelled' },
        startDateTime: { $gt: now },
        registrationDeadline: { $gt: now },
        $expr: {
          $lt: ['$registeredCount', '$capacity'],
        },
      },
      {
        $inc: { registeredCount: 1 },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // If reservation fails, determine the correct reason.
    if (!reservedEvent) {
      event = await Event.findById(eventId);

      if (!event) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }

      now = new Date();

      if (event.status === 'Cancelled') {
        throw new AppError(
          409,
          'EVENT_CANCELLED',
          'This event has been cancelled'
        );
      }

      if (computeStatus(event, now) !== 'Upcoming') {
        throw new AppError(
          409,
          'EVENT_NOT_UPCOMING',
          'This event is not upcoming'
        );
      }

      if (now >= event.registrationDeadline) {
        throw new AppError(
          409,
          'DEADLINE_PASSED',
          'The registration deadline has passed'
        );
      }

      throw new AppError(
        409,
        'EVENT_FULL',
        'This event is full'
      );
    }

    reservedEventId = reservedEvent._id;

    // Create the registration record.
    const registration = await Registration.create({
      student: studentId,
      event: eventId,
    });

    // Registration succeeded; no rollback is needed.
    reservedEventId = null;

    return res.status(201).json({
      message: 'Successfully registered for the event',
      data: {
        ...registration.toObject(),
        student: String(registration.student),
        event: String(registration.event),
      },
    });
  } catch (error) {
    // If creating the registration failed after reserving a seat,
    // release that seat.
    if (reservedEventId) {
      try {
        await Event.updateOne(
          {
            _id: reservedEventId,
            registeredCount: { $gt: 0 },
          },
          {
            $inc: { registeredCount: -1 },
          }
        );
      } catch (rollbackError) {
        console.error(
          'Failed to release reserved event seat:',
          rollbackError
        );
      }
    }

    // The unique compound index protects against concurrent duplicate registrations.
    if (error.code === 11000) {
      return next(
        new AppError(
          409,
          'ALREADY_REGISTERED',
          'You already have a registration record for this event'
        )
      );
    }

    return next(error);
  }
}

// PART-01, PART-02, PART-03 and PART-04
// GET /api/events/:eventId/participants
async function getEventParticipants(req, res, next) {
  try {
    // participants.routes.js uses the parameter name eventId.
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }

    const event = await Event.findById(eventId);

    if (!event) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found');
    }

    // Only the organizer who owns this event may view its participants.
    if (String(event.organizer) !== String(req.user.id)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'You are not authorized to view this event participants'
      );
    }

    // Return only active registrations for this event.
    let query = Registration.find({
      event: event._id,
      status: 'Registered',
    }).sort({ createdAt: -1 });

    // Populate student details when the User model is registered.
    if (mongoose.models.User) {
      query = query.populate('student', 'name email');
    }

    const registrations = await query.lean();

    return res.status(200).json({
      data: registrations,
      meta: {
        total: registrations.length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registerForEvent,
  getEventParticipants,
};
