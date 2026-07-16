const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/users
router.get('/', userController.getUsers);

// @route   PUT /api/users/profile
router.put('/profile', userController.updateProfile);

// @route   PUT /api/users/status
router.put('/status', userController.updateStatus);

// @route   GET /api/users/:id
router.get('/:id', userController.getUserById);

module.exports = router;
