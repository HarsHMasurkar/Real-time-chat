import { createContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socketService';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';

export const ChatContext = createContext(null);

const DEFAULT_MESSAGE_PAGE = 1;
const DEFAULT_MESSAGE_LIMIT = 50;

export function ChatProvider({ children }) {
  const { token } = useAuth();
  const socket = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messagePage, setMessagePage] = useState(DEFAULT_MESSAGE_PAGE);
  const [messagePagination, setMessagePagination] = useState({
    page: DEFAULT_MESSAGE_PAGE,
    limit: DEFAULT_MESSAGE_LIMIT,
    total: 0,
    pages: 0,
  });
  const [error, setError] = useState('');

  const loadChats = async () => {
    if (!token) {
      return;
    }

    setLoadingChats(true);
    try {
      const response = await api.get('/chats');
      setChats(response.data.chats || []);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadUsers = async (search = '') => {
    if (!token) {
      return;
    }

    setLoadingUsers(true);
    try {
      const response = await api.get('/users', { params: { search } });
      setUsers(response.data.users || []);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMessages = async (chatId, page = DEFAULT_MESSAGE_PAGE, append = false) => {
    if (!chatId) {
      return;
    }

    setLoadingMessages(true);
    try {
      const response = await api.get(`/messages/${chatId}`, {
        params: { page, limit: DEFAULT_MESSAGE_LIMIT },
      });

      const nextMessages = response.data.messages || [];
      setMessagePagination(response.data.pagination || messagePagination);
      setMessages((currentMessages) => (append ? [...nextMessages, ...currentMessages] : nextMessages));
      setMessagePage(page);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectChat = async (chat) => {
    if (!chat) {
      setSelectedChat(null);
      setMessages([]);
      setTypingUsers([]);
      return;
    }

    setSelectedChat(chat);
    setTypingUsers([]);
    await loadMessages(chat._id, DEFAULT_MESSAGE_PAGE, false);
    await markChatRead(chat._id);
  };

  const createDirectChat = async (userId) => {
    const response = await api.post('/chats', { userId });
    const chat = response.data.chat;
    setSelectedChat(chat);
    await loadChats();
    return chat;
  };

  const createGroupChat = async ({ chatName, members }) => {
    const response = await api.post('/chats/group', { chatName, members });
    await loadChats();
    return response.data.chat;
  };

  const sendMessage = async (content) => {
    if (!selectedChat || !content.trim()) {
      return;
    }

    const currentSocket = socket || getSocket();
    if (!currentSocket) {
      throw new Error('Socket connection is not available.');
    }

    currentSocket.emit('send-message', {
      chatId: selectedChat._id,
      content: content.trim(),
    });
  };

  const editMessage = async (messageId, content) => {
    await api.put(`/messages/${messageId}`, { content });
    if (selectedChat) {
      await loadMessages(selectedChat._id);
    }
  };

  const deleteMessage = async (messageId) => {
    await api.delete(`/messages/${messageId}`);
    if (selectedChat) {
      await loadMessages(selectedChat._id);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedChat) {
      return;
    }

    const nextPage = messagePage + 1;
    if (nextPage > messagePagination.pages) {
      return;
    }

    await loadMessages(selectedChat._id, nextPage, true);
  };

  const markChatRead = async (chatId) => {
    if (!chatId) {
      return;
    }

    await api.put(`/messages/${chatId}/read`);
    const currentSocket = socket || getSocket();
    currentSocket?.emit('messages-read', { chatId });
  };

  const emitTyping = (chatId) => {
    const currentSocket = socket || getSocket();
    currentSocket?.emit('user-typing', { chatId });
  };

  const emitStopTyping = (chatId) => {
    const currentSocket = socket || getSocket();
    currentSocket?.emit('stop-typing', { chatId });
  };

  useEffect(() => {
    if (!token) {
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
      setUsers([]);
      setTypingUsers([]);
      setOnlineUsers([]);
      return;
    }

    loadChats();
    loadUsers();
  }, [token]);

  useEffect(() => {
    if (!socket || !selectedChat) {
      return;
    }

    const chatId = selectedChat._id;
    socket.emit('join-chat', chatId);
    markChatRead(chatId);

    return () => {
      socket.emit('leave-chat', chatId);
    };
  }, [socket, selectedChat?._id]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleReceiveMessage = (message) => {
      const messageChatId = message.chat?._id || message.chat;
      setChats((currentChats) =>
        currentChats
          .map((chat) =>
            chat._id === messageChatId
              ? {
                  ...chat,
                  lastMessage: message,
                  updatedAt: message.createdAt || new Date().toISOString(),
                }
              : chat
          )
          .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
      );

      if (selectedChat?._id === messageChatId) {
        setMessages((currentMessages) => {
          const alreadyIncluded = currentMessages.some((item) => item._id === message._id);
          return alreadyIncluded ? currentMessages : [...currentMessages, message];
        });
        markChatRead(messageChatId);
      }
    };

    const handleMessageEdited = (updatedMessage) => {
      const messageChatId = updatedMessage.chat?._id || updatedMessage.chat;
      if (selectedChat?._id !== messageChatId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) => (message._id === updatedMessage._id ? updatedMessage : message))
      );
    };

    const handleMessageDeleted = ({ messageId, chatId }) => {
      if (selectedChat?._id !== chatId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message._id === messageId
            ? {
                ...message,
                isDeleted: true,
                content: 'This message was deleted',
              }
            : message
        )
      );
    };

    const handleTyping = ({ userId, username, chatId }) => {
      if (selectedChat?._id !== chatId || !username || userId === undefined) {
        return;
      }

      setTypingUsers((currentUsers) =>
        currentUsers.some((currentUser) => currentUser.userId === userId)
          ? currentUsers
          : [...currentUsers, { userId, username }]
      );
    };

    const handleStopTyping = ({ chatId, userId }) => {
      if (selectedChat?._id !== chatId) {
        return;
      }

      setTypingUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.userId !== userId));
    };

    const handleStatus = ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers((currentUsers) => {
        const nextUsers = currentUsers.filter((user) => user.userId !== userId);
        return [...nextUsers, { userId, isOnline, lastSeen }];
      });
    };

    const handleOnlineUsers = (onlineList) => {
      setOnlineUsers(onlineList);
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('user-typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);
    socket.on('user-status', handleStatus);
    socket.on('online-users', handleOnlineUsers);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('user-typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
      socket.off('user-status', handleStatus);
      socket.off('online-users', handleOnlineUsers);
    };
  }, [socket, selectedChat?._id]);

  const value = useMemo(
    () => ({
      chats,
      selectedChat,
      messages,
      users,
      loadingChats,
      loadingMessages,
      loadingUsers,
      typingUsers,
      onlineUsers,
      messagePagination,
      error,
      setError,
      setSelectedChat,
      loadChats,
      loadUsers,
      loadMessages,
      loadMoreMessages,
      selectChat,
      createDirectChat,
      createGroupChat,
      sendMessage,
      editMessage,
      deleteMessage,
      markChatRead,
      emitTyping,
      emitStopTyping,
    }),
    [
      chats,
      selectedChat,
      messages,
      users,
      loadingChats,
      loadingMessages,
      loadingUsers,
      typingUsers,
      onlineUsers,
      messagePagination,
      error,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
