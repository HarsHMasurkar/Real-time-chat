const User = require('../models/User');
const { USERS_PER_PAGE } = require('../config/constants');

// @desc    Get all users (for starting new chats)
// @route   GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || USERS_PER_PAGE;
    const search = req.query.search || '';

    const query = {
      _id: { $ne: req.userId }, // Exclude current user
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-refreshToken')
      .sort({ username: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users,
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

// @desc    Get user by ID
// @route   GET /api/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio, avatar } = req.body;
    const updates = {};

    if (username) {
      // Check if username is taken
      const existing = await User.findOne({ username, _id: { $ne: req.userId } });
      if (existing) {
        return res.status(400).json({ message: 'Username already taken.' });
      }
      updates.username = username;
    }
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user, message: 'Profile updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user online status
// @route   PUT /api/users/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        isOnline,
        lastSeen: new Date(),
      },
      { new: true }
    );

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
