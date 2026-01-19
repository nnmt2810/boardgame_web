const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Phải đnăg nhập mới có thể gửi và nhận tin nhắn
router.post('/send', verifyToken, messageController.sendMessage);
router.get('/:friend_id', verifyToken, messageController.getMessageHistory);

// Đánh dấu đã xem tin nhắn
router.put('/read/:friend_id', verifyToken, messageController.markAsRead);
router.put('/mark-read/:friend_id', verifyToken, messageController.markAsRead);

module.exports = router;