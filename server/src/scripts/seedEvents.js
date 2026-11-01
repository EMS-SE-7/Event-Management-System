// Demo events for the Sprint demo (team agreement section 10).
// Needs the users from `npm run seed` first: events are split between the organizers in
// ORGANIZER_EMAILS, and the students in STUDENT_EMAILS register for some of them.
// Re-running replaces the events this script made before (matched by title) and their registrations.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const parseList = (value) =>
  (value || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

// startsIn and deadlineBefore are relative to now, so every status shows up whenever the seed runs.
const EVENTS = [
  { title: 'Hackathon 2026', category: 'Technical', venue: 'MRD Auditorium', startsIn: 7 * DAY, hours: 24, deadlineBefore: DAY, capacity: 100,
    description: 'A 24 hour coding event. Teams of up to four build a working prototype.' },
  { title: 'Robotics Workshop', category: 'Workshop', venue: 'Lab 3, ECE Block', startsIn: 3 * DAY, hours: 4, deadlineBefore: DAY, capacity: 2,
    description: 'Build a line-following robot. Only two seats.' },
  { title: 'Cultural Night', category: 'Cultural', venue: 'Open Air Theatre', startsIn: 10 * DAY, hours: 3, deadlineBefore: 2 * DAY, capacity: 0, fill: true,
    description: 'Music, dance and drama from every department. Already full.' },
  { title: 'Inter-College Football Final', category: 'Sports', venue: 'Main Ground', startsIn: 5 * DAY, hours: 2, deadlineBefore: DAY, capacity: 50, cancelled: true,
    description: 'Cancelled because of the weather forecast.' },
  { title: 'Career Talk: Cloud Engineering', category: 'Seminar', venue: 'Seminar Hall 2', startsIn: 12 * HOUR, hours: 2, deadlineBefore: DAY, capacity: 80,
    description: 'Registration has already closed for this one.' },
  { title: 'Intro to Git and GitHub', category: 'Workshop', venue: 'Lab 1, CSE Block', startsIn: -3 * DAY, hours: 2, deadlineBefore: DAY, capacity: 60, completed: true,
    description: 'Already finished. Attendance has been taken.' },
];

const ATTENDANCE = ['Present', 'Absent', 'Not Marked'];

async function run() {
  const organizerEmails = parseList(process.env.ORGANIZER_EMAILS);
  const studentEmails = parseList(process.env.STUDENT_EMAILS);
  await connectDB();

  const organizers = await User.find({ email: { $in: organizerEmails }, role: 'Organizer' });
  const students = await User.find({ email: { $in: studentEmails }, role: 'Student' });
  if (organizers.length === 0) {
    throw new Error('No organizer accounts found. Run `npm run seed` first.');
  }

  const titles = EVENTS.map((e) => e.title);
  const old = await Event.find({ title: { $in: titles }, organizer: { $in: organizers.map((o) => o._id) } }, '_id');
  await Registration.deleteMany({ event: { $in: old.map((e) => e._id) } });
  await Event.deleteMany({ _id: { $in: old.map((e) => e._id) } });

  const now = Date.now();
  for (const [index, spec] of EVENTS.entries()) {
    const start = now + spec.startsIn;
    const registering = spec.fill || spec.completed || index === 0 ? students : [];
    const capacity = spec.fill ? Math.max(students.length, 1) : spec.capacity;

    // Inserted directly so past dates (completed, past deadline) are allowed.
    const { insertedId } = await Event.collection.insertOne({
      title: spec.title,
      description: spec.description,
      category: spec.category,
      venue: spec.venue,
      startDateTime: new Date(start),
      endDateTime: new Date(start + spec.hours * HOUR),
      registrationDeadline: new Date(start - spec.deadlineBefore),
      capacity,
      registeredCount: registering.length,
      status: spec.cancelled ? 'Cancelled' : 'Upcoming',
      organizer: organizers[index % organizers.length]._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const [i, student] of registering.entries()) {
      const marked = spec.completed ? ATTENDANCE[i % ATTENDANCE.length] : 'Not Marked';
      await Registration.create({
        student: student._id,
        event: insertedId,
        attendanceStatus: marked,
        ...(marked !== 'Not Marked' && { attendanceMarkedBy: organizers[index % organizers.length]._id, attendanceMarkedAt: new Date(start) }),
      });
    }
    console.log(`Created event: ${spec.title} (${registering.length} registered)`);
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
