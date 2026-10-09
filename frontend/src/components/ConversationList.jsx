import { useState, useMemo } from 'react';
import ConversationItem from './ConversationItem';

// TABS ko define karo — component ke bahar (constants)
const TABS = ['All', 'Unread', 'Groups'];

export default function ConversationList({
  conversations = [],
  activeId,
  onSelect,
  query = '',
  currentUserId, //  Naye logic ke liye yeh prop add kiya gaya hai
}) {
  const [tab, setTab] = useState('All');

  const filtered = useMemo(() => {
    let list = [...conversations];

    // 1. [New Logic Added] Duplicate conversations ko filter out karo
    const unique = new Map();
    list.forEach((conversation) => {
      const id = conversation._id || conversation.id;
      if (id) {
        unique.set(String(id), conversation);
      }
    });
    list = Array.from(unique.values());

    // 2. Tab rules filter (Typo fixed!)
    if (tab === 'Unread') {
      list = list.filter((c) => c.unread > 0);
    }

    if (tab === 'Groups') {
      list = list.filter((c) => c.type === 'group');
    }

    // 3. [New Logic Added] Clean and secure string-based query match
    if (query.trim()) {
      const q = query.toLowerCase();

      list = list.filter((c) => {
        const otherUser = c.participants?.find(
          (p) => String(p?._id) !== String(currentUserId)
        );

        // Name mapping with fallbacks from your implementation
        const name = otherUser?.fullName || c.name || '';
        const lastMessage = c.lastMessage?.text || ''; // From first code

        return (
          name.toLowerCase().includes(q) ||
          lastMessage.toLowerCase().includes(q)
        );
      });
    }

    // 4. [Combined Logic] Pinned items handling from Code 1 + clean Date sorting from Code 2
    return list.sort((a, b) => {
      // First Code's feature: Pinned chats always on top
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      // Second Code's cleaner timestamp evaluation
      const dateA = a.lastMessageAt || a.updatedAt || 0;
      const dateB = b.lastMessageAt || b.updatedAt || 0;

      return new Date(dateB) - new Date(dateA);
    });
  }, [conversations, tab, query, currentUserId]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tabs Layout (Same as Code 1) */}
      <div className="flex items-center gap-1 px-4 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-base-750 text-base-100'
                : 'text-base-400 hover:text-base-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Conversation list Render Window (Same as Code 1) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-base-400 mt-8">
            No conversations found
          </p>
        ) : (
          filtered.map((conversation) => {
            const conversationId = conversation._id || conversation.id;

            return (
              <ConversationItem
                key={conversationId}
                conversation={conversation}
                currentUserId={currentUserId} // Safely forwarding identifier
                active={String(conversationId) === String(activeId)} // Strict matching
                onClick={() => onSelect(conversationId)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
