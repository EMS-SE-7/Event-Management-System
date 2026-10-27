const mongoose = require('mongoose');
const Event = require('../models/Event');
const AppError = require('../utils/AppError');
const { withCalculatedFields, computeStatus } = require('../utils/eventStatus');

// Only these fields can come from the request body. organizer comes from the
// logged-in user (EVENT-07), and status/registeredCount cannot be set by the client.
const EVENT_FIELDS = ['title', 'description', 'category', 'venue', 'startDateTime', 'endDateTime', 'registrationDeadline', 'capacity'];

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

// Makes user text safe to use inside a regular expression.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Finds the event and makes sure the logged-in user owns it (EVENT-07).
async function loadOwnEvent(req) {
  const event = mongoose.isValidObjectId(req.params.id) ? await Event.findById(req.params.id) : null;
  if (!event) {
    throw new AppError(404, 'NOT_FOUND', 'Event not found');
  }
  if (String(event.organizer) !== String(req.user.id)) {
    throw new AppError(403, 'FORBIDDEN', 'You can only change your own events');
  }
  return event;
}

// Runs a paged query and sends { data, meta }.
async function sendPage(res, filter, page, limit) {
  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ startDateTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Event.countDocuments(filter),
  ]);
  const now = new Date();
  res.json({
    data: events.map((event) => withCalculatedFields(event, now)),
    meta: { page, limit, total },
  });
}

// POST /api/events (EVENT-01, EVENT-02, EVENT-03, EVENT-08)
async function createEvent(req, res) {
  const data = pick(req.body || {}, EVENT_FIELDS);
  data.organizer = req.user.id;
  const event = await Event.create(data); // schema rules throw a ValidationError -> 400
  res.status(201).json({ data: withCalculatedFields(event) });
}

// GET /api/events (DISC-01, DISC-02, DISC-03, DISC-05, DISC-06)
// Optional: ?search=text  ?category=Technical  ?page=1&limit=20
async function listEvents(req, res) {
  const { page, limit } = readPaging(req.query);
  const filter = {};

  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }, { venue: pattern }];
  }

  if (typeof req.query.category === 'string' && req.query.category) {
    filter.category = req.query.category;
  }

  await sendPage(res, filter, page, limit);
}

// GET /api/events/mine - the logged-in organizer's own events
async function listMyEvents(req, res) {
  const { page, limit } = readPaging(req.query);
  await sendPage(res, { organizer: req.user.id }, page, limit);
}

// GET /api/events/:id (DISC-04, DISC-05, DISC-06)
async function getEvent(req, res) {
  const event = mongoose.isValidObjectId(req.params.id) ? await Event.findById(req.params.id) : null;
  if (!event) {
    throw new AppError(404, 'NOT_FOUND', 'Event not found');
  }
  res.json({ data: withCalculatedFields(event) });
}

// PATCH /api/events/:id (EVENT-04, EVENT-07, EVENT-08)
async function updateEvent(req, res) {
  const event = await loadOwnEvent(req);
  const current = computeStatus(event);
  if (current === 'Cancelled' || current === 'Completed') {
    throw new AppError(409, 'CONFLICT', `A ${current.toLowerCase()} event cannot be edited`);
  }
  event.set(pick(req.body || {}, EVENT_FIELDS)); // organizer/status/registeredCount cannot be changed here
  await event.save(); // schema rules throw a ValidationError -> 400
  res.json({ data: withCalculatedFields(event) });
}

// PATCH /api/events/:id/cancel (EVENT-05, EVENT-07)
async function cancelEvent(req, res) {
  const event = await loadOwnEvent(req);
  const current = computeStatus(event);
  if (current === 'Cancelled' || current === 'Completed') {
    throw new AppError(409, 'CONFLICT', `A ${current.toLowerCase()} event cannot be cancelled`);
  }
  event.status = 'Cancelled';
  await event.save();
  res.json({ data: withCalculatedFields(event) });
}

module.exports = { createEvent, listEvents, getEvent, listMyEvents, updateEvent, cancelEvent };