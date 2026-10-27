const mongoose = require('mongoose');

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Club Activity', 'Other'];
const STORED_STATUSES = ['Upcoming', 'Cancelled'];

// A date must be in the future when the event is created, or when that date is
// changed in an edit. Untouched dates on an existing event are not re-checked,
// so an event that has already started can still be cancelled (EVENT-08).
function inFutureWhenChanged(path) {
  return function (value) {
    if (!this.isNew && !this.isModified(path)) return true;
    return value instanceof Date && value.getTime() > Date.now();
  };
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
      validate: { validator: inFutureWhenChanged('startDateTime'), message: 'Start date and time must be in the future' },
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
        { validator: inFutureWhenChanged('registrationDeadline'), message: 'Registration deadline must be in the future' },
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

// On edits, re-check rules that involve more than one field (EVENT-08).
eventSchema.pre('validate', function () {
  if (this.isNew) return;
  if (this.startDateTime && this.endDateTime && this.endDateTime <= this.startDateTime) {
    this.invalidate('endDateTime', 'End date and time must be after the start');
  }
  if (this.startDateTime && this.registrationDeadline && this.registrationDeadline > this.startDateTime) {
    this.invalidate('registrationDeadline', 'Registration deadline cannot be after the start');
  }
  if (this.capacity != null && this.registeredCount > this.capacity) {
    this.invalidate('capacity', 'Capacity cannot be lower than the number of registered students');
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
module.exports.CATEGORIES = CATEGORIES;