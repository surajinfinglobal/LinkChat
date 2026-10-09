export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-base-700/70 bg-base-900/60 ${className}`}>{children}</div>
  );
}

export function CardHeader({ title, description }) {
  return (
    <div className="px-5 sm:px-6 pt-5 pb-1">
      <h3 className="text-sm font-semibold text-base-100">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-base-400">{description}</p>}
    </div>
  );
}

export function SettingRow({ label, description, control, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-4 px-5 sm:px-6 py-4 ${className}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-base-100">{label}</p>
        {description && <p className="mt-0.5 text-xs text-base-400">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-base-700/60 mx-5 sm:mx-6" />;
}

export function PageHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-base-100 tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-base-400">{description}</p>}
    </div>
  );
}
