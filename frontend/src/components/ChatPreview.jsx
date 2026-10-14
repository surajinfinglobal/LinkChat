const messages = [
  { from: 'them', text: 'Hey — did the new designs land yet?', time: '9:41' },
  { from: 'me', text: 'Just pushed them, take a look 👀', time: '9:42' },
  { from: 'them', text: 'These are so clean, love the accent color', time: '9:44' },
]

export default function ChatPreview() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-base-700/70 bg-base-900/60 p-4 shadow-panel backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2.5 border-b border-base-700/60 pb-3">
        <div className="relative h-8 w-8 shrink-0 rounded-full bg-accent-gradient">
          <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-base-900 bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-base-100">Priya Menon</p>
          <p className="text-xs text-base-400">Active now</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                m.from === 'me'
                  ? 'rounded-br-sm bg-accent-gradient text-base-950 font-medium'
                  : 'rounded-bl-sm bg-base-800/80 text-base-100'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div className="flex justify-start">
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-base-800/80 px-3 py-2.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-400 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-400 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
