import { Pin, BellOff } from "lucide-react";
import { formatListTime } from "../utils/time";

export default function ConversationItem({
  conversation,
  currentUserId,
  active,
  onClick,
}) {
  const {
    participants = [],
    lastMessage,
    unread = 0,
    pinned = false,
    muted = false,
    typing = false,
    type = "dm",
    updatedAt,
   lastMessageAt,
  } = conversation;

  // Current user ko hata kar doosra participant nikalo
   const otherUser = participants.find(
    (participant) =>
      String(participant?._id) !== String(currentUserId)
  );
    if (!otherUser) {
    return null;
  }

  const name =
    otherUser?.fullName ||
    conversation.name ||
    "Unknown User";

  const avatar = otherUser.avatar
    ? otherUser.avatar.startsWith("http")
      ? otherUser.avatar
      : `http://localhost:5000${otherUser.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=0D8ABC&color=fff`;

  const online =
    otherUser?.status === "online";

  const lastMessageText =
    lastMessage?.text || "No messages yet";

  const lastMessageAuthorId =
    lastMessage?.authorId ||
    lastMessage?.senderId ||
    lastMessage?.sender?._id;

  const isMyMessage =
    String(lastMessageAuthorId) === String(currentUserId);

  const lastMessageTime =
    conversation.lastMessageAt ||
    lastMessage?.createdAt ||
    updatedAt;

      const messageTime =
    lastMessageAt ||
    lastMessage?.createdAt ||
    updatedAt;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all group ${
        active
          ? "bg-base-750 shadow-glow"
          : "hover:bg-base-800/70"
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={avatar}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />

        {type === "dm" && online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-base-900" />
        )}
      </div>

      {/* Conversation details */}
      <div className="min-w-0 flex-1">
        {/* Name + time */}
        <div className="flex items-center gap-1.5">
          <p
            className={`text-sm truncate ${
              unread > 0
                ? "font-semibold text-base-100"
                : "font-medium text-base-200"
            }`}
          >
            {name}
          </p>

          {pinned && (
            <Pin
              size={11}
              className="text-base-400 shrink-0"
              fill="currentColor"
            />
          )}

          {muted && (
            <BellOff
              size={11}
              className="text-base-400 shrink-0"
            />
          )}

          <span className="ml-auto text-[11px] text-base-400 shrink-0 tabular-nums">
            {messageTime ? formatListTime(messageTime) : ""}
          </span>
        </div>

        {/* Last message */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {typing ? (
            <p className="text-xs text-accent-cyan font-medium truncate">
              typing…
            </p>
          ) : (
            <p
              className={`text-xs truncate flex-1 ${
                unread > 0
                  ? "text-base-200"
                  : "text-base-400"
              }`}
            >
              {isMyMessage ? "You: " : ""}
              {lastMessageText}
            </p>
          )}

          {/* Unread count */}
          {unread > 0 && (
            <span className="ml-auto shrink-0 flex h-[18px] items-center gap-1 rounded-full bg-emerald-400/10 px-1.5 text-[10px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}