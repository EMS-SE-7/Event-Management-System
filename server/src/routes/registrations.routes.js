const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  registerForEvent,
} = require('../controllers/registrations.controller');

const router = express.Router();

// Only authenticated students can register.
router.post(
  '/',
  authenticate,
  requireRole('student'),
  registerForEvent
);

module.exports = router;
