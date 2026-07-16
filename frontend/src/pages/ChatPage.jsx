import Sidebar from '../components/Sidebar/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import { useChat } from '../hooks/useChat';

export default function ChatPage() {
  const { selectedChat } = useChat();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(33,132,255,0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(98,237,255,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(7,17,31,0.9),rgba(7,17,31,0.98))]" />
      <div className="relative grid min-h-screen lg:grid-cols-[390px_1fr]">
        <div className="h-[32vh] min-h-[320px] lg:h-screen">
          <Sidebar />
        </div>
        <main className="min-h-[68vh] lg:h-screen">
          {selectedChat ? (
            <ChatWindow />
          ) : (
            <div className="flex h-full items-center justify-center px-6">
              <div className="max-w-lg rounded-[2.25rem] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl shadow-glow">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-cyan-400 text-2xl font-semibold text-white">
                  +
                </div>
                <h2 className="text-3xl font-semibold text-white">Pick a conversation</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Select an existing chat or tap a person from the sidebar to open a new one-to-one chat instantly.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
