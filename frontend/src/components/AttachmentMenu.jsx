import { Image, FileText, Camera, MapPin, User } from 'lucide-react';

const OPTIONS = [
  { icon: Image, label: 'Photo', color: 'from-fuchsia-400 to-pink-500' },
  { icon: FileText, label: 'Document', color: 'from-blue-400 to-indigo-500' },
  { icon: Camera, label: 'Camera', color: 'from-amber-400 to-orange-500' },
  { icon: MapPin, label: 'Location', color: 'from-emerald-400 to-teal-500' },
  { icon: User, label: 'Contact', color: 'from-violet-400 to-purple-500' },
];

export default function AttachmentMenu({ onClose, onPick }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-base-800 border border-base-600 rounded-2xl shadow-panel p-2 grid grid-cols-3 gap-1.5 w-64 animate-pop-in z-30">
      {OPTIONS.map(({ icon: Icon, label, color }) => (
        <button
          key={label}
          onClick={() => {
            onPick?.(label);
            onClose();
          }}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-base-700 transition-colors"
        >
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} grid place-items-center text-white shadow-glow`}>
            <Icon size={18} />
          </div>
          <span className="text-[11px] text-base-300 font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
