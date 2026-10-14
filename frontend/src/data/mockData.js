// Realistic mock data for the chat application. No backend — everything here is static/local.

export const currentUser = {
  id: 'u-me',
  name: 'Suraj Mehta',
  avatar: 'https://i.pravatar.cc/150?img=68',
  status: 'online',
  bio: 'Frontend engineer · building nice things with React',
};

export const conversations = [
  {
    id: 'c1',
    type: 'dm',
    name: 'Ananya Rao',
    avatar: 'https://i.pravatar.cc/150?img=47',
    online: true,
    lastSeen: 'Online',
    pinned: true,
    muted: false,
    unread: 3,
    lastMessageAt: '2026-09-25T09:41:00',
    typing: true,
    bio: 'Product designer @ Loop · Coffee-powered · Mumbai',
    lastMessage: { authorId: 'c1', text: 'Send me the updated Figma file na', type: 'text' },
  },
  {
    id: 'c2',
    type: 'dm',
    name: 'Kabir Singh',
    avatar: 'https://i.pravatar.cc/150?img=12',
    online: true,
    lastSeen: 'Online',
    pinned: true,
    muted: false,
    unread: 0,
    lastMessageAt: '2026-09-25T08:55:00',
    bio: 'iOS dev · Runs marathons · Delhi',
    lastMessage: { authorId: 'u-me', text: 'Deployed the fix, check kar lena', type: 'text' },
  },
  {
    id: 'c3',
    type: 'group',
    name: 'Design Team 🎨',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=designteam',
    online: false,
    members: 6,
    lastSeen: '6 members',
    pinned: false,
    muted: true,
    unread: 12,
    lastMessageAt: '2026-09-25T08:20:00',
    lastMessage: { authorId: 'c7', text: 'Meera: Uploaded the new icon set to Drive', type: 'text' },
  },
  {
    id: 'c4',
    type: 'dm',
    name: 'Priya Nair',
    avatar: 'https://i.pravatar.cc/150?img=32',
    online: false,
    lastSeen: 'Last seen 2h ago',
    pinned: false,
    muted: false,
    unread: 0,
    lastMessageAt: '2026-09-25T07:10:00',
    bio: 'Backend engineer · Laravel & Go · Bengaluru',
    lastMessage: { authorId: 'c4', text: '📎 api-spec-v2.pdf', type: 'file' },
  },
  {
    id: 'c5',
    type: 'dm',
    name: 'Rohan Verma',
    avatar: 'https://i.pravatar.cc/150?img=14',
    online: false,
    lastSeen: 'Last seen yesterday',
    pinned: false,
    muted: false,
    unread: 0,
    lastMessageAt: '2026-09-24T21:03:00',
    bio: 'Freelance motion designer',
    lastMessage: { authorId: 'u-me', text: 'Haan bilkul, Monday works 👍', type: 'text' },
  },
  {
    id: 'c6',
    type: 'group',
    name: 'Cargo Runway Client',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=cargorunway',
    online: false,
    members: 4,
    lastSeen: '4 members',
    pinned: false,
    muted: false,
    unread: 1,
    lastMessageAt: '2026-09-24T18:47:00',
    lastMessage: { authorId: 'c8', text: 'Vikram: Timeline looks good, let’s proceed', type: 'text' },
  },
  {
    id: 'c7',
    type: 'dm',
    name: 'Ishaan Kapoor',
    avatar: 'https://i.pravatar.cc/150?img=51',
    online: true,
    lastSeen: 'Online',
    pinned: false,
    muted: false,
    unread: 0,
    lastMessageAt: '2026-09-24T15:12:00',
    bio: 'Building an indie SaaS 🚀',
    lastMessage: { authorId: 'c7', text: 'lol true', type: 'text' },
  },
  {
    id: 'c8',
    type: 'dm',
    name: 'Neha Joshi',
    avatar: 'https://i.pravatar.cc/150?img=45',
    online: false,
    lastSeen: 'Last seen 3d ago',
    pinned: false,
    muted: true,
    unread: 0,
    lastMessageAt: '2026-09-21T11:00:00',
    bio: 'QA lead',
    lastMessage: { authorId: 'u-me', text: 'Bug fixed ✅', type: 'text' },
  },
];

// messagesByConversation: keyed by conversation id, oldest first
export const messagesByConversation = {
  c1: [
    { id: 'm1', authorId: 'c1', type: 'text', text: 'Hey! Did you get a chance to look at the onboarding flow?', time: '2026-09-25T09:12:00', status: 'read' },
    { id: 'm2', authorId: 'u-me', type: 'text', text: 'Yep, just finished reviewing it. Really clean work 🔥', time: '2026-09-25T09:14:00', status: 'read' },
    {
      id: 'm3',
      authorId: 'u-me',
      type: 'text',
      text: 'One thought — the empty state on step 3 feels a bit bare',
      time: '2026-09-25T09:14:30',
      status: 'read',
      reactions: [{ emoji: '👍', count: 1, reacted: false }],
    },
    { id: 'm4', authorId: 'c1', type: 'image', images: ['https://picsum.photos/seed/onboard1/500/360'], text: '', time: '2026-09-25T09:20:00', status: 'read' },
    {
      id: 'm5',
      authorId: 'c1',
      type: 'text',
      text: 'Here’s the updated version with an illustration',
      time: '2026-09-25T09:20:20',
      status: 'read',
    },
    {
      id: 'm6',
      authorId: 'u-me',
      type: 'text',
      text: 'That’s so much better, love the illustration style',
      time: '2026-09-25T09:22:00',
      status: 'read',
      replyTo: { authorName: 'Ananya Rao', text: 'Here’s the updated version with an illustration' },
    },
    { id: 'm7', authorId: 'c1', type: 'text', text: 'Haha thanks! Spent way too long picking the color 😅', time: '2026-09-25T09:23:00', status: 'read' },
    { id: 'sep-unread', type: 'unread-separator', time: '2026-09-25T09:30:00' },
    { id: 'm8', authorId: 'c1', type: 'text', text: 'Also — client wants a dark mode variant by Friday', time: '2026-09-25T09:38:00', status: 'delivered' },
    {
      id: 'm9',
      authorId: 'c1',
      type: 'file',
      fileName: 'onboarding-spec-v3.pdf',
      fileSize: '2.4 MB',
      text: '',
      time: '2026-09-25T09:39:00',
      status: 'delivered',
    },
    { id: 'm10', authorId: 'c1', type: 'text', text: 'Send me the updated Figma file na', time: '2026-09-25T09:41:00', status: 'delivered' },
  ],
  c2: [
    { id: 'm1', authorId: 'c2', type: 'text', text: 'Bhai, build fail ho raha hai staging pe', time: '2026-09-25T08:30:00', status: 'read' },
    { id: 'm2', authorId: 'u-me', type: 'text', text: 'Checking now, ek min', time: '2026-09-25T08:31:00', status: 'read' },
    { id: 'm3', authorId: 'u-me', type: 'text', text: 'Found it — env variable missing in the pipeline config', time: '2026-09-25T08:40:00', status: 'read' },
    { id: 'm4', authorId: 'c2', type: 'text', text: 'Ahh classic 😂 thanks for catching that', time: '2026-09-25T08:42:00', status: 'read', reactions: [{ emoji: '😂', count: 1, reacted: true }] },
    { id: 'm5', authorId: 'u-me', type: 'text', text: 'Deployed the fix, check kar lena', time: '2026-09-25T08:55:00', status: 'delivered' },
  ],
  c3: [
    { id: 'm1', authorId: 'c5', authorName: 'Rohan Verma', type: 'text', text: 'New style guide is up in Notion', time: '2026-09-25T07:50:00', status: 'read' },
    { id: 'm2', authorId: 'c1', authorName: 'Ananya Rao', type: 'text', text: 'Nice, the type scale looks solid', time: '2026-09-25T07:55:00', status: 'read' },
    { id: 'm3', authorId: 'c7', authorName: 'Meera Iyer', type: 'image', images: ['https://picsum.photos/seed/iconset/400/300', 'https://picsum.photos/seed/iconset2/400/300'], text: 'Uploaded the new icon set to Drive', time: '2026-09-25T08:20:00', status: 'delivered' },
  ],
  c4: [
    { id: 'm1', authorId: 'c4', type: 'text', text: 'API spec ready for review', time: '2026-09-25T06:55:00', status: 'read' },
    { id: 'm2', authorId: 'c4', type: 'file', fileName: 'api-spec-v2.pdf', fileSize: '1.1 MB', text: '', time: '2026-09-25T07:10:00', status: 'delivered' },
  ],
  c5: [
    { id: 'm1', authorId: 'c5', type: 'text', text: 'Can we push the review call to Monday?', time: '2026-09-24T20:55:00', status: 'read' },
    { id: 'm2', authorId: 'u-me', type: 'text', text: 'Haan bilkul, Monday works 👍', time: '2026-09-24T21:03:00', status: 'read' },
  ],
  c6: [
    { id: 'm1', authorId: 'c8', authorName: 'Vikram Shah', type: 'text', text: 'Sharing the revised timeline shortly', time: '2026-09-24T18:30:00', status: 'read' },
    { id: 'm2', authorId: 'c8', authorName: 'Vikram Shah', type: 'text', text: 'Timeline looks good, let’s proceed', time: '2026-09-24T18:47:00', status: 'delivered' },
  ],
  c7: [
    { id: 'm1', authorId: 'c7', type: 'text', text: 'Landing page traffic doubled after the redesign', time: '2026-09-24T15:05:00', status: 'read' },
    { id: 'm2', authorId: 'u-me', type: 'text', text: 'lol true', time: '2026-09-24T15:12:00', status: 'read' },
  ],
  c8: [
    { id: 'm1', authorId: 'c8', type: 'text', text: 'Found a bug in checkout flow, sending a report', time: '2026-09-21T10:40:00', status: 'read' },
    { id: 'm2', authorId: 'u-me', type: 'text', text: 'Bug fixed ✅', time: '2026-09-21T11:00:00', status: 'read' },
  ],
};

export const sharedMedia = {
  c1: [
    'https://picsum.photos/seed/med1/200/200',
    'https://picsum.photos/seed/med2/200/200',
    'https://picsum.photos/seed/med3/200/200',
    'https://picsum.photos/seed/med4/200/200',
    'https://picsum.photos/seed/med5/200/200',
    'https://picsum.photos/seed/med6/200/200',
  ],
};

export const sharedFiles = {
  c1: [
    { name: 'onboarding-spec-v3.pdf', size: '2.4 MB', date: 'Today' },
    { name: 'user-flow-diagram.fig', size: '5.1 MB', date: 'Yesterday' },
  ],
};

export const sharedLinks = {
  c1: [
    { title: 'Figma — Onboarding Flow', url: 'figma.com/file/onboarding' },
    { title: 'Notion — Design Notes', url: 'notion.so/design-notes' },
  ],
};

export const emojiList = [
  '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎',
  '🙏', '👏', '🔥', '🎉', '❤️', '✅', '💯', '😅', '🤝', '🚀',
  '😴', '🥳', '😭', '🤩', '👀', '💡', '📌', '⚡', '🌟', '😇',
];

export const quickReactions = ['❤️', '😂', '👍', '😮', '😢', '🙏'];
