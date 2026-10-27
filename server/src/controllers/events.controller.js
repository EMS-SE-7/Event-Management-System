const mongoose = require('mongoose');
const Event = require('../models/Event');
const AppError = require('../utils/AppError');
const { withCalculatedFields } = require('../utils/eventStatus');

// Only these fields can come from the request body. organizer comes from the
// logged-in user (EVENT-07), and status/registeredCount always start at their defaults.
const CREATE_FIELDS = ['title', 'description', 'category', 'venue', 'startDateTime', 'endDateTime', 'registrationDeadline', 'capacity'];

function pick(source, fields) {
  const result = {};
  for (const field of fields) {
    if (source[field] !== undefined) result[field] = source[field];
  }
  return result;
}

// Reads ?page and ?limit, falling back to page 1 and 20 per page (max 100).
function readPaging(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit };
}

// POST /api/events (EVENT-01, EVENT-02, EVENT-03, EVENT-08)
async function createEvent(req, res) {
  const data = pick(req.body || {}, CREATE_FIELDS);
  data.organizer = req.user.id;
  const event = await Event.create(data); // schema rules throw a ValidationError -> 400
  res.status(201).json({ data: withCalculatedFields(event) });
}

// GET /api/events (DISC-01, DISC-05, DISC-06)
// Soonest events first. Search and category filter (DISC-02, DISC-03) come later.
async function listEvents(req, res) {
  const { page, limit } = readPaging(req.query);
  const [events, total] = await Promise.all([
    Event.find()
      .sort({ startDateTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Event.countDocuments(),
  ]);
  const now = new Date();
  res.json({
    data: events.map((event) => withCalculatedFields(event, now)),
    meta: { page, limit, total },
  });
}

// GET /api/events/:id (DISC-04, DISC-05, DISC-06)
async function getEvent(req, res) {
  const event = mongoose.isValidObjectId(req.params.id) ? await Event.findById(req.params.id) : null;
  if (!event) {
    throw new AppError(404, 'NOT_FOUND', 'Event not found');
  }
  res.json({ data: withCalculatedFields(event) });
}

module.exports = { createEvent, listEvents, getEvent };
