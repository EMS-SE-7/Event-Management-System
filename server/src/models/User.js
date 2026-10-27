// TEMPORARY stand-in until Shaurya's User model is merged.
// If this file conflicts on merge, keep the Auth module's version.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Organizer'], default: 'Student' }
});

module.exports = mongoose.model('User', userSchema);
