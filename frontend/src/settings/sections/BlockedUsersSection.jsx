import { useEffect, useState } from 'react';
import { Search, UserPlus, UserX, ShieldOff } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/Primitives';
import ConfirmModal from '../components/ConfirmModal';
import api from '../../services/api';

export default function BlockedUsersSection() {
  const [blocked, setBlocked] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [target, setTarget] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [searching, setSearching] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [loadingUnblock, setLoadingUnblock] = useState(false);
  const [error, setError] = useState('');

  const loadBlockedUsers = async () => {
    try {
      const response = await api.get('/blocks');
      setBlocked(response.data.blockedUsers || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load blocked users');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const searchUsers = async (event) => {
    event.preventDefault();
    const phone = query.trim();
    if (phone.length < 3) {
      setResults([]);
      setError('Enter at least 3 characters of a phone number');
      return;
    }

    setError('');
    setSearching(true);
    try {
      const response = await api.get(`/users/search?phone=${encodeURIComponent(phone)}`);
      setResults(response.data.users || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to search users');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const blockUser = async (user) => {
    setSavingUserId(user._id);
    setError('');
    try {
      await api.post(`/blocks/${user._id}`);
      setBlocked((previous) => [user, ...previous]);
      setResults((previous) => previous.filter((result) => result._id !== user._id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to block user');
    } finally {
      setSavingUserId(null);
    }
  };

  const confirmUnblock = async () => {
    if (!target) return;
    setLoadingUnblock(true);
    setError('');
    try {
      await api.delete(`/blocks/${target._id}`);
      setBlocked((previous) => previous.filter((user) => user._id !== target._id));
      setTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to unblock user');
    } finally {
      setLoadingUnblock(false);
    }
  };

  const getAvatarUrl = (user) => {
    const avatar = user.avatar;
    if (!avatar || avatar === 'null' || avatar === 'undefined') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=0D8ABC&color=fff`;
    }
    if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;
    return `http://localhost:5000${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  };

  return (
    <div>
      <PageHeader title="Blocked Users" description="Blocked users can't message you or view your profile." />

      <Card className="mb-5">
        <CardHeader title="Block someone" description="Find a person by phone number." />
        <form onSubmit={searchUsers} className="flex gap-2 px-5 sm:px-6 py-4">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-400" />
            <input
              type="tel"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Phone number"
              className="h-10 w-full rounded-xl border border-base-700 bg-base-800 pl-9 pr-3 text-sm text-base-100 placeholder:text-base-400 focus:border-accent-cyan/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-accent-gradient px-3 text-sm font-semibold text-base-950 disabled:opacity-60"
          >
            <Search size={15} />
            {searching ? 'Searching' : 'Search'}
          </button>
        </form>

        {error && <p role="alert" className="px-5 sm:px-6 pb-3 text-xs text-rose-400">{error}</p>}
        {results.length > 0 && (
          <div className="border-t border-base-700/60 px-2 py-2 sm:px-3">
            {results.map((user) => (
              <div key={user._id} className="flex items-center gap-3 rounded-xl px-3 py-3">
                <img src={getAvatarUrl(user)} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-base-100">{user.fullName}</p>
                  <p className="truncate text-xs text-base-400">{user.phoneNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => blockUser(user)}
                  disabled={savingUserId === user._id}
                  aria-label={`Block ${user.fullName}`}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-base-600 px-3 text-xs font-medium text-base-200 hover:bg-base-800 disabled:opacity-60"
                >
                  <UserPlus size={14} />
                  {savingUserId === user._id ? 'Blocking' : 'Block'}
                </button>
              </div>
            ))}
          </div>
        )}
        {!searching && query.trim().length >= 3 && results.length === 0 && !error && (
          <p className="px-5 sm:px-6 pb-4 text-xs text-base-400">No matching users found.</p>
        )}
      </Card>

      <Card>
        <CardHeader title={`${blocked.length} blocked ${blocked.length === 1 ? 'user' : 'users'}`} />

        {loadingList ? (
          <p className="px-6 py-8 text-center text-sm text-base-400">Loading blocked users...</p>
        ) : blocked.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10 px-6">
            <div className="w-12 h-12 rounded-2xl bg-base-800 border border-base-700 grid place-items-center mb-3">
              <ShieldOff size={20} className="text-base-400" />
            </div>
            <p className="text-sm font-medium text-base-200">No blocked users</p>
            <p className="text-xs text-base-400 mt-1 max-w-xs">People you block will appear here so you can unblock them later.</p>
          </div>
        ) : (
          <div className="px-2 sm:px-3 pb-3 pt-2 space-y-1">
            {blocked.map((user) => (
              <div key={user._id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-base-800/50 transition-colors">
                <img src={getAvatarUrl(user)} alt="" className="w-10 h-10 rounded-full object-cover grayscale opacity-80" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-base-100 truncate">{user.fullName}</p>
                  <p className="text-xs text-base-400 truncate">{user.phoneNumber || user.email}</p>
                </div>
                <button
                  onClick={() => setTarget(user)}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-base-200 border border-base-600 hover:bg-base-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <UserX size={13} />
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmModal
        open={!!target}
        title="Unblock this user?"
        description={target ? `${target.fullName} will be able to message you again. Existing messages will remain in your chat.` : ''}
        confirmLabel="Unblock"
        danger={false}
        loading={loadingUnblock}
        onConfirm={confirmUnblock}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
