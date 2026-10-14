import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, title, description, error, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-base-700 bg-base-850 shadow-panel p-6 animate-pop-in">
        <button onClick={onCancel} className="absolute top-4 right-4 w-7 h-7 grid place-items-center rounded-lg text-base-400 hover:text-base-100 hover:bg-base-750">
          <X size={15} />
        </button>

        <div className={`w-11 h-11 rounded-2xl grid place-items-center mb-4 ${danger ? 'bg-rose-500/10 text-rose-400' : 'bg-accent-cyan/10 text-accent-cyan'}`}>
          <AlertTriangle size={20} />
        </div>

        <h3 className="text-base font-semibold text-base-100">{title}</h3>
        {description && <p className="mt-1.5 text-sm text-base-400 leading-relaxed">{description}</p>}
        {error && <p role="alert" className="mt-2 text-sm text-rose-400">{error}</p>}

        <div className="flex items-center gap-2.5 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl bg-base-800 border border-base-600 text-sm font-medium text-base-200 hover:bg-base-750 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
              danger ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-accent-gradient text-base-950 hover:brightness-110'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
