const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   POST /api/chats — access or create direct chat
router.post('/', chatController.accessChat);

// @route   GET /api/chats — get all chats
router.get('/', chatController.getChats);

// @route   POST /api/chats/group — create group chat
router.post('/group', chatController.createGroupChat);

// @route   PUT /api/chats/group/:id/rename
router.put('/group/:id/rename', chatController.renameGroup);

// @route   PUT /api/chats/group/:id/add
router.put('/group/:id/add', chatController.addToGroup);

// @route   PUT /api/chats/group/:id/remove
router.put('/group/:id/remove', chatController.removeFromGroup);

// @route   DELETE /api/chats/:id
router.delete('/:id', chatController.deleteChat);

module.exports = router;
