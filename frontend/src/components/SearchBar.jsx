import { useState, useEffect } from 'react';
import { Search, SquarePen } from 'lucide-react';
import api from '../services/api';

export default function SearchBar({ onNewConversation, onUserSelect }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ============ DEBOUNCED USER SEARCH ============
  useEffect(() => {
    const phone = search.trim();

    if (phone.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const { data } = await api.get(
          `/users/search?phone=${encodeURIComponent(phone)}`
        );
        setResults(data.users || []);
      } catch (error) {
        console.error(
          'User search error:',
          error.response?.data || error.message
        );
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleUserClick = (user) => {
    onUserSelect?.(user);
    setSearch('');
    setResults([]);
  };

  const showDropdown = search.trim().length >= 3;

  // 🔑 Avatar URL helper
  const getAvatarUrl = (u) => {
    const a = u?.avatar;
    if (!a || a === 'null' || a === 'undefined') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        u?.fullName || 'User'
      )}&background=0D8ABC&color=fff`;
    }
    if (a.startsWith('http') || a.startsWith('data:')) return a;
    return `http://localhost:5000${a.startsWith('/') ? '' : '/'}${a}`;
  };

  return (
    <div className="flex items-center gap-2 px-4 pb-3">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-base-400 pointer-events-none"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by phone number..."
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-base-800 border border-base-700 text-sm text-base-100 placeholder:text-base-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan/40 focus:border-accent-cyan/40 transition-all"
        />

        {/* ============ DROPDOWN RESULTS ============ */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl bg-base-900 border border-base-700 shadow-xl max-h-80 overflow-y-auto">
            {searching && (
              <div className="p-4 text-sm text-base-400">Searching...</div>
            )}

            {!searching && results.length === 0 && (
              <div className="p-4 text-sm text-base-400">No user found</div>
            )}

            {!searching &&
              results.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleUserClick(user)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-base-800 transition"
                >
                  <img
                    src={getAvatarUrl(user)}
                    alt={user.fullName}
                    className="h-10 w-10 rounded-full object-cover shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.fullName || 'User'
                      )}&background=0D8ABC&color=fff`;
                    }}
                  />

                  <div className="min-w-0">
                    <p className="font-medium text-sm text-base-100 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-base-400 truncate">
                      {user.phoneNumber}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <button
        onClick={onNewConversation}
        aria-label="New conversation"
        className="w-10 h-10 shrink-0 grid place-items-center rounded-xl bg-accent-gradient text-base-950 shadow-glow-accent hover:brightness-110 active:scale-95 transition-all"
      >
        <SquarePen size={17} strokeWidth={2.4} />
      </button>
    </div>
  );
}