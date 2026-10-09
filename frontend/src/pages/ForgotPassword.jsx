import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, MailCheck } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { isValidEmail } from '../lib/validators.js'

const RESEND_SECONDS = 30

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (cooldown <= 0) return
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [cooldown])

  async function send(e) {
    e?.preventDefault()
    if (!email.trim()) {
      setError('Enter your email address')
      return
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSent(true)
    setCooldown(RESEND_SECONDS)
  }

  if (sent) {
    return (
      <AuthLayout
        headline="Every conversation, actually in sync."
        tagline="LinkChat keeps your messages, calls and files in one calm place — synced instantly across every device you use."
        title="Check your inbox"
        subtitle="We sent a reset link to the address below."
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-medium text-base-300 transition-colors hover:text-accent-cyan focus:outline-none focus-visible:underline"
          >
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15">
            <MailCheck size={26} className="text-cyan-400" strokeWidth={1.8} />
          </div>
          <p className="text-sm text-base-300">
            If an account exists for <span className="font-medium text-base-100">{email}</span>, a reset
            link is on its way. It can take a minute to arrive — check spam if you don't see it.
          </p>

          <button
            type="button"
            onClick={send}
            disabled={cooldown > 0 || loading}
            className="text-[13.5px] font-medium text-cyan-400 transition-colors hover:text-accent-blue focus:outline-none focus-visible:underline disabled:cursor-not-allowed disabled:text-base-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend link in ${cooldown}s` : loading ? 'Sending…' : 'Resend link'}
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headline="Every conversation, actually in sync."
      tagline="LinkChat keeps your messages, calls and files in one calm place — synced instantly across every device you use."
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to get back in."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-medium text-base-300 transition-colors hover:text-accent-cyan focus:outline-none focus-visible:underline"
        >
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={send} noValidate className="flex flex-col gap-[18px]">
        <FormField
          id="email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          error={error}
        />

        <PrimaryButton type="submit" loading={loading && 'Sending link…'}>
          Send reset link
        </PrimaryButton>
      </form>
    </AuthLayout>
  )
}
