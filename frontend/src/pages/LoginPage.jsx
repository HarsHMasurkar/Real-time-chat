import LoginForm from '../components/Auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(33,132,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(98,237,255,0.12),transparent_26%),linear-gradient(180deg,#07111f_0%,#0b1628_100%)] lg:grid-cols-[1.08fr_0.92fr]">
      <div className="hidden flex-col justify-between p-10 text-white lg:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-accent-200/80">Realtime Chat</p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-tight">
            Fast messaging with a sharp, modern interface.
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-6 text-slate-300">
            Direct chats, presence, typing, and history, wrapped in a focused, high-contrast UI.
          </p>
        </div>
        <div className="grid max-w-xl grid-cols-3 gap-4 text-sm text-slate-300">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">JWT auth</div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">1:1 chat</div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">Responsive UI</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[2.25rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Sign in</h2>
            <p className="mt-3 text-sm text-slate-400">Continue to your chat workspace.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
