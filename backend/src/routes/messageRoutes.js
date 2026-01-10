const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Đều cần đăng nhập đối với message routes
router.post('/send', verifyToken, messageController.sendMessage);
router.get('/:friend_id', verifyToken, messageController.getMessageHistory);

// Đánh dấu đã xem khi user nhấn vào cuộc trò chuyện
router.put('/read/:friend_id', verifyToken, messageController.markAsRead);

module.exports = router;