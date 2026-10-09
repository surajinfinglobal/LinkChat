export const settingsUser = {
  name: 'Suraj Mehta',
  username: 'surajm',
  email: 'suraj.mehta@linkchat.chat',
  phone: '+91 98765 43210',
  avatar: 'https://i.pravatar.cc/150?img=68',
  bio: 'Frontend engineer · building nice things with React',
  createdAt: 'March 2024',
};

export const wallpapers = [
  { id: 'default', label: 'Default', swatch: 'linear-gradient(135deg,#12151D,#1B202B)' },
  { id: 'aurora', label: 'Aurora', swatch: 'linear-gradient(135deg,#22D3EE33,#3B82F633)' },
  { id: 'sunset', label: 'Sunset', swatch: 'linear-gradient(135deg,#F59E0B33,#EF444433)' },
  { id: 'forest', label: 'Forest', swatch: 'linear-gradient(135deg,#10B98133,#0EA5E933)' },
  { id: 'violet', label: 'Violet', swatch: 'linear-gradient(135deg,#818CF833,#C084FC33)' },
  { id: 'mono', label: 'Mono', swatch: 'linear-gradient(135deg,#2E3543,#0B0D13)' },
];

export const activeSessions = [
  { id: 's1', device: 'MacBook Pro', browser: 'Chrome · macOS', location: 'Surat, India', lastActive: 'Active now', current: true, icon: 'laptop' },
  { id: 's2', device: 'iPhone 15 Pro', browser: 'LinkChat app · iOS', location: 'Surat, India', lastActive: '2 hours ago', current: false, icon: 'phone' },
  { id: 's3', device: 'Windows PC', browser: 'Edge · Windows 11', location: 'Ahmedabad, India', lastActive: 'Yesterday', current: false, icon: 'desktop' },
  { id: 's4', device: 'iPad Air', browser: 'Safari · iPadOS', location: 'Mumbai, India', lastActive: '5 days ago', current: false, icon: 'tablet' },
];

export const blockedUsers = [
  { id: 'b1', name: 'Aditya Malhotra', username: '@aditya.m', avatar: 'https://i.pravatar.cc/150?img=59', blockedOn: '12 Aug 2026' },
  { id: 'b2', name: 'Riya Kapoor', username: '@riya.k', avatar: 'https://i.pravatar.cc/150?img=25', blockedOn: '3 Jun 2026' },
];

export const connectedAccounts = [
  { id: 'google', label: 'Google', connected: true, detail: 'suraj.mehta@gmail.com' },
  { id: 'github', label: 'GitHub', connected: false, detail: '' },
];
