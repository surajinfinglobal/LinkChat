import { Settings } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function UserProfile({ onOpenSettings }) {
  const { user, loading } = useUser();   // 👈 context se

  // 🔑 Loading skeleton
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-4 animate-pulse">
        <div className="w-11 h-11 rounded-full bg-base-800 shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-3 w-24 bg-base-800 rounded" />
          <div className="h-2.5 w-32 bg-base-800 rounded" />
        </div>
      </div>
    );
  }

  // Null safety
  if (!user) return null;

  const displayName = user.fullName || user.name || 'User';
  const email = user.email || 'No email provided';
  const status = user.status || 'offline';

  //  Avatar — "null" string + relative path + http sab handle
  const avatarUrl = (() => {
    const a = user.avatar;
    if (!a || a === 'null' || a === 'undefined') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`;
    }
    if (a.startsWith('http') || a.startsWith('data:')) return a;
    return `http://localhost:5000${a.startsWith('/') ? '' : '/'}${a}`;
  })();

  // 🔑 Status ke hisaab se dot color
  const statusColor =
    status === 'online'
      ? 'bg-emerald-400'
      : status === 'away'
      ? 'bg-amber-400'
      : status === 'busy'
      ? 'bg-rose-400'
      : 'bg-base-500';   // offline

  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="relative shrink-0">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-base-700"
          onError={(e) => {
            // Fallback to ui-avatars if image fails
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              displayName
            )}&background=0D8ABC&color=fff`;
          }}
        />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusColor} ring-2 ring-base-900`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-base-100 truncate">
          {displayName}
        </p>
        {/* Status ke bajaye email better UX hai sidebar mein */}
        <p className="text-xs text-base-400 truncate">{email}</p>
      </div>

      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        className="w-9 h-9 grid place-items-center rounded-xl text-base-300 hover:text-base-100 hover:bg-base-750 transition-colors"
      >
        <Settings size={17} />
      </button>
    </div>
  );
}