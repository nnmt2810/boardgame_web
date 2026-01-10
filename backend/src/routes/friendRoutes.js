const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/request', verifyToken, friendController.sendFriendRequest);
router.post('/accept', verifyToken, friendController.acceptFriendRequest);
router.get('/list', verifyToken, friendController.getFriendsList);
router.get('/pending', verifyToken, friendController.getPendingRequests);

module.exports = router;