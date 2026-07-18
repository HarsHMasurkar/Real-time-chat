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
    publicGroups,
    loadingChats,
    loadingUsers,
    loadingPublicGroups,
    selectedChat,
    createDirectChat,
    createPublicGroup,
    joinPublicGroup,
    selectChat,
    loadUsers,
  } = useChat();
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const filteredUsers = useMemo(
    () => users.filter((candidate) => candidate._id !== user?._id),
    [users, user]
  );

  const directChats = chats.filter((chat) => !chat.isGroupChat);
  const groupChats = chats.filter((chat) => chat.isGroupChat);
  const onlineCount = users.filter((candidate) => candidate.isOnline).length;

  const handleSearch = async (event) => {
    const value = event.target.value;
    setSearch(value);
    await loadUsers(value);
  };

  const handleCreatePublicGroup = async (event) => {
    event.preventDefault();
    const name = groupName.trim();
    if (!name) {
      return;
    }

    try {
      setCreatingGroup(true);
      await createPublicGroup({ chatName: name });
      setGroupName('');
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(6,11,19,0.94),rgba(10,18,33,0.92))] backdrop-blur-xl">
      <div className="border-b border-white/10 p-5">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-glow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Realtime Chat</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">{user?.username}</h1>
              <p className="mt-2 text-sm text-slate-400">Jump into a direct chat or keep a group on deck.</p>
            </div>
            <button
              onClick={logout}
              className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              Logout
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Chats</div>
              <div className="mt-1 text-lg font-semibold text-white">{chats.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Online</div>
              <div className="mt-1 text-lg font-semibold text-white">{onlineCount}</div>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-500">
              Find people
            </label>
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search by name or email"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent-400"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Direct Chats</div>
              <p className="mt-1 text-xs text-slate-500">One tap to continue an existing 1:1 conversation.</p>
            </div>
            <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-400">
              {directChats.length}
            </div>
          </div>
          {loadingChats ? (
            <div className="py-8">
              <LoadingSpinner label="Loading chats" />
            </div>
          ) : null}
          <div className="space-y-2">
            {directChats.map((chat) => {
              const isActive = selectedChat?._id === chat._id;
              const title = chat.isGroupChat
                ? chat.chatName || 'Group chat'
                : chat.members?.find((member) => member._id !== user?._id)?.username || 'Direct chat';
              const peer = chat.members?.find((member) => member._id !== user?._id);

              return (
                <button
                  key={chat._id}
                  onClick={() => selectChat(chat)}
                  className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-accent-400/50 bg-accent-500/15 text-white shadow-glow'
                      : 'border-white/10 bg-slate-950/35 text-slate-200 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-cyan-400 text-sm font-semibold text-white">
                        {title.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{title}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {peer?.bio || 'Direct message'}
                        </div>
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

        <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Start 1:1</div>
              <p className="mt-1 text-xs text-slate-500">Pick someone to open a new direct chat instantly.</p>
            </div>
            <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-400">
              {filteredUsers.length}
            </div>
          </div>
          {loadingUsers ? <LoadingSpinner label="Loading people" /> : null}
          <div className="space-y-2">
            {filteredUsers.map((candidate) => (
              <button
                key={candidate._id}
                onClick={() => createDirectChat(candidate._id)}
                className="flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-slate-950/35 px-4 py-3 text-left text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-sm font-semibold text-white">
                    {candidate.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{candidate.username}</div>
                    <div className="mt-1 text-xs text-slate-400">{candidate.email}</div>
                  </div>
                </div>
                <UserPresence isOnline={candidate.isOnline} lastSeen={candidate.lastSeen} />
              </button>
            ))}
          </div>
        </section>

        {groupChats.length > 0 ? (
          <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
            <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Group Chats
            </div>
            <div className="space-y-2">
              {groupChats.map((chat) => {
                const isActive = selectedChat?._id === chat._id;

                return (
                  <button
                    key={chat._id}
                    onClick={() => selectChat(chat)}
                    className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-accent-400/50 bg-accent-500/15 text-white'
                        : 'border-white/10 bg-slate-950/35 text-slate-200 hover:border-white/20 hover:bg-white/8'
                    }`}
                  >
                    <div className="font-medium">{chat.chatName || 'Group chat'}</div>
                    <div className="mt-1 text-xs text-slate-400">{chat.members?.length || 0} members</div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
          <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Public Groups
          </div>

          <form onSubmit={handleCreatePublicGroup} className="mb-3 flex gap-2 px-2">
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Create a group"
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent-400"
            />
            <button
              type="submit"
              disabled={creatingGroup}
              className="rounded-xl bg-accent-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-accent-400 disabled:opacity-60"
            >
              {creatingGroup ? '...' : 'Create'}
            </button>
          </form>

          {loadingPublicGroups ? <LoadingSpinner label="Loading groups" /> : null}

          <div className="space-y-2">
            {publicGroups.map((group) => {
              const isMember = group.members?.some((member) => member._id === user?._id);
              const isActive = selectedChat?._id === group._id;

              return (
                <div
                  key={group._id}
                  className={`rounded-[1.25rem] border px-3 py-3 transition ${
                    isActive
                      ? 'border-accent-400/50 bg-accent-500/15 text-white'
                      : 'border-white/10 bg-slate-950/35 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{group.chatName || 'Public group'}</div>
                      <div className="mt-1 text-xs text-slate-400">{group.members?.length || 0} members</div>
                    </div>
                    <button
                      onClick={() => (isMember ? selectChat(group) : joinPublicGroup(group._id))}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs transition hover:border-white/25 hover:bg-white/10"
                    >
                      {isMember ? 'Open' : 'Join'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
