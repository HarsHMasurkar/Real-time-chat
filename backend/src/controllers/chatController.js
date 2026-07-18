const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { CHATS_PER_PAGE, MAX_GROUP_MEMBERS } = require('../config/constants');

// @desc    Create or access a direct chat
// @route   POST /api/chats
exports.accessChat = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.userId.toString();
    const targetUserId = userId.toString();

    if (!userId) {
      return res.status(400).json({ message: 'UserId is required.' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot create chat with yourself.' });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if direct chat already exists
    let chat = await Chat.findOne({
      isGroupChat: false,
      members: { $all: [req.userId, targetUser._id] },
    })
      .populate('members', '-refreshToken')
      .populate('lastMessage');

    if (chat) {
      if (chat.lastMessage) {
        chat = await chat.populate('lastMessage.sender', 'username avatar');
      }
      return res.json({ chat });
    }

    // Create new direct chat
    const newChat = await Chat.create({
      isGroupChat: false,
      members: [req.userId, targetUser._id],
    });

    const fullChat = await Chat.findById(newChat._id).populate(
      'members',
      '-refreshToken'
    );

    res.status(201).json({ chat: fullChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chats for the logged-in user
// @route   GET /api/chats
exports.getChats = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || CHATS_PER_PAGE;

    const total = await Chat.countDocuments({
      members: req.userId,
    });

    const chats = await Chat.find({
      members: req.userId,
    })
      .populate('members', '-refreshToken')
      .populate('admin', 'username avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Populate lastMessage sender
    const populatedChats = await User.populate(chats, {
      path: 'lastMessage.sender',
      select: 'username avatar',
    });

    res.json({
      chats: populatedChats,
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

// @desc    Create a group chat
// @route   POST /api/chats/group
exports.createGroupChat = async (req, res, next) => {
  try {
    const { chatName, members } = req.body;

    if (!chatName || !members) {
      return res.status(400).json({ message: 'Chat name and members are required.' });
    }

    if (!Array.isArray(members) || members.length < 1) {
      return res
        .status(400)
        .json({ message: 'A group chat requires at least 2 members.' });
    }

    const normalizedMembers = [...new Set(members.map((member) => member.toString()))];

    if (normalizedMembers.length + 1 > MAX_GROUP_MEMBERS) {
      return res
        .status(400)
        .json({ message: `Group cannot exceed ${MAX_GROUP_MEMBERS} members.` });
    }

    // Include creator in members
    const allMembers = [...new Set([...normalizedMembers, req.userId.toString()])];

    const groupChat = await Chat.create({
      chatName,
      isGroupChat: true,
      members: allMembers,
      admin: req.userId,
    });

    const fullChat = await Chat.findById(groupChat._id)
      .populate('members', '-refreshToken')
      .populate('admin', 'username avatar');

    res.status(201).json({ chat: fullChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a public group chat that anyone can join
// @route   POST /api/chats/group/public
exports.createPublicGroupChat = async (req, res, next) => {
  try {
    const { chatName, description } = req.body;

    if (!chatName || !chatName.trim()) {
      return res.status(400).json({ message: 'Chat name is required.' });
    }

    const groupChat = await Chat.create({
      chatName: chatName.trim(),
      description: description || '',
      isGroupChat: true,
      isPublic: true,
      members: [req.userId],
      admin: req.userId,
    });

    const fullChat = await Chat.findById(groupChat._id)
      .populate('members', '-refreshToken')
      .populate('admin', 'username avatar');

    res.status(201).json({ chat: fullChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public groups users can join
// @route   GET /api/chats/group/public
exports.getPublicGroups = async (req, res, next) => {
  try {
    const search = req.query.search || '';

    const query = {
      isGroupChat: true,
      isPublic: true,
    };

    if (search) {
      query.chatName = { $regex: search, $options: 'i' };
    }

    const groups = await Chat.find(query)
      .populate('admin', 'username avatar')
      .populate('members', '_id username avatar')
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json({ groups });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a public group
// @route   POST /api/chats/group/:id/join
exports.joinPublicGroup = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (!chat.isGroupChat || !chat.isPublic) {
      return res.status(400).json({ message: 'This group is not open for direct joins.' });
    }

    if (chat.members.map((member) => member.toString()).includes(req.userId.toString())) {
      const existingChat = await Chat.findById(chat._id)
        .populate('members', '-refreshToken')
        .populate('admin', 'username avatar');
      return res.json({ chat: existingChat, joined: false });
    }

    if (chat.members.length >= MAX_GROUP_MEMBERS) {
      return res.status(400).json({ message: `Group cannot exceed ${MAX_GROUP_MEMBERS} members.` });
    }

    chat.members.push(req.userId);
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('members', '-refreshToken')
      .populate('admin', 'username avatar');

    res.json({ chat: updatedChat, joined: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename a group chat
// @route   PUT /api/chats/group/:id/rename
exports.renameGroup = async (req, res, next) => {
  try {
    const { chatName } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Not a group chat.' });
    }

    if (chat.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only admin can rename the group.' });
    }

    chat.chatName = chatName;
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('members', '-refreshToken')
      .populate('admin', 'username avatar');

    res.json({ chat: updatedChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to group
// @route   PUT /api/chats/group/:id/add
exports.addToGroup = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Not a group chat.' });
    }

    if (chat.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only admin can add members.' });
    }

    if (chat.members.includes(userId)) {
      return res.status(400).json({ message: 'User already in group.' });
    }

    if (chat.members.length >= MAX_GROUP_MEMBERS) {
      return res
        .status(400)
        .json({ message: `Group cannot exceed ${MAX_GROUP_MEMBERS} members.` });
    }

    chat.members.push(userId);
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('members', '-refreshToken')
      .populate('admin', 'username avatar');

    res.json({ chat: updatedChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group
// @route   PUT /api/chats/group/:id/remove
exports.removeFromGroup = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Not a group chat.' });
    }

    // Only admin can remove or user can remove themselves
    if (
      chat.admin.toString() !== req.userId.toString() &&
      userId !== req.userId.toString()
    ) {
      return res.status(403).json({ message: 'Only admin can remove members.' });
    }

    if (!chat.members.map((m) => m.toString()).includes(userId)) {
      return res.status(400).json({ message: 'User not in group.' });
    }

    chat.members = chat.members.filter((m) => m.toString() !== userId);
    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate('members', '-refreshToken')
      .populate('admin', 'username avatar');

    res.json({ chat: updatedChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a chat
// @route   DELETE /api/chats/:id
exports.deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    // For group chats, only admin can delete
    if (chat.isGroupChat && chat.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only admin can delete the group.' });
    }

    // For direct chats, either member can delete
    if (!chat.isGroupChat && !chat.members.map((m) => m.toString()).includes(req.userId.toString())) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: chat._id });
    await Chat.findByIdAndDelete(chat._id);

    res.json({ message: 'Chat deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
