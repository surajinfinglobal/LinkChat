export default function AnimatedOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(59,130,246,0.18),transparent),radial-gradient(ellipse_70%_60%_at_100%_100%,rgba(34,211,238,0.14),transparent)]" />

      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-blue/20 blur-3xl animate-blob" />
      <div className="absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-accent-cyan/15 blur-3xl animate-blob-slow [animation-delay:2s]" />
      <div className="absolute bottom-[-6rem] left-1/4 h-64 w-64 rounded-full bg-accent-violet/10 blur-3xl animate-blob [animation-delay:4s]" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  )
}
