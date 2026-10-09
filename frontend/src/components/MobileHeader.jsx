import { MessageCircle, SquarePen, Settings } from 'lucide-react';

export default function MobileHeader({ onNewConversation, onOpenSettings }) {
  return (
    <div className="md:hidden flex items-center gap-2 px-4 pt-4 pb-2">
      <div className="w-8 h-8 rounded-xl bg-accent-gradient grid place-items-center shadow-glow-accent">
        <MessageCircle size={16} className="text-base-950" strokeWidth={2.5} />
      </div>
      <span className="text-base font-bold text-base-100 tracking-tight flex-1">LinkChat</span>
      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        className="w-9 h-9 grid place-items-center rounded-xl text-base-300 hover:bg-base-750"
      >
        <Settings size={17} />
      </button>
      <button
        onClick={onNewConversation}
        aria-label="New conversation"
        className="w-9 h-9 grid place-items-center rounded-xl bg-accent-gradient text-base-950 shadow-glow-accent active:scale-95"
      >
        <SquarePen size={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}
