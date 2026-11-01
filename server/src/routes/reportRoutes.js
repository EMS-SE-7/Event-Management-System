const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getMyReports, getEventReport } = require('../controllers/reportController');

const router = express.Router();

// reports are only for logged-in organizers
router.use(protect, authorizeRoles('Organizer'));

router.get('/events', getMyReports);
router.get('/event/:eventId', getEventReport);

module.exports = router;
