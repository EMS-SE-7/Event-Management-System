const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getMyEvents,
  getEventAttendance,
  markAttendance
} = require('../controllers/attendanceController');

const router = express.Router();

// every attendance route needs a logged-in organizer
router.use(protect, authorizeRoles('Organizer'));

router.get('/events', getMyEvents);
router.get('/event/:eventId', getEventAttendance);
router.patch('/:registrationId', markAttendance);

module.exports = router;
