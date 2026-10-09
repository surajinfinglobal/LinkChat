import { MessageCircle, SquarePen } from 'lucide-react';

export default function EmptyChatState({ onNewConversation }) {
  return (
    <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-base-900 px-6">
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-[2rem] bg-accent-gradient-soft border border-accent-cyan/20 grid place-items-center">
          <MessageCircle size={42} className="text-accent-cyan" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-base-800 border border-base-700 grid place-items-center shadow-glow">
          <span className="text-lg">💬</span>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-base-100">Select a conversation</h2>
      <p className="text-sm text-base-400 mt-1.5 text-center max-w-xs leading-relaxed">
        Choose someone from your conversations, or start a new one to begin messaging.
      </p>
      <button
        onClick={onNewConversation}
        className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold shadow-glow-accent hover:brightness-110 active:scale-95 transition-all"
      >
        <SquarePen size={16} />
        New conversation
      </button>
    </div>
  );
}
