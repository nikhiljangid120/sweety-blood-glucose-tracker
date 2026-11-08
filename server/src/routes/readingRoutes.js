const express = require('express');
const ReadingController = require('../controllers/readingController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const readingController = new ReadingController();

// All reading routes require authentication
router.use(authMiddleware);

router.post('/', readingController.create);
router.get('/', readingController.getAll);
router.get('/:id', readingController.getById);
router.put('/:id', readingController.update);
router.delete('/:id', readingController.delete);

module.exports = router;
