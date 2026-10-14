import { forwardRef, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import FormField from './FormField.jsx'

const PasswordField = forwardRef(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField
      ref={ref}
      type={visible ? 'text' : 'password'}
      icon={Lock}
      autoComplete={props.autoComplete || 'current-password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded-md p-1 text-base-400 transition-colors hover:text-base-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/40"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
        </button>
      }
      {...props}
    />
  )
})

export default PasswordField
