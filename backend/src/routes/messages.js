const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   POST /api/messages — send message
router.post('/', messageController.sendMessage);

// @route   GET /api/messages/:chatId — get messages
router.get('/:chatId', messageController.getMessages);

// @route   GET /api/messages/:chatId/search — search messages
router.get('/:chatId/search', messageController.searchMessages);

// @route   PUT /api/messages/:chatId/read — mark as read
router.put('/:chatId/read', messageController.markAsRead);

// @route   PUT /api/messages/:id — edit message
router.put('/:id', messageController.editMessage);

// @route   DELETE /api/messages/:id — delete message
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
