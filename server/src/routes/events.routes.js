const express = require('express');
// Swap this line for require('../middleware/auth') when Shaurya's auth is merged.
const { authenticate, requireRole } = require('../middleware/authStub');
const { createEvent } = require('../controllers/events.controller');

const router = express.Router();

router.post('/', authenticate, requireRole('organizer'), createEvent);

module.exports = router;
