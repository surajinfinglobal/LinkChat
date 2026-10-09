import { useLayoutEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { formatDateSeparator, dayKey } from '../utils/time';

export default function MessageList({
  messages = [],
  activeId,
  conversation,
  user,
  currentUserId,
  onReply,
  onReact,
  isTyping,
}) {
  const listRef = useRef(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [activeId, messages.length, isTyping]);

  // Selected user profile
  const profileUser = user || conversation?.participants?.find(
    (participant) =>
      String(participant?._id) !== String(currentUserId)
  );

  const profileAvatar = profileUser?.avatar
    ? profileUser.avatar.startsWith('http')
      ? profileUser.avatar
      : `http://localhost:5000${profileUser.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profileUser?.fullName || 'User'
      )}&background=0D8ABC&color=fff`;

  const profileName =
    profileUser?.fullName || 'User';

  let lastDay = null;

  return (
    <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 sm:px-6 py-5 space-y-3 ">
      {messages.map((msg, idx) => {
        if (msg.type === 'unread-separator') {
          return (
            <div
              key={msg.id}
              className="flex items-center gap-3 py-1"
            >
              <div className="flex-1 h-px bg-rose-500/30" />

              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">
                New messages
              </span>

              <div className="flex-1 h-px bg-rose-500/30" />
            </div>
          );
        }

        // MongoDB message date
        const messageTime =
          msg.createdAt || msg.time;

        const showDateSeparator =
          lastDay !== dayKey(messageTime);

        lastDay = dayKey(messageTime);

        // MongoDB sender
        const senderId =
          msg.sender?._id ||
          msg.authorId;

        const isMine =
          String(senderId) ===
          String(currentUserId);

        const prev = messages[idx - 1];

        const prevSenderId =
          prev?.sender?._id ||
          prev?.authorId;

        const showAvatar =
          !prev ||
          String(prevSenderId) !== String(senderId) ||
          prev.type === 'unread-separator' ||
          showDateSeparator;

        // Sender profile
        const senderAvatar = msg.sender?.avatar
          ? msg.sender.avatar.startsWith('http')
            ? msg.sender.avatar
            : `http://localhost:5000${msg.sender.avatar}`
          : profileAvatar;

        const senderName =
          msg.sender?.fullName ||
          msg.authorName ||
          profileName;

        return (
          <div key={msg._id || msg.id}>
            {showDateSeparator && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-base-700/70" />

                <span className="text-[11px] font-medium text-base-400 px-2 py-0.5 rounded-full bg-base-800 border border-base-700">
                  {formatDateSeparator(messageTime)}
                </span>

                <div className="flex-1 h-px bg-base-700/70" />
              </div>
            )}

            <MessageBubble
              message={msg}
              isMine={isMine}
              showAvatar={showAvatar}
              avatar={senderAvatar}
              authorName={senderName}
              onReply={onReply}
              onReact={onReact}
            />
          </div>
        );
      })}

      {isTyping && (
        <div className="pt-1">
          <TypingIndicator
            avatar={profileAvatar}
          />
        </div>
      )}
    </div>
  );
}