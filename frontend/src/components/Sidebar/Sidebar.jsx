import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import LoadingSpinner from '../common/LoadingSpinner';
import UserPresence from '../common/UserPresence';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const {
    chats,
    users,
    loadingChats,
    loadingUsers,
    selectedChat,
    createDirectChat,
    selectChat,
    loadUsers,
  } = useChat();
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(
    () => users.filter((candidate) => candidate._id !== user?._id),
    [users, user]
  );

  const handleSearch = async (event) => {
    const value = event.target.value;
    setSearch(value);
    await loadUsers(value);
  };

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Realtime Chat</p>
            <h1 className="mt-2 text-xl font-semibold text-white">{user?.username}</h1>
          </div>
          <button
            onClick={logout}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-white/20 hover:bg-white/5"
          >
            Logout
          </button>
        </div>
        <div className="mt-4">
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search people"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <section>
          <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Conversations
          </div>
          {loadingChats ? (
            <div className="py-8">
              <LoadingSpinner label="Loading chats" />
            </div>
          ) : null}
          <div className="space-y-2">
            {chats.map((chat) => {
              const isActive = selectedChat?._id === chat._id;
              const title = chat.isGroupChat
                ? chat.chatName || 'Group chat'
                : chat.members?.find((member) => member._id !== user?._id)?.username || 'Direct chat';

              return (
                <button
                  key={chat._id}
                  onClick={() => selectChat(chat)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-accent-400/40 bg-accent-500/15 text-white shadow-glow'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{title}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {chat.isGroupChat ? `${chat.members?.length || 0} members` : 'Direct message'}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            People
          </div>
          {loadingUsers ? <LoadingSpinner label="Loading people" /> : null}
          <div className="space-y-2">
            {filteredUsers.map((candidate) => (
              <button
                key={candidate._id}
                onClick={() => createDirectChat(candidate._id)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                <div>
                  <div className="font-medium">{candidate.username}</div>
                  <div className="mt-1 text-xs text-slate-400">{candidate.email}</div>
                </div>
                <UserPresence isOnline={candidate.isOnline} lastSeen={candidate.lastSeen} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
