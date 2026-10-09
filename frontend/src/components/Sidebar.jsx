import { useState } from 'react';
import { ChevronsUp, MessageCircle } from 'lucide-react';
import UserProfile from './UserProfile';
import SearchBar from './SearchBar';
import ConversationList from './ConversationList';
import MobileHeader from './MobileHeader';
import { useUser } from '../context/UserContext';

export default function Sidebar({
  conversations,
  activeId,
  onUserSelect,
  onSelect,
  onOpenSettings,
  onNewConversation,
  mobileHidden,
}) {
  const [query, setQuery] = useState('');
  const { user: currentUser } = useUser();

  return (
    <aside
      className={`w-full md:w-[320px] shrink-0 h-full flex flex-col bg-base-900 border-r border-base-700/70 ${
        mobileHidden ? 'hidden md:flex' : 'flex'
      }`}
    >
      <MobileHeader
        onNewConversation={onNewConversation}
        onOpenSettings={onOpenSettings}
      />

      <div className="hidden md:flex items-center gap-2 px-4 pt-5 pb-1">
        <div className="w-8 h-8 rounded-xl bg-accent-gradient grid place-items-center shadow-glow-accent">
          <MessageCircle size={16} className="text-base-950" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold text-base-100 tracking-tight">
          LinkChat
        </span>
      </div>

      {/* 👇 user prop nahi bhej rahe — UserProfile khud context se lega */}
      <UserProfile onOpenSettings={onOpenSettings} />

      <div className="h-px bg-base-700/60 mx-4 mb-3" />

      <SearchBar
        value={query}
         onUserSelect={onUserSelect}
        onChange={setQuery}
        onNewConversation={onNewConversation}
      />

      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelect}
        query={query}
        currentUserId={currentUser?.id || currentUser?._id}
      />
    </aside>
  );
}