import { ChevronLeft } from 'lucide-react';

const TITLES = {
  account: 'My Account',
  profile: 'Profile',
  appearance: 'Appearance',
  notifications: 'Notifications',
  privacy: 'Privacy',
  security: 'Security',
  chat: 'Chat Settings',
  blocked: 'Blocked Users',
};

export default function SettingsMobileHeader({ section, onBack }) {
  return (
    <div className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-base-700/70 bg-base-900/80 backdrop-blur-md sticky top-0 z-10">
      <button onClick={onBack} className="w-8 h-8 -ml-1 grid place-items-center rounded-lg text-base-300 hover:text-base-100" aria-label="Back">
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm font-semibold text-base-100">{TITLES[section] || 'Settings'}</span>
    </div>
  );
}
