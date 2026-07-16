import { useEffect, useRef, useState } from 'react';

export default function MessageInput({ onSend, onTyping, onStopTyping, disabled, chatId }) {
  const [value, setValue] = useState('');
  const typingTimer = useRef(null);

  useEffect(() => {
    setValue('');
  }, [chatId]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    onTyping?.(chatId);

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(() => {
      onStopTyping?.(chatId);
    }, 1200);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextValue = value.trim();
    if (!nextValue) {
      return;
    }

    await onSend(nextValue);
    setValue('');
    onStopTyping?.(chatId);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 sm:p-6">
      <div className="flex items-end gap-3">
        <textarea
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={disabled ? 'Select a chat to start messaging' : 'Write a message'}
          rows={1}
          className="min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </form>
  );
}
