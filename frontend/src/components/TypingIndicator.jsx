export default function TypingIndicator({ avatar }) {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      {avatar && <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover mb-0.5" />}
      <div className="bg-base-800 border border-base-700 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-base-300 animate-blink" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-base-300 animate-blink" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-base-300 animate-blink" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
