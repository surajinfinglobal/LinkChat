import { Waves } from 'lucide-react'

export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient shadow-glow-accent">
        <Waves className="text-base-950" strokeWidth={2.5} size={18} />
      </span>
      <span className="text-lg font-bold tracking-tight text-base-100">
        LinkChat
      </span>
    </div>
  )
}
