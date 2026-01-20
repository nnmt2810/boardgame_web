const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Tất cả các route admin đều yêu cầu verifyToken + isAdmin
router.use(verifyToken, isAdmin);

// Users management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Games management
router.get('/games', adminController.getGames);
router.put('/games/:id', adminController.updateGameStatus);

// Quick stats
router.get('/stats', adminController.getStats);

module.exports = router;