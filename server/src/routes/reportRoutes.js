const express = require('express');
const ReportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const reportController = new ReportController();

// All report routes require authentication
router.use(authMiddleware);

router.get('/', reportController.getAll);
router.get('/daily', reportController.getDaily);
router.get('/month-to-date', reportController.getMonthToDate);
router.get('/monthly', reportController.getMonthly);

module.exports = router;
