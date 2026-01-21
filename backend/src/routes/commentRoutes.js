const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Thêm comment (specific method trước)
router.post('/', verifyToken, commentController.addComment);

// Xóa comment (specific method)
router.delete('/:comment_id', verifyToken, commentController.deleteComment);

// Lấy comments của một game (generic route sau)
router.get('/:game_id', commentController.getGameComments);

module.exports = router;
