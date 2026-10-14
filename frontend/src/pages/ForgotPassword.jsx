import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Mail,
  MailCheck,
} from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import PasswordField from '../components/PasswordField.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import api from '../services/api.js'
import { isValidEmail } from '../lib/validators.js'

const RESEND_SECONDS = 30

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('email')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (cooldown <= 0) return
    timerRef.current = setTimeout(() => setCooldown((remaining) => remaining - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [cooldown])

  function clearMessages() {
    setError('')
    setNotice('')
  }

  function getErrorMessage(requestError, fallback) {
    return requestError.response?.data?.message || fallback
  }

  async function sendOtp(e) {
    e?.preventDefault()
    clearMessages()

    if (!email.trim()) {
      setError('Enter your email address')
      return
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { data } = await api.post('/auth/forgot-password', { email: normalizedEmail })
      setEmail(normalizedEmail)
      setOtp('')
      setStep('otp')
      setNotice(data.message || 'If an account exists, a reset OTP has been sent.')
      setCooldown(RESEND_SECONDS)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to send OTP. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    clearMessages()

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/verify-reset-otp', { email, otp })
      setStep('password')
      setNotice('OTP verified. Choose a new password.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to verify OTP. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(e) {
    e.preventDefault()
    clearMessages()

    if (newPassword.length < 8) {
      setError('Use at least 8 characters for your password')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      })
      setStep('success')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setNotice(data.message || 'Your password has been reset successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to reset password. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const stepContent = {
    email: {
      title: 'Reset your password',
      subtitle: 'Enter your email and we’ll send you a one-time code.',
    },
    otp: {
      title: 'Check your inbox',
      subtitle: `Enter the 6-digit OTP sent to ${email}.`,
    },
    password: {
      title: 'Create a new password',
      subtitle: 'Choose a new password with at least 8 characters.',
    },
    success: {
      title: 'Password updated',
      subtitle: 'Your new password is ready to use.',
    },
  }
  const currentStep = stepContent[step]

  return (
    <AuthLayout
      headline="Every conversation, actually in sync."
      tagline="LinkChat keeps your messages, calls and files in one calm place — synced instantly across every device you use."
      title={currentStep.title}
      subtitle={currentStep.subtitle}
      footer={
        step === 'email' || step === 'success' ? (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-medium text-base-300 transition-colors hover:text-accent-cyan focus:outline-none focus-visible:underline"
          >
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              clearMessages()
              setStep(step === 'password' ? 'otp' : 'email')
            }}
            className="inline-flex items-center gap-1.5 font-medium text-base-300 transition-colors hover:text-accent-cyan focus:outline-none focus-visible:underline"
          >
            <ArrowLeft size={15} />
            {step === 'password' ? 'Back to OTP' : 'Change email'}
          </button>
        )
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-[13.5px] text-rose-300 animate-fade-in"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && step !== 'success' && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3 text-[13px] text-emerald-300"
        >
          {notice}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={sendOtp} noValidate className="flex flex-col gap-[18px]">
          <FormField
            id="email"
            label="Email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@example.com"
            borderless
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearMessages()
            }}
          />
          <PrimaryButton type="submit" loading={loading && 'Sending OTP…'}>
            Send reset OTP
          </PrimaryButton>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyOtp} noValidate className="flex flex-col gap-[18px]">
          <div className="flex h-14 w-14 items-center justify-center self-center rounded-full bg-cyan-500/15">
            <MailCheck size={26} className="text-cyan-400" strokeWidth={1.8} />
          </div>
          <FormField
            id="otp"
            label="6-digit OTP"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            borderless
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              clearMessages()
            }}
            hint="The code expires in 10 minutes."
          />
          <PrimaryButton type="submit" loading={loading && 'Verifying OTP…'}>
            Verify OTP
          </PrimaryButton>
          <button
            type="button"
            onClick={sendOtp}
            disabled={cooldown > 0 || loading}
            className="text-[13.5px] font-medium text-cyan-400 transition-colors hover:text-accent-blue focus:outline-none focus-visible:underline disabled:cursor-not-allowed disabled:text-base-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={resetPassword} noValidate className="flex flex-col gap-[18px]">
          <PasswordField
            id="new-password"
            label="New password"
            placeholder="At least 8 characters"
            borderless
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              clearMessages()
            }}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            placeholder="Enter your new password again"
            borderless
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              clearMessages()
            }}
          />
          <PrimaryButton type="submit" loading={loading && 'Updating password…'}>
            Reset password
          </PrimaryButton>
        </form>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center gap-4 py-2 text-center animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 size={26} className="text-emerald-400" strokeWidth={1.8} />
          </div>
          <p className="text-sm text-base-300">{notice}</p>
          <Link to="/login" className="w-full">
            <PrimaryButton type="button">Go to sign in</PrimaryButton>
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
