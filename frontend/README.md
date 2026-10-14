# LinkChat

A polished, fully responsive chat application UI built with React + Vite + Tailwind CSS. Frontend only — no backend, auth, or sockets. All data is mocked in `src/data/mockData.js`.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Structure

- `src/components/` — all UI components (Sidebar, ChatWindow, MessageBubble, ChatInfoPanel, etc.)
- `src/data/mockData.js` — mock users, conversations, messages, shared media/files/links
- `src/utils/time.js` — timestamp + date-separator formatting helpers

## What works

- Select conversations, search/filter (All / Unread / Groups), pinned & muted indicators
- Send messages (Enter to send, Shift+Enter for newline), auto-expanding composer
- Simulated reply + typing indicator after you send a DM
- Emoji picker, quick-reactions on hover, reply-to preview, voice-recording UI (visual only)
- Light/dark theme toggle
- Right info panel (desktop sidebar / mobile drawer) with shared media, files, links, mute toggle
- Fully responsive: sidebar hides on mobile when a chat is open, back button appears, info panel becomes a drawer

## Next steps (not implemented)

Real-time backend (WebSocket/Socket.IO), authentication, persistence, actual file/image upload, and real voice recording.
