const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { MESSAGES_PER_PAGE } = require('../config/constants');

// @desc    Send a message
// @route   POST /api/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ message: 'Chat ID and content are required.' });
    }

    // Verify chat exists and user is a member
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (!chat.members.map((m) => m.toString()).includes(req.userId.toString())) {
      return res.status(403).json({ message: 'Not a member of this chat.' });
    }

    // Create message
    let message = await Message.create({
      chat: chatId,
      sender: req.userId,
      content,
      readBy: [req.userId],
    });

    // Populate message
    message = await message.populate('sender', 'username avatar');
    message = await message.populate('chat');

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a chat
// @route   GET /api/messages/:chatId
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || MESSAGES_PER_PAGE;

    // Verify chat exists and user is a member
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (!chat.members.map((m) => m.toString()).includes(req.userId.toString())) {
      return res.status(403).json({ message: 'Not a member of this chat.' });
    }

    const total = await Message.countDocuments({
      chat: chatId,
      isDeleted: false,
    });

    const messages = await Message.find({
      chat: chatId,
      isDeleted: false,
    })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:id
exports.editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Can only edit your own messages.' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit a deleted message.' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const updatedMessage = await Message.findById(message._id).populate(
      'sender',
      'username avatar'
    );

    res.json({ message: updatedMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message (soft delete)
// @route   DELETE /api/messages/:id
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Can only delete your own messages.' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    res.json({ message: 'Message deleted successfully.', messageId: message._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Search messages in a chat
// @route   GET /api/messages/:chatId/search
exports.searchMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || MESSAGES_PER_PAGE;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (!chat.members.map((m) => m.toString()).includes(req.userId.toString())) {
      return res.status(403).json({ message: 'Not a member of this chat.' });
    }

    const total = await Message.countDocuments({
      chat: chatId,
      isDeleted: false,
      content: { $regex: q, $options: 'i' },
    });

    const messages = await Message.find({
      chat: chatId,
      isDeleted: false,
      content: { $regex: q, $options: 'i' },
    })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:chatId/read
exports.markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chat: chatId,
        readBy: { $ne: req.userId },
      },
      {
        $addToSet: { readBy: req.userId },
      }
    );

    res.json({ message: 'Messages marked as read.' });
  } catch (error) {
    next(error);
  }
};
