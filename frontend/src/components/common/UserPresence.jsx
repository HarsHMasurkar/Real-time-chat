export default function UserPresence({ isOnline, lastSeen }) {
  const label = isOnline ? 'Online' : lastSeen ? 'Away' : 'Offline';

  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-300">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          isOnline ? 'bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'bg-slate-500'
        }`}
      />
      {label}
    </span>
  );
}
