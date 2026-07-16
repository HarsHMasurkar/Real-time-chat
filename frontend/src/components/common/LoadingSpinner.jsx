export default function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-slate-300">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-accent-400" />
      <span>{label}</span>
    </div>
  );
}
