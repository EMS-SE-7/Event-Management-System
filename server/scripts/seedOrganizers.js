// Creates an Organizer account for each email in ORGANIZER_EMAILS, using SEED_PASSWORD from .env.
// An email that is already registered is skipped: someone else may have claimed it first.
// Pass --force to promote such an account anyway, after checking it belongs to the right person.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const emails = (process.env.ORGANIZER_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const force = process.argv.includes('--force');

const run = async () => {
  if (!emails.length || !process.env.SEED_PASSWORD) {
    console.error('ORGANIZER_EMAILS and SEED_PASSWORD must be set in .env');
    process.exit(1);
  }

  await connectDB();
  for (const email of emails) {
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        name: email.split('@')[0],
        email,
        password: process.env.SEED_PASSWORD,
        role: 'Organizer',
      });
      console.log(`Created Organizer: ${email}`);
    } else if (force) {
      await User.updateOne({ email }, { role: 'Organizer' });
      console.log(`Promoted existing account (--force): ${email}`);
    } else {
      console.log(`SKIPPED ${email}: already registered (${existing.role}). Check it is really them, then rerun with --force`);
    }
  }
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
