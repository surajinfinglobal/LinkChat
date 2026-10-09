import { Loader2 } from 'lucide-react'

export default function PrimaryButton({ children, loading, disabled, className = '', ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-gradient py-3 text-[15px] font-semibold text-base-950 transition-all duration-200 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base-950 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
      {loading ? (
        <>
          <Loader2 className="relative h-[18px] w-[18px] animate-spin" strokeWidth={2.5} />
          <span className="relative">{typeof loading === 'string' ? loading : 'Please wait…'}</span>
        </>
      ) : (
        <span className="relative">{children}</span>
      )}
    </button>
  )
}
