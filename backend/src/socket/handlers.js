const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { SOCKET_EVENTS } = require('../config/constants');

// Store online users: { socketId: { userId, username } }
const onlineUsers = new Map();
// Store userId -> socketId mapping for quick lookups
const userSocketMap = new Map();

const setupSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Add to online users
    onlineUsers.set(socket.id, {
      userId: socket.userId,
      username: socket.username,
    });
    userSocketMap.set(socket.userId, socket.id);

    // Update user status in DB
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Broadcast user online status
    socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS, {
      userId: socket.userId,
      username: socket.username,
      isOnline: true,
    });

    // Send list of online users to the connecting client
    const onlineUsersList = [];
    for (const [, value] of onlineUsers) {
      onlineUsersList.push(value);
    }
    socket.emit('online-users', onlineUsersList);

    // Join a chat room
    socket.on(SOCKET_EVENTS.JOIN_CHAT, async (chatId) => {
      socket.join(chatId);
      console.log(`${socket.username} joined chat: ${chatId}`);

      // Notify others in the chat
      socket.to(chatId).emit(SOCKET_EVENTS.USER_JOINED, {
        userId: socket.userId,
        username: socket.username,
        chatId,
      });
    });

    // Leave a chat room
    socket.on(SOCKET_EVENTS.LEAVE_CHAT, (chatId) => {
      socket.leave(chatId);
      console.log(`${socket.username} left chat: ${chatId}`);

      socket.to(chatId).emit(SOCKET_EVENTS.USER_LEFT, {
        userId: socket.userId,
        username: socket.username,
        chatId,
      });
    });

    // Send a message
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
      try {
        const { chatId, content } = data;

        if (!chatId || !content) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Chat ID and content required.' });
          return;
        }

        // Verify chat membership
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.members.map((m) => m.toString()).includes(socket.userId)) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Not authorized for this chat.' });
          return;
        }

        // Create and save message
        let message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content,
          readBy: [socket.userId],
        });

        message = await message.populate('sender', 'username avatar');
        message = await message.populate('chat');

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
        });

        // Emit to all users in the chat room (including sender for confirmation)
        io.to(chatId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);

        // Also notify members who might not be in the room but online
        chat.members.forEach((memberId) => {
          const memberIdStr = memberId.toString();
          if (memberIdStr !== socket.userId) {
            const memberSocketId = userSocketMap.get(memberIdStr);
            if (memberSocketId) {
              io.to(memberSocketId).emit('new-message-notification', {
                chatId,
                message,
              });
            }
          }
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send message.' });
      }
    });

    // Message edited
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, async (data) => {
      try {
        const { messageId, content, chatId } = data;
        const message = await Message.findById(messageId);

        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Cannot edit this message.' });
          return;
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const updatedMessage = await Message.findById(messageId).populate(
          'sender',
          'username avatar'
        );

        io.to(chatId).emit(SOCKET_EVENTS.MESSAGE_EDITED, updatedMessage);
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to edit message.' });
      }
    });

    // Message deleted
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, async (data) => {
      try {
        const { messageId, chatId } = data;
        const message = await Message.findById(messageId);

        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Cannot delete this message.' });
          return;
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'This message was deleted';
        await message.save();

        io.to(chatId).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
          messageId,
          chatId,
        });
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to delete message.' });
      }
    });

    // Typing indicator
    socket.on(SOCKET_EVENTS.USER_TYPING, (data) => {
      const { chatId } = data;
      socket.to(chatId).emit(SOCKET_EVENTS.USER_TYPING, {
        userId: socket.userId,
        username: socket.username,
        chatId,
      });
    });

    // Stop typing indicator
    socket.on(SOCKET_EVENTS.STOP_TYPING, (data) => {
      const { chatId } = data;
      socket.to(chatId).emit(SOCKET_EVENTS.STOP_TYPING, {
        userId: socket.userId,
        chatId,
      });
    });

    // Mark messages as read
    socket.on(SOCKET_EVENTS.MESSAGES_READ, async (data) => {
      try {
        const { chatId } = data;
        await Message.updateMany(
          {
            chat: chatId,
            readBy: { $ne: socket.userId },
          },
          {
            $addToSet: { readBy: socket.userId },
          }
        );

        socket.to(chatId).emit(SOCKET_EVENTS.MESSAGES_READ, {
          userId: socket.userId,
          chatId,
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      console.log(`User disconnected: ${socket.username} (${socket.userId})`);

      onlineUsers.delete(socket.id);
      userSocketMap.delete(socket.userId);

      // Update user status in DB
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Broadcast user offline status
      socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS, {
        userId: socket.userId,
        username: socket.username,
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });
};

module.exports = setupSocket;
