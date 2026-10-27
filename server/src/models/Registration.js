// Registration is Sham's model. This copy has the agreed fields plus the two
// optional audit fields the attendance module writes (attendanceMarkedBy/At).
// If this file conflicts on merge, keep Sham's version and add those two fields.
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['Active', 'Cancelled'], default: 'Active' },
  attendanceStatus: {
    type: String,
    enum: ['Present', 'Absent', 'Not Marked'],
    default: 'Not Marked'
  },
  attendanceMarkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendanceMarkedAt: Date
}, { timestamps: true });

// one registration per student per event
registrationSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
