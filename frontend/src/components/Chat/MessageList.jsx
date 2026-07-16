import { useEffect, useRef } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export default function MessageList({ messages, loading, onLoadMore, hasMore }) {
  const bottomRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner label="Loading messages" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
      {hasMore ? (
        <div className="mb-4 flex justify-center">
          <button
            onClick={onLoadMore}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/10"
          >
            Load earlier messages
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        {messages.map((message) => {
          const mine = message.sender?._id === user?._id || message.sender === user?._id;
          return (
            <article key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 shadow-sm ${
                  mine
                    ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white'
                    : 'border border-white/10 bg-white/5 text-slate-100'
                }`}
              >
                {!mine ? (
                  <div className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                    {message.sender?.username || 'Unknown'}
                  </div>
                ) : null}
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {message.isDeleted ? 'This message was deleted' : message.content}
                </p>
                <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-300/80">
                  {message.isEdited ? <span>edited</span> : null}
                  <span>
                    {message.createdAt
                      ? new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
