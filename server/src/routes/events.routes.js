const express = require('express');
const { authenticate, requireRole } = require('../middleware/authStub');
const {
  createEvent, listEvents, getEvent, listMyEvents, updateEvent, cancelEvent,
} = require('../controllers/events.controller');

const router = express.Router();

router.get('/', authenticate, listEvents);
router.post('/', authenticate, requireRole('organizer'), createEvent);
// /mine must come before /:id, otherwise "mine" would be read as an event id.
router.get('/mine', authenticate, requireRole('organizer'), listMyEvents);
router.get('/:id', authenticate, getEvent);
router.patch('/:id', authenticate, requireRole('organizer'), updateEvent);
router.patch('/:id/cancel', authenticate, requireRole('organizer'), cancelEvent);

module.exports = router;