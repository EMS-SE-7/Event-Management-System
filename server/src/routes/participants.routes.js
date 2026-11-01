const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { getEventParticipants } = require('../controllers/registrations.controller');

// Mounted at /api/events/:eventId/participants, so mergeParams is needed to read :eventId.
const router = express.Router({ mergeParams: true });

router.get('/', authenticate, requireRole('organizer'), getEventParticipants);

module.exports = router;