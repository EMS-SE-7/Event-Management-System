const Event = require('../models/Event');

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

// POST /api/events (EVENT-01, EVENT-02, EVENT-03, EVENT-08)
async function createEvent(req, res) {
  const data = pick(req.body || {}, CREATE_FIELDS);
  data.organizer = req.user.id;
  const event = await Event.create(data); // schema rules throw a ValidationError -> 400
  res.status(201).json({ data: event });
}

module.exports = { createEvent };
