import { forwardRef } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const FormField = forwardRef(function FormField(
  { id, label, icon: Icon, error, success, hint, className = '', rightSlot, borderless = false, ...props },
  ref
) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-base-300">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              error ? 'text-rose-400' : 'text-base-400 peer-focus:text-accent-cyan'
            }`}
            strokeWidth={1.8}
          />
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`peer w-full h-11 rounded-xl border bg-base-900/60 text-sm text-base-100 outline-none transition-all duration-200 placeholder:text-base-500 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${rightSlot ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 animate-shake'
              : 'border-base-600/80 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20 hover:border-base-500'
          }`}
          {...props}
        />
        {rightSlot && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400 animate-fade-in">
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </p>
      )}
      {!error && success && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 size={14} strokeWidth={2} />
          {success}
        </p>
      )}
      {!error && !success && hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-base-400">
          {hint}
        </p>
      )}
    </div>
  )
})

export default FormField
