const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Chỉ những người đã đăng nhập mới được Save/Load
router.post('/save', verifyToken, gameController.saveSession);
router.get('/load/:game_id', verifyToken, gameController.getLatestSession);

module.exports = router;