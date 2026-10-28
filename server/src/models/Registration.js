const mongoose = require('mongoose');

const REGISTRATION_STATUSES = ['Registered', 'Cancelled'];
const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Not Marked'];

const registrationSchema = new mongoose.Schema(
  {
    // The student who registered for the event.
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
      immutable: true,
    },

    // The event for which the student registered.
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      immutable: true,
    },

    // Registration status, separate from attendance status.
    status: {
      type: String,
      enum: {
        values: REGISTRATION_STATUSES,
        message: 'Status must be Registered or Cancelled',
      },
      default: 'Registered',
      required: true,
    },

    attendanceStatus: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUSES,
        message: 'Attendance status must be Present, Absent, or Not Marked',
      },
      default: 'Not Marked',
      required: true,
    },

    // Attendance audit information.
    attendanceMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    attendanceMarkedAt: Date,
  },
  {
    timestamps: true,
  }
);

// REG-03: A student can have only one registration record per event.
// A cancelled registration remains in history and cannot be duplicated.
registrationSchema.index(
  { student: 1, event: 1 },
  { unique: true, name: 'unique_student_event_registration' }
);

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;