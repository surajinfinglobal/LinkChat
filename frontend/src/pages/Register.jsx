import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Mail, User, Phone, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import PasswordField from '../components/PasswordField.jsx'
import PasswordStrength from '../components/PasswordStrength.jsx'
import Checkbox from '../components/Checkbox.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { isValidEmail } from '../lib/validators.js'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function update(field) {
    return (e) => {
      setFormData((v) => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }))
    }
  }

  function validate(values = formData) {
    const next = {}
    if (!values.fullName.trim()) next.fullName = 'Enter your full name'
    else if (values.fullName.trim().length < 2) next.fullName = 'Name looks too short'

    if (!values.email.trim()) next.email = 'Enter your email address'
    else if (!isValidEmail(values.email)) next.email = 'Enter a valid email address'

    if (!values.password) next.password = 'Create a password'
    else if (values.password.length < 8) next.password = 'Use at least 8 characters'

    if (!values.phoneNumber.trim()) next.phoneNumber = 'Enter your phone number'

    if (!agreed) next.terms = 'You need to accept the terms to continue'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const submittedData = new FormData(e.currentTarget)
    const payload = {
      fullName: (submittedData.get('fullName') || '').toString().trim(),
      email: (submittedData.get('email') || '').toString().trim(),
      password: (submittedData.get('password') || '').toString(),
      phoneNumber: (submittedData.get('phoneNumber') || '').toString().trim(),
    }

    setFormData(payload)
    if (!validate(payload)) return

    setLoading(true)

    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/auth/signup',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      console.log(data)
      setSuccess(true)
    } catch (error) {
      console.error(error)
      // Axios puts server response inside error.response
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Something went wrong. Please try again.'
      setFormError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        headline="Every conversation, actually in sync."
        tagline="LinkChat keeps your messages, calls and files in one calm place — synced instantly across every device you use."
        title="You're all set"
        subtitle="Your account has been created."
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" className="text-emerald-500">
              <path d="M5 13l4 4L19 7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-base-300">
            Welcome to LinkChat, {formData.fullName.split(' ')[0] || 'there'}. Head to the login page to sign in.
          </p>
          <Link to="/login" className="w-full">
            <PrimaryButton type="button">Go to sign in</PrimaryButton>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headline="Every conversation, actually in sync."
      tagline="LinkChat keeps your messages, calls and files in one calm place — synced instantly across every device you use."
      title="Create your account"
      subtitle="Join LinkChat and start chatting in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-cyan-400 transition-colors hover:text-cyan-300 focus:outline-none focus-visible:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {formError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-[13.5px] text-rose-300 animate-fade-in"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
        <FormField
          id="fullName"
          name="fullName"
          label="Full name"
          type="text"
          icon={User}
          autoComplete="name"
          placeholder="Jordan Reyes"
          borderless
          value={formData.fullName}
          onChange={update('fullName')}
          error={errors.fullName}
        />

        <FormField
          id="email"
          name="email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          borderless
          value={formData.email}
          onChange={update('email')}
          error={errors.email}
        />

        <div>
          <PasswordField
            id="password"
            name="password"
            label="Password"
            placeholder="Create a password"
            borderless
            autoComplete="new-password"
            value={formData.password}
            onChange={update('password')}
            error={errors.password}
          />
          <PasswordStrength value={formData.password} />
        </div>

        <FormField
          id="phoneNumber"
          name="phoneNumber"
          label="Phone number"
          type="tel"
          icon={Phone}
          autoComplete="tel"
          inputMode="tel"
          placeholder="+1 555 123 4567"
          borderless
          value={formData.phoneNumber}
          onChange={update('phoneNumber')}
          error={errors.phoneNumber}
        />

        <Checkbox
          id="terms"
          name="terms"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked)
            if (errors.terms) setErrors((er) => ({ ...er, terms: undefined }))
          }}
          error={errors.terms}
        >
          I agree to the{' '}
          <a href="#" className="text-cyan-400 hover:text-cyan-300 focus:outline-none focus-visible:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-cyan-400 hover:text-cyan-300 focus:outline-none focus-visible:underline">
            Privacy Policy
          </a>
        </Checkbox>

        <PrimaryButton type="submit" loading={loading && 'Creating account…'} className="mt-1">
          Create account
        </PrimaryButton>
      </form>
    </AuthLayout>
  )
}