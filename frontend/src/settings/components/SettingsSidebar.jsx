import {
  User,
  UserCircle,
  Palette,
  Bell,
  Lock,
  ShieldCheck,
  MessageSquare,
  UserX,
  LogOut,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'account', label: 'My Account', icon: User },
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'chat', label: 'Chat Settings', icon: MessageSquare },
  { id: 'blocked', label: 'Blocked Users', icon: UserX },
];

export default function SettingsSidebar({
  active,
  onSelect,
  onBack,
  onLogout,
  user,
  loading,
  mobileHidden,
}) {
  // 🔑 Safe display values
  const displayName = user?.fullName || user?.name || 'User';
  const username =
    user?.username || user?.email?.split('@')[0] || 'user';

  // 🔑 Avatar URL — "null" string, relative path, http sab handle
  const avatarUrl = (() => {
    const a = user?.avatar;
    if (!a || a === 'null' || a === 'undefined') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName
      )}&background=0D8ABC&color=fff`;
    }
    if (a.startsWith('http') || a.startsWith('data:')) return a;
    return `http://localhost:5000${a.startsWith('/') ? '' : '/'}${a}`;
  })();

  return (
    <aside
      className={`w-full md:w-[260px] shrink-0 h-full flex-col bg-base-900 border-r border-base-700/70 ${
        mobileHidden ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="px-4 pt-5 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-base-300 hover:text-base-100 transition-colors mb-5"
        >
          <ChevronLeft size={16} />
          <span className="text-xs font-medium">Back to chats</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent-gradient grid place-items-center shadow-glow-accent">
            <MessageCircle size={16} className="text-base-950" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-base-100 tracking-tight">
            Settings
          </span>
        </div>
      </div>

      {/* 🔑 User card — loading skeleton ya real data */}
      <div className="flex items-center gap-3 px-4 py-3 mx-2 mb-2 rounded-xl bg-base-800/60">
        {loading ? (
          <>
            <div className="w-10 h-10 rounded-full bg-base-700 animate-pulse shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-24 bg-base-700 rounded animate-pulse" />
              <div className="h-2.5 w-16 bg-base-700 rounded animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover shrink-0"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayName
                )}&background=0D8ABC&color=fff`;
              }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-base-100 truncate">
                {displayName}
              </p>
              <p className="text-xs text-base-400 truncate">@{username}</p>
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-1 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              active === id
                ? 'bg-base-750 text-base-100 font-medium shadow-glow'
                : 'text-base-300 hover:text-base-100 hover:bg-base-800/70'
            }`}
          >
            <Icon size={17} className={active === id ? 'text-accent-cyan' : ''} />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-base-700/60">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}