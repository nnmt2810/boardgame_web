const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/me', verifyToken, userController.getProfile);
router.get('/search', verifyToken, userController.searchUsers);
router.post('/stats/update', verifyToken, userController.updatePlayerStats);

module.exports = router;