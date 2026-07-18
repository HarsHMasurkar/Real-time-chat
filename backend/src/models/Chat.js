const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
      maxlength: [50, 'Chat name cannot exceed 50 characters'],
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
chatSchema.index({ members: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ isGroupChat: 1, members: 1 });
chatSchema.index({ isGroupChat: 1, isPublic: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
