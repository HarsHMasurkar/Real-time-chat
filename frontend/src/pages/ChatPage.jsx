import Sidebar from '../components/Sidebar/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import { useChat } from '../hooks/useChat';

export default function ChatPage() {
  const { selectedChat } = useChat();

  return (
    <div className="grid min-h-screen bg-[#07111f] text-slate-100 lg:grid-cols-[360px_1fr]">
      <div className="h-[30vh] min-h-[280px] lg:h-screen">
        <Sidebar />
      </div>
      <main className="min-h-[70vh] lg:h-screen">
        {selectedChat ? (
          <ChatWindow />
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
              <h2 className="text-2xl font-semibold text-white">Pick a conversation</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Select a chat or tap a person from the sidebar to start a direct message.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
