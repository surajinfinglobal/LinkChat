import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Mail, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import PasswordField from '../components/PasswordField.jsx'
import Checkbox from '../components/Checkbox.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SocialButtons from '../components/SocialButtons.jsx'
import { isValidEmail } from '../lib/validators.js'
import { useUser } from '../context/UserContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useUser()

  const [values, setValues] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }))
      if (formError) setFormError('')
    }
  }

  function validate() {
    const next = {}
    if (!values.email.trim()) next.email = 'Enter your email address'
    else if (!isValidEmail(values.email)) next.email = 'Enter a valid email address'
    if (!values.password) next.password = 'Enter your password'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!validate()) return

    setLoading(true)

    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/auth/login',
        {
          email: values.email.trim(),
          password: values.password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      // console.log('LOGIN SUCCESS:', data)
        localStorage.setItem('token', data.token)
        setUser(data.user)
    

      // Redirect into app
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Unable to sign in. Please try again.'

      setFormError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      headline="Every conversation, actually in sync."
      tagline="LinkChat keeps your messages, calls and files in one calm place — synced instantly across every device you use."
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-cyan-400 transition-colors hover:text-cyan-300 focus:outline-none focus-visible:underline"
          >
            Create one
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
          id="email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          borderless
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />

        <PasswordField
          id="password"
          label="Password"
          placeholder="Enter your password"
          borderless
          autoComplete="current-password"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
        />

        <div className="flex items-center justify-between">
          <Checkbox id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)}>
            Remember me
          </Checkbox>
          <Link
            to="/forgot-password"
            className="text-[13.5px] font-medium text-base-300 transition-colors hover:text-accent-cyan focus:outline-none focus-visible:underline"
          >
            Forgot password?
          </Link>
        </div>

        <PrimaryButton type="submit" loading={loading && 'Signing in…'} className="mt-1">
          Sign in
        </PrimaryButton>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-base-700/60" />
        <span className="text-[12.5px] text-base-400">or continue with</span>
        <span className="h-px flex-1 bg-base-700/60" />
      </div>

      <SocialButtons onSelect={(p) => alert(`Continue with ${p} (demo)`)} />
    </AuthLayout>
  )
}