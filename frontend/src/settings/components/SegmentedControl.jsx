export default function SegmentedControl({ options, value, onChange, className = '', disabled = false }) {
  return (
    <div className={`inline-flex items-center gap-0.5 p-1 rounded-xl bg-base-800 border border-base-700 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
            value === opt.value
              ? 'bg-accent-gradient text-base-950 shadow-glow-accent'
              : 'text-base-300 hover:text-base-100'
          }`}
        >
          {opt.icon && <opt.icon size={13} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
