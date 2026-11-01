// Creates an Organizer account for each email in ORGANIZER_EMAILS and a Student account for each
// email in STUDENT_EMAILS, all with SEED_PASSWORD from .env.
// An email that is already registered is skipped: someone else may have claimed it first.
// Pass --force to promote such an organizer email anyway, after checking it belongs to the right person.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const parseList = (value) =>
  (value || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const organizers = parseList(process.env.ORGANIZER_EMAILS);
const students = parseList(process.env.STUDENT_EMAILS);
const force = process.argv.includes('--force');

const seed = async (email, role) => {
  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({ name: email.split('@')[0], email, password: process.env.SEED_PASSWORD, role });
    console.log(`Created ${role}: ${email}`);
  } else if (force && role === 'Organizer') {
    await User.updateOne({ email }, { role });
    console.log(`Promoted existing account (--force): ${email}`);
  } else {
    const hint = role === 'Organizer' ? ' Check it is really them, then rerun with --force' : '';
    console.log(`SKIPPED ${email}: already registered (${existing.role}).${hint}`);
  }
};

const run = async () => {
  if ((!organizers.length && !students.length) || !process.env.SEED_PASSWORD) {
    console.error('SEED_PASSWORD and at least one of ORGANIZER_EMAILS or STUDENT_EMAILS must be set in .env');
    process.exit(1);
  }

  await connectDB();
  for (const email of organizers) await seed(email, 'Organizer');
  for (const email of students) await seed(email, 'Student');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
