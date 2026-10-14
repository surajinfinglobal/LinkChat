import { useState, useMemo } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from 'lucide-react';
import ConversationItem from './ConversationItem';
import { formatListTime } from '../utils/time';
import { resolveServerUrl } from '../services/api';

// TABS ko define karo — component ke bahar (constants)
const TABS = ['All', 'Unread', 'Groups', 'Calls'];

const callStatusLabel = {
  ringing: 'Ringing',
  answered: 'Answered',
  completed: 'Completed',
  missed: 'Missed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

export default function ConversationList({
  conversations = [],
  callHistory = [],
  activeId,
  onSelect,
  query = '',
  currentUserId,
}) {
  const [tab, setTab] = useState('All');

  const filtered = useMemo(() => {
    if (tab === 'Calls') {
      const normalizedCalls = callHistory
        .map((call) => {
          const isOutgoing = String(call.caller?._id || call.caller) === String(currentUserId);
          const peer = isOutgoing ? (call.receiver || {}) : (call.caller || {});
          const peerId = peer?._id || peer?.id || '';

          return {
            ...call,
            isOutgoing,
            peer,
            peerId,
            name: peer?.fullName || 'Unknown user',
            avatar: peer?.avatar
              ? peer.avatar.startsWith('http')
                ? peer.avatar
                : resolveServerUrl(peer.avatar)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(peer?.fullName || 'User')}&background=0D8ABC&color=fff`,
            lastMessageAt: call.endedAt || call.startedAt || call.createdAt,
            type: call.callType || 'voice',
            statusLabel: callStatusLabel[call.status] || 'Call',
          };
        })
        .filter((call) => {
          if (!query.trim()) return true;
          const q = query.toLowerCase();
          return (
            call.name.toLowerCase().includes(q) ||
            call.statusLabel.toLowerCase().includes(q) ||
            call.type.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));

      return normalizedCalls;
    }

    let list = [...conversations];

    const unique = new Map();
    list.forEach((conversation) => {
      const id = conversation._id || conversation.id;
      if (id) {
        unique.set(String(id), conversation);
      }
    });
    list = Array.from(unique.values());

    if (tab === 'Unread') {
      list = list.filter((c) => c.unread > 0);
    }

    if (tab === 'Groups') {
      list = list.filter((c) => c.type === 'group');
    }

    if (query.trim()) {
      const q = query.toLowerCase();

      list = list.filter((c) => {
        const otherUser = c.participants?.find(
          (p) => String(p?._id) !== String(currentUserId)
        );

        const name = otherUser?.fullName || c.name || '';
        const lastMessage = c.lastMessage?.text || '';

        return (
          name.toLowerCase().includes(q) ||
          lastMessage.toLowerCase().includes(q)
        );
      });
    }

    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      const dateA = a.lastMessageAt || a.updatedAt || 0;
      const dateB = b.lastMessageAt || b.updatedAt || 0;

      return new Date(dateB) - new Date(dateA);
    });
  }, [conversations, callHistory, tab, query, currentUserId]);

  const renderCallItem = (call) => {
    const CallIcon =
      call.status === 'missed'
        ? PhoneMissed
        : call.isOutgoing
          ? PhoneOutgoing
          : (call.type === 'video' ? Video : PhoneIncoming);
    const relatedConversation = conversations.find((conversation) =>
      conversation.participants?.some(
        (participant) =>
          String(participant?._id || participant?.id) === String(call.peerId)
      )
    );

    return (
      <button
        key={`${call.callId}-${call.createdAt || call.startedAt}`}
        type="button"
        onClick={() => {
          const targetId = relatedConversation?._id || relatedConversation?.id || call.peerId;
          if (targetId) onSelect(targetId);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all ${
          String(activeId) === String(call.peerId)
            ? 'bg-base-750 shadow-glow'
            : 'hover:bg-base-800/70'
        }`}
      >
        <div className="relative shrink-0">
          <img
            src={call.avatar}
            alt={call.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-base-200 truncate">{call.name}</p>
            <span className="ml-auto text-[11px] text-base-400 shrink-0 tabular-nums">
              {call.lastMessageAt ? formatListTime(call.lastMessageAt) : ''}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-base-400">
            <CallIcon
              size={12}
              className={call.status === 'missed' ? 'text-rose-400' : 'text-emerald-400'}
            />
            <span className="truncate">
              {call.statusLabel} • {call.type === 'video' ? 'Video' : 'Voice'}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
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

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-base-400 mt-8">
            {tab === 'Calls' ? 'No call history yet' : 'No conversations found'}
          </p>
        ) : tab === 'Calls' ? (
          filtered.map((call) => renderCallItem(call))
        ) : (
          filtered.map((conversation) => {
            const conversationId = conversation._id || conversation.id;

            return (
              <ConversationItem
                key={conversationId}
                conversation={conversation}
                currentUserId={currentUserId}
                active={String(conversationId) === String(activeId)}
                onClick={() => onSelect(conversationId)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
