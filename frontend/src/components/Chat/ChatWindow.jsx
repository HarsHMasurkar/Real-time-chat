import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../hooks/useChat';

export default function ChatWindow() {
  const {
    selectedChat,
    messages,
    loadingMessages,
    messagePagination,
    loadMoreMessages,
    sendMessage,
    emitTyping,
    emitStopTyping,
    typingUsers,
    onlineUsers,
  } = useChat();

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(10,19,34,0.96),rgba(7,17,31,0.98))]">
      <ChatHeader chat={selectedChat} typingUsers={typingUsers} onlineUsers={onlineUsers} />
      <MessageList
        messages={messages}
        loading={loadingMessages}
        hasMore={messagePagination.page < messagePagination.pages}
        onLoadMore={loadMoreMessages}
      />
      <MessageInput
        chatId={selectedChat?._id}
        disabled={!selectedChat}
        onSend={sendMessage}
        onTyping={emitTyping}
        onStopTyping={emitStopTyping}
      />
    </div>
  );
}
