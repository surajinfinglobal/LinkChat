import { FileText } from 'lucide-react';

export default function SharedFiles({ files }) {
  if (!files || files.length === 0) {
    return <p className="text-xs text-base-400 px-1">No shared files yet</p>;
  }
  return (
    <div className="space-y-1.5">
      {files.map((f, i) => (
        <button key={i} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-base-750 transition-colors text-left">
          <div className="w-9 h-9 rounded-lg bg-base-700 grid place-items-center shrink-0">
            <FileText size={16} className="text-base-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-base-100 truncate">{f.name}</p>
            <p className="text-[11px] text-base-400">{f.size} · {f.date}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
