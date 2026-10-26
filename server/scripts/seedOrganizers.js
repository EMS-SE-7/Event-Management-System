// Promotes the emails in ORGANIZER_EMAILS (.env) to Organizer. They must register first.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const emails = (process.env.ORGANIZER_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const run = async () => {
  if (!emails.length) {
    console.error('ORGANIZER_EMAILS is empty in .env');
    process.exit(1);
  }

  await connectDB();
  for (const email of emails) {
    const user = await User.findOneAndUpdate({ email }, { role: 'Organizer' });
    console.log(user ? `Organizer: ${email}` : `Not registered yet: ${email}`);
  }
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
