import { useState } from 'react';
import { X, BellOff, Bell, Search, Ban, Trash2, Link2, ChevronRight, ShieldOff } from 'lucide-react';
import SharedMedia from './SharedMedia';
import SharedFiles from './SharedFiles';
import ConfirmModal from '../settings/components/ConfirmModal';

export default function ChatInfoPanel({
  user,
  conversation,
  media = [],
  files = [],
  links = [],
  muted = false,
  onToggleMute,
  onToggleBlock,
  onClose,
  isDrawer = false,
})


{
  const [confirmBlock, setConfirmBlock] = useState(false);
    const name = user?.fullName || "Unknown User";

    const avatar = getAvatarUrl(user?.avatar, name);
    const online = user?.status === 'online';
    const lastSeen = user?.lastSeen
      ? `Last seen ${new Date(user.lastSeen).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'Offline';
  return (
    <aside
      className={`${
        isDrawer
          ? 'fixed inset-y-0 right-0 w-[85%] max-w-sm z-40 animate-slide-in-right shadow-2xl'
          : 'hidden lg:flex w-[300px]'
      } shrink-0 h-full flex-col bg-base-900 border-l border-base-700/70 overflow-y-auto`}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-sm font-semibold text-base-100">Details</span>
        <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-base-750 text-base-400">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col items-center px-5 py-5 text-center">
        <img src={avatar} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-base-800" />
        <p className="mt-3 text-base font-semibold text-base-100">{name}</p>
        <p className={`text-xs mt-0.5 ${online ? 'text-emerald-400' : 'text-base-400'}`}>
          {conversation.type === 'group' ? `${conversation.members || 0} members` : online ? 'Online' : lastSeen}
        </p>
        {user?.email && <p className="text-xs text-base-400 mt-2 px-2 break-all">{user.email}</p>}
        {user?.phoneNumber && <p className="text-xs text-base-400 mt-1 px-2">{user.phoneNumber}</p>}
        {user?.bio && <p className="text-xs text-base-400 mt-2 px-2 leading-relaxed">{user.bio}</p>}
      </div>

      <div className="flex items-center justify-center gap-6 px-4 pb-5">
        <QuickAction icon={Search} label="Search" />
        <QuickAction icon={muted ? Bell : BellOff} label={muted ? 'Unmute' : 'Mute'} onClick={onToggleMute} active={muted} />
      </div>

      <Section title="Shared media">
        <SharedMedia media={media} />
      </Section>

      <Section title="Shared files">
        <SharedFiles files={files} />
      </Section>

      <Section title="Shared links">
        {links && links.length > 0 ? (
          <div className="space-y-1.5">
            {links.map((l, i) => (
              <button key={i} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-base-750 transition-colors text-left">
                <div className="w-9 h-9 rounded-lg bg-base-700 grid place-items-center shrink-0">
                  <Link2 size={15} className="text-base-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-base-100 truncate">{l.title}</p>
                  <p className="text-[11px] text-accent-cyan truncate">{l.url}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-base-400 px-1">No shared links yet</p>
        )}
      </Section>

      <div className="px-4 pb-6 pt-2 space-y-1">
        {conversation.type !== 'group' && (
          <DangerRow
            icon={conversation.blockedByMe ? ShieldOff : Ban}
            label={conversation.blockedByMe ? 'Unblock user' : 'Block user'}
            onClick={() => setConfirmBlock(true)}
          />
        )}
        <DangerRow icon={Trash2} label="Delete conversation" />
      </div>

      <ConfirmModal
        open={confirmBlock}
        title={conversation.blockedByMe ? 'Unblock this user?' : 'Block this user?'}
        description={conversation.blockedByMe
          ? 'They will be able to message you again. Existing messages will remain.'
          : 'They will not be able to message you or view your profile. Existing messages will remain.'}
        confirmLabel={conversation.blockedByMe ? 'Unblock' : 'Block'}
        danger={!conversation.blockedByMe}
        onConfirm={async () => {
          await onToggleBlock?.();
          setConfirmBlock(false);
        }}
        onCancel={() => setConfirmBlock(false)}
      />
    </aside>
  );
}

function getAvatarUrl(value, name) {
  if (!value || value === 'null' || value === 'undefined') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
  }
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  return `http://localhost:5000${value.startsWith('/') ? '' : '/'}${value}`;
}

function QuickAction({ icon: Icon, label, onClick, active }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div
        className={`w-11 h-11 grid place-items-center rounded-2xl transition-colors ${
          active ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-base-800 text-base-300 group-hover:bg-base-750 group-hover:text-base-100'
        }`}
      >
        <Icon size={17} />
      </div>
      <span className="text-[11px] text-base-400">{label}</span>
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="px-4 py-3 border-t border-base-700/60">
      <button className="w-full flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-base-300 uppercase tracking-wide">{title}</span>
        <ChevronRight size={14} className="text-base-500" />
      </button>
      {children}
    </div>
  );
}

function DangerRow({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-colors text-left">
      <Icon size={16} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
