export default function MessageReaction({ reactions, onToggle }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r, i) => (
        <button
          key={i}
          onClick={() => onToggle(i)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border transition-colors ${
            r.reacted
              ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan'
              : 'bg-base-800 border-base-600 text-base-300 hover:border-base-500'
          }`}
        >
          <span>{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
    </div>
  );
}
