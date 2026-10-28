const express = require('express');
const { authenticate, requireRole } = require('../middleware/authStub');
const {
  registerForEvent, cancelRegistration, listMyRegistrations,
} = require('../controllers/registrations.controller');

const router = express.Router();

router.post('/', authenticate, requireRole('student'), registerForEvent);
// /mine must come before any route with an :id.
router.get('/mine', authenticate, requireRole('student'), listMyRegistrations);
router.patch('/:id/cancel', authenticate, requireRole('student'), cancelRegistration);

module.exports = router;