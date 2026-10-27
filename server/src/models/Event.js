const mongoose = require('mongoose');

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Club Activity', 'Other'];
const STORED_STATUSES = ['Upcoming', 'Cancelled'];

// "In the future" is only checked when the event is first created (EVENT-08),
// so an event that has already started can still be saved later (e.g. cancelled).
function inFutureWhenCreated(value) {
  if (!this.isNew) return true;
  return value instanceof Date && value.getTime() > Date.now();
}

const eventSchema = new mongoose.Schema(
  {
    // EVENT-02: mandatory event information
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: 'Category must be one of: ' + CATEGORIES.join(', ') },
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [150, 'Venue must be at most 150 characters'],
    },

    // EVENT-08: valid dates
    startDateTime: {
      type: Date,
      required: [true, 'Start date and time is required'],
      validate: { validator: inFutureWhenCreated, message: 'Start date and time must be in the future' },
    },
    endDateTime: {
      type: Date,
      required: [true, 'End date and time is required'],
      validate: {
        validator: function (value) {
          if (!this.startDateTime || !value) return true;
          return value.getTime() > this.startDateTime.getTime();
        },
        message: 'End date and time must be after the start',
      },
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
      validate: [
        { validator: inFutureWhenCreated, message: 'Registration deadline must be in the future' },
        {
          validator: function (value) {
            if (!this.startDateTime || !value) return true;
            return value.getTime() <= this.startDateTime.getTime();
          },
          message: 'Registration deadline cannot be after the start',
        },
      ],
    },

    // EVENT-08: valid capacity
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [99999, 'Capacity must be at most 99999'],
      validate: { validator: Number.isInteger, message: 'Capacity must be a whole number' },
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: [0, 'Registered count cannot be negative'],
      validate: {
        validator: function (value) {
          return this.capacity == null || value <= this.capacity;
        },
        message: 'Capacity cannot be lower than the number of registered students',
      },
    },

    // EVENT-06, STATUS-01: only Upcoming and Cancelled are stored.
    // Ongoing and Completed are calculated from the dates when events are returned.
    status: {
      type: String,
      enum: { values: STORED_STATUSES, message: 'Status must be Upcoming or Cancelled' },
      default: 'Upcoming',
    },

    // EVENT-07: set from the logged-in user, never from the request body
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
module.exports.CATEGORIES = CATEGORIES;
