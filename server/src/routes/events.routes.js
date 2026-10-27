const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { createEvent, listEvents, getEvent } = require('../controllers/events.controller');

const router = express.Router();

router.get('/', authenticate, listEvents);
router.post('/', authenticate, requireRole('organizer'), createEvent);
// Keep /:id last so routes like /mine (added later) are matched first.
router.get('/:id', authenticate, getEvent);

module.exports = router;
