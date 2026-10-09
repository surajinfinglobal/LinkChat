import { Check } from 'lucide-react'

export default function Checkbox({ id, checked, onChange, children, error }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 select-none">
        <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="peer absolute h-full w-full cursor-pointer appearance-none rounded-[5px] border border-base-600/80 bg-base-900/60 transition-colors checked:border-transparent checked:bg-accent-gradient focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/40"
          />
          <Check
            size={13}
            strokeWidth={3}
            className="pointer-events-none text-base-950 opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span className="text-xs leading-snug text-base-300">{children}</span>
      </label>
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  )
}
