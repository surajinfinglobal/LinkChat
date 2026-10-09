import { Github } from 'lucide-react'

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  )
}

function AppleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
      <path d="M16.365 1.43c0 1.14-.475 2.093-1.144 2.813-.71.766-1.868 1.362-2.847 1.286-.13-1.096.404-2.245 1.06-2.94.72-.79 1.985-1.396 2.93-1.16ZM20.51 17.35c-.548 1.248-.808 1.807-1.51 2.9-.98 1.53-2.36 3.44-4.075 3.46-1.523.017-1.915-.99-3.978-.978-2.062.012-2.5 1-4.024.982-1.716-.02-3.02-1.735-4-3.264-2.74-4.234-3.03-9.2-1.335-11.84 1.2-1.87 3.1-2.966 4.884-2.966 1.816 0 2.958 1 4.462 1 1.457 0 2.348-1.002 4.463-1.002 1.588 0 3.27.865 4.47 2.36-3.93 2.153-3.29 7.762.643 9.346Z" />
    </svg>
  )
}

const providers = [
  { id: 'google', label: 'Google', icon: GoogleIcon },
  { id: 'apple', label: 'Apple', icon: AppleIcon },
  { id: 'github', label: 'GitHub', icon: Github },
]

export default function SocialButtons({ onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {providers.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect?.(id)}
          aria-label={`Continue with ${label}`}
          className="flex items-center justify-center rounded-xl border border-base-600/80 bg-base-900/60 py-2.5 text-base-300 transition-all duration-200 hover:border-base-500 hover:bg-base-800 hover:text-base-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/40 active:scale-[0.97]"
        >
          {id === 'github' ? (
            <Icon size={18} className="text-base-100" />
          ) : (
            <Icon />
          )}
        </button>
      ))}
    </div>
  )
}
