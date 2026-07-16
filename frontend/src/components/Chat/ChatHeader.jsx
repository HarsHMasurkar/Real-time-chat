import UserPresence from '../common/UserPresence';
import { useAuth } from '../../hooks/useAuth';

export default function ChatHeader({ chat, typingUsers, onlineUsers }) {
  const { user } = useAuth();

  if (!chat) {
    return (
      <header className="border-b border-white/10 px-6 py-5">
        <h2 className="text-lg font-semibold text-white">Select a conversation</h2>
        <p className="mt-1 text-sm text-slate-400">Choose a chat or start a new one from the sidebar.</p>
      </header>
    );
  }

  const directMember = chat.members?.find((member) => member._id !== user?._id);
  const title = chat.isGroupChat ? chat.chatName || 'Group chat' : directMember?.username || 'Direct chat';
  const online = directMember ? onlineUsers.some((item) => item.userId === directMember._id && item.isOnline !== false) : false;

  return (
    <header className="border-b border-white/10 px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            {chat.isGroupChat ? (
              <span>{chat.members?.length || 0} members</span>
            ) : (
              <UserPresence isOnline={online} lastSeen={directMember?.lastSeen} />
            )}
            {typingUsers.length > 0 ? (
              <span className="text-accent-300">
                {typingUsers.map((item) => item.username).join(', ')} typing...
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          {chat.isGroupChat ? 'Group space' : 'Direct message'}
        </div>
      </div>
    </header>
  );
}
