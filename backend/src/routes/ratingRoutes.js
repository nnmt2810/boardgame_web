const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { verifyToken } = require('../middlewares/authMiddleware');

// User rate game
router.post('/', verifyToken, ratingController.rateGame);

// Lấy rating của user hiện tại (specific route trước)
router.get('/:game_id/user', verifyToken, ratingController.getUserRating);

// Lấy ratings của một game (generic route sau)
router.get('/:game_id', ratingController.getGameRatings);

module.exports = router;
