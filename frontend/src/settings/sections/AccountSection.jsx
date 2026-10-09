import { useEffect, useState } from 'react';
import {
  Github,
  Chrome,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserCheck,
  Loader2,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  SettingRow,
  Divider,
  PageHeader,
} from '../components/Primitives';

import ConfirmModal from '../components/ConfirmModal';
import { connectedAccounts as initialAccounts } from '../mockSettingsData';
import { useUser } from '../../context/UserContext';
import api from '../../services/api';

export default function AccountSection() {
  const { user } = useUser();

  const [createdAt, setCreatedAt] = useState(user?.createdAt || null);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState(
    user?.status || 'offline'
  );

  useEffect(() => {
    if (user?.createdAt) {
      setCreatedAt(user.createdAt);
      return;
    }

    let cancelled = false;

    const loadCreatedAt = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (!cancelled && data.user?.createdAt) {
          setCreatedAt(data.user.createdAt);
        }
      } catch (error) {
        console.error('Failed to load account creation date:', error);
      }
    };

    loadCreatedAt();

    return () => {
      cancelled = true;
    };
  }, [user?.createdAt]);

  const toggleAccount = (id) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              connected: !a.connected,
              detail: a.connected
                ? ''
                : a.detail || `${user?.username || 'user'}@${id}.com`,
            }
          : a
      )
    );
  };

  const PROVIDERS = [
    {
      id: 'google',
      label: 'Google',
      icon: Chrome,
      getAccountEmail: (user) =>
        user?.googleEmail || user?.email,
    },
    {
      id: 'github',
      label: 'GitHub',
      icon: Github,
      getAccountEmail: (user) =>
        user?.githubEmail ||
        user?.githubUsername ||
        user?.email,
    },
  ];

  const handleConfirm = async () => {
    if (!modal) return;

    setLoading(true);

    try {
      if (modal === 'deactivate') {
        await api.put('/auth/deactivate-account');

        setAccountStatus('deactivated');
        // 1 second wait
      await new Promise((resolve) => setTimeout(resolve, 1000));
        setModal(null);

        // Deactivated account ko logout kar do
        localStorage.removeItem('token');

        window.location.href = '/login';

        return;
      }

      if (modal === 'activate') {
        await api.put('/auth/reactivate-account');
         // 1 second wait
      await new Promise((resolve) => setTimeout(resolve, 1000));

        setAccountStatus('offline');
        setModal(null);

        window.location.reload();
s
        return;
      }

      if (modal === 'delete') {
        // Delete account ka API baad mein connect kar sakte ho
        console.log('Delete account API not implemented yet');
         await new Promise((resolve) => setTimeout(resolve, 1000));
        setModal(null);
      }
    } catch (error) {
      console.error(
        error.response?.data?.message ||
          'Account action failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = user?.avatar
    ? `http://localhost:5000${user.avatar}`
    : '/default-avatar.png';

  function formatDaysSince(isoString) {
    if (!isoString) return '—';

    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    const days = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 86_400_000)
    );

    return `${days} day${days === 1 ? '' : 's'}`;
  }

  const isDeactivated = accountStatus === 'deactivated';

  return (
    <div>
      <PageHeader
        title="My Account"
        description="An overview of your account and plan."
      />

      <div className="space-y-5">

        {/* Account Info */}
        <Card>
          <div className="px-5 sm:px-6 pt-6 pb-5 flex items-center gap-5 flex-wrap">

            <img
              src={avatarUrl}
              alt={user?.fullName || 'User'}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-base-800"
            />

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2 flex-wrap">

                <p className="text-base font-semibold text-base-100">
                  {user?.fullName}
                </p>

                {isDeactivated && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                    Deactivated
                  </span>
                )}

              </div>

              <p className="text-sm text-base-300 mt-0.5">
                {user?.email}
              </p>

              <p className="text-xs text-base-300 mt-1">
                Member from: {formatDaysSince(createdAt)}
              </p>

            </div>
          </div>
        </Card>


        {/* Connected Accounts */}
        <Card>
          <CardHeader
            title="Connected accounts"
            description="Sign in faster using a connected provider."
          />

          {PROVIDERS.map((provider, idx) => {
            const account = accounts.find(
              (a) => a.id === provider.id
            );

            const isConnected = account?.connected;

            const description = isConnected
              ? `Connected as ${
                  provider.getAccountEmail(user) || 'unknown'
                }`
              : 'Not connected';

            return (
              <div key={provider.id}>
                {idx > 0 && <Divider />}

                <SettingRow
                  label={provider.label}
                  description={description}
                  control={
                    <ProviderButton
                      icon={provider.icon}
                      connected={isConnected}
                      onClick={() =>
                        toggleAccount(provider.id)
                      }
                    />
                  }
                />
              </div>
            );
          })}
        </Card>


        {/* Danger Zone */}
        <Card className="border-rose-500/20">

          <CardHeader
            title="Danger zone"
            description="These actions affect your account access. Proceed with care."
          />

          {/* Deactivate / Activate */}
          <SettingRow
            label={
              isDeactivated
                ? 'Activate account'
                : 'Deactivate account'
            }

            description={
              isDeactivated
                ? 'Your account is currently deactivated. Activate it to restore account access.'
                : 'Temporarily disable your account. You can activate it again anytime.'
            }

            control={
              <button
                onClick={() =>
                  setModal(
                    isDeactivated
                      ? 'activate'
                      : 'deactivate'
                  )
                }
                disabled={loading}
                className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium border transition-colors ${
                  isDeactivated
                    ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                    : 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                }`}
              >

                {loading ? (
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />
                ) : isDeactivated ? (
                  <UserCheck size={13} />
                ) : (
                  <UserMinus size={13} />
                )}

                {isDeactivated
                  ? 'Activate'
                  : 'Deactivate'}

              </button>
            }
          />

          <Divider />

          {/* Delete */}
          <SettingRow
            label="Delete account"
            description="Permanently delete your account and all of your data. This cannot be undone."
            control={
              <button
                onClick={() => setModal('delete')}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={13} />
                Delete
              </button>
            }
          />

        </Card>


        {/* Security message */}
        <div className="flex items-center gap-2 px-1 text-xs text-base-500">
          <ShieldCheck size={13} />
          Your data is encrypted and never shared without your permission.
        </div>

      </div>


      {/* Confirm Modal */}
      <ConfirmModal
        open={!!modal}

        title={
          modal === 'delete'
            ? 'Delete your account?'
            : modal === 'activate'
            ? 'Activate your account?'
            : 'Deactivate your account?'
        }

        description={
          modal === 'delete'
            ? 'This will permanently delete your profile, messages, and all associated data. This action cannot be undone.'
            : modal === 'activate'
            ? 'Your account will be activated and you will regain access to your account.'
            : 'Your account will be deactivated and you will be signed out. You can activate it again later.'
        }

        confirmLabel={
          modal === 'delete'
            ? 'Delete account'
            : modal === 'activate'
            ? 'Activate account'
            : 'Deactivate'
        }

        danger={modal !== 'activate'}

        loading={loading}

        onConfirm={handleConfirm}

        onCancel={() => {
          if (!loading) {
            setModal(null);
          }
        }}
      />

    </div>
  );
}


function ProviderButton({
  icon: Icon,
  connected,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium transition-colors ${
        connected
          ? 'text-base-300 border border-base-600 hover:bg-base-800'
          : 'text-base-950 bg-accent-gradient hover:brightness-110'
      }`}
    >
      <Icon size={13} />

      {connected ? 'Disconnect' : 'Connect'}
    </button>
  );
}
