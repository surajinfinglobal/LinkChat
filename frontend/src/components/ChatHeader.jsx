import { Phone, Video, Search, MoreVertical, ChevronLeft } from 'lucide-react';

export default function ChatHeader({ user, conversation, onOpenInfo, onBack, onSearch,onVoiceCall,
  onVideoCall}) {
  const name = user?.fullName || conversation.name || 'Unknown User';
  const avatar = getAvatarUrl(user?.avatar || conversation.avatar, name);
  const online = user?.status === 'online' || conversation.online === true;
  const lastSeen = user?.lastSeen || conversation.lastSeen;
  const statusText = online
    ? 'Online'
    : lastSeen
      ? `Last seen ${new Date(lastSeen).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'Offline';
  const { type, members } = conversation;

  return (
    <div className="h-16 shrink-0 flex items-center gap-3 px-4 border-b border-base-700/70 bg-base-900/80 backdrop-blur-md">
      <button
        onClick={onBack}
        className="md:hidden w-8 h-8 -ml-1 grid place-items-center rounded-lg text-base-300 hover:text-base-100"
        aria-label="Back"
      >
        <ChevronLeft size={20} />
      </button>

      <button onClick={onOpenInfo} className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <div className="relative shrink-0">
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
          {type !== 'group' && online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-base-900" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-base-100 truncate">{name}</p>
          <p className={`text-xs truncate ${online && type === 'dm' ? 'text-emerald-400' : 'text-base-400'}`}>
            {type === 'group' ? `${members || 0} members` : statusText}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1 shrink-0">
        <HeaderIconButton icon={Phone} label="Voice call" onClick={onVoiceCall} />
        <HeaderIconButton icon={Video} label="Video call" onClick={onVideoCall} />
        <HeaderIconButton icon={Search} label="Search in conversation" onClick={onSearch} className="hidden sm:grid" />
        <HeaderIconButton icon={MoreVertical} label="More options" />
      </div>
    </div>
  );
}

function getAvatarUrl(value, name) {
  if (!value || value === 'null' || value === 'undefined') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
  }
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  return `http://localhost:5000${value.startsWith('/') ? '' : '/'}${value}`;
}

function HeaderIconButton({ icon: Icon, label, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-9 h-9 grid place-items-center rounded-xl text-base-300 hover:text-base-100 hover:bg-base-750 active:scale-95 transition-all ${className}`}
    >
      <Icon size={17} />
    </button>
  );
}
