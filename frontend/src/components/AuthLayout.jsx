import Logo from './Logo.jsx'
import AnimatedOrbs from './AnimatedOrbs.jsx'
import ChatPreview from './ChatPreview.jsx'

export default function AuthLayout({ headline, tagline, title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen w-full bg-base-950 lg:flex">
      {/* Left brand panel — hidden on small screens */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-accent-blue/15 via-transparent to-accent-cyan/10 lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <AnimatedOrbs />
        <div className="relative z-10">
          <Logo />
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-base-100 xl:text-[2.75rem]">
            {headline}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-base-300">{tagline}</p>
        </div>
        <div className="relative z-10">
          <ChatPreview />
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex min-h-screen flex-1 items-start justify-center overflow-x-hidden overflow-y-auto bg-base-950 px-5 py-8 sm:px-8 sm:py-10 lg:items-center">
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden="true">
          <AnimatedOrbs />
        </div>

        <div className="relative z-10 w-full max-w-[420px] py-2 sm:py-0">
          <div className="mb-6 flex justify-center sm:mb-8 lg:hidden">
            <Logo />
          </div>

          <div className="animate-fade-in rounded-2xl border border-base-700/70 bg-base-900/60 p-5 shadow-panel backdrop-blur-xl sm:p-8">
            <div className="mb-6 sm:mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-base-100">{title}</h2>
              {subtitle && <p className="mt-1.5 text-sm text-base-400">{subtitle}</p>}
            </div>
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-base-400">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
