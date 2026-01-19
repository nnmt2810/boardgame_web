const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Rankings
router.get('/leaderboard/:game_id', gameController.getLeaderboard);
router.post('/update-score', verifyToken, gameController.updateScore);
router.get('/leaderboard/friends/:game_id', verifyToken, gameController.getFriendLeaderboard);

module.exports = router;