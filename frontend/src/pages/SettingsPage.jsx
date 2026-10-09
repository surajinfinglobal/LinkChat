import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsSidebar from '../settings/components/SettingsSidebar';
import SettingsMobileHeader from '../settings/components/SettingsMobileHeader';
import ConfirmModal from '../settings/components/ConfirmModal';
import AccountSection from '../settings/sections/AccountSection';
import ProfileSection from '../settings/sections/ProfileSection';
import AppearanceSection from '../settings/sections/AppearanceSection';
import NotificationsSection from '../settings/sections/NotificationsSection';
import PrivacySection from '../settings/sections/PrivacySection';
import SecuritySection from '../settings/sections/SecuritySection';
import ChatSettingsSection from '../settings/sections/ChatSettingsSection';
import BlockedUsersSection from '../settings/sections/BlockedUsersSection';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import socket from '../services/socket';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, loading, logout, updateUser } = useUser();

  const [active, setActive] = useState('account');
  const [mobileView, setMobileView] = useState('nav');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('linkchat-theme');
    return savedTheme || 'light';
  });
  const [wallpaper, setWallpaper] = useState(() => {
    const savedWallpaper = localStorage.getItem('linkchat-wallpaper');
    return savedWallpaper || 'default';
  });
  const [density, setDensity] = useState('comfortable');

  const [notifications, setNotifications] = useState(() => {
    const defaults = {
      messages: true,
      sound: true,
      soundOption: 'Chime',
      desktop: true,
      mentions: true,
      groups: true,
    };

    try {
      return {
        ...defaults,
        ...JSON.parse(localStorage.getItem('linkchat-notifications') || '{}'),
      };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem('linkchat-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const [privacy, setPrivacy] = useState({
    lastSeen: 'everyone',
    onlineStatus: true,
    photoVisibility: 'everyone',
    readReceipts: true,
  });
  const [privacySaveState, setPrivacySaveState] = useState('loading');
  const privacySaveQueue = useRef(Promise.resolve());
  const privacySaveVersion = useRef(0);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    api.get('/users/privacy')
      .then(({ data }) => {
        if (!active) return;
        setPrivacy(data.privacy);
        updateUser({ privacy: data.privacy });
        setPrivacySaveState('saved');
      })
      .catch((error) => {
        console.error('Privacy settings load error:', error.response?.data || error.message);
        if (active) setPrivacySaveState('error');
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const handlePrivacyChange = (nextPrivacy) => {
    setPrivacy(nextPrivacy);
    setPrivacySaveState('saving');
    const version = ++privacySaveVersion.current;

    privacySaveQueue.current = privacySaveQueue.current
      .catch(() => {})
      .then(() => api.put('/users/privacy', nextPrivacy))
      .then(({ data }) => {
        socket.emit('privacy_settings_updated');
        if (version !== privacySaveVersion.current) return;

        setPrivacy(data.privacy);
        updateUser({ privacy: data.privacy });
        setPrivacySaveState('saved');
      })
      .catch((error) => {
        console.error('Privacy settings save error:', error.response?.data || error.message);
        if (version === privacySaveVersion.current) setPrivacySaveState('error');
      });
  };

  const [chatSettings, setChatSettings] = useState({
    enterToSend: true,
    spellCheck: true,
    fontSize: 'medium',
    autoDownload: true,
    autoPlayVideos: false,
    archiveOnTop: false,
  });

  useEffect(() => {
    localStorage.setItem('linkchat-theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const resolveTheme = () => {
      const effectiveTheme =
        theme === 'system'
          ? (mediaQuery.matches ? 'dark' : 'light')
          : theme;

      document.documentElement.classList.toggle('light', effectiveTheme === 'light');
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    };

    resolveTheme();

    if (theme === 'system') {
      const handleSystemThemeChange = () => resolveTheme();
      mediaQuery.addEventListener('change', handleSystemThemeChange);

      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('linkchat-wallpaper', wallpaper);
  }, [wallpaper]);

  const handleSelect = (id) => {
    setActive(id);
    setMobileView('section');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 900));
    logout?.();                // 👈 context ka logout
    setLoggingOut(false);
    setLogoutOpen(false);
    navigate('/login');
  };

  const goBackToChat = () => navigate('/');

  // ⏳ Loading state — jab tak user fetch na ho
  if (loading) {
    return (
      <div className="h-screen w-screen grid place-items-center bg-base-950 text-base-100">
        <div className="w-8 h-8 rounded-full border-2 border-base-700 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  // 🚫 Safety
  if (!user) {
    return (
      <div className="h-screen w-screen grid place-items-center bg-base-950 text-base-100">
        <p className="text-sm text-base-400">Please sign in to view settings.</p>
      </div>
    );
  }

  const renderSection = () => {
    switch (active) {
      case 'account':
        return <AccountSection user={user} />;
      case 'profile':
        return <ProfileSection user={user} />;
      case 'appearance':
        return (
          <AppearanceSection
            theme={theme}
            onThemeChange={setTheme}
            wallpaper={wallpaper}
            onWallpaperChange={setWallpaper}
            density={density}
            onDensityChange={setDensity}
          />
        );
      case 'notifications':
        return (
          <NotificationsSection
            settings={notifications}
            onChange={setNotifications}
          />
        );
      case 'privacy':
        return (
          <PrivacySection
            settings={privacy}
            onChange={handlePrivacyChange}
            saveState={privacySaveState}
          />
        );
      case 'security':
        return <SecuritySection user={user} />;
      case 'chat':
        return (
          <ChatSettingsSection
            settings={chatSettings}
            onChange={setChatSettings}
          />
        );
      case 'blocked':
        return <BlockedUsersSection />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-base-950 text-base-100 overflow-hidden">
      <SettingsSidebar
        active={active}
        onSelect={handleSelect}
        onBack={goBackToChat}
        onLogout={() => setLogoutOpen(true)}
        user={user}
        loading={loading}
        mobileHidden={mobileView === 'section'}
      />

      <div className={`flex-1 min-w-0 flex-col h-full ${mobileView === 'nav' ? 'hidden md:flex' : 'flex'}`}>
        <SettingsMobileHeader section={active} onBack={() => setMobileView('nav')} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10">{renderSection()}</div>
        </div>
      </div>

      <ConfirmModal
        open={logoutOpen}
        title="Log out of LinkChat?"
        description="You'll need to log back in to access your conversations on this device."
        confirmLabel="Log out"
        danger
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}