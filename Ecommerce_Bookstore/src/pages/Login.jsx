import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { maskEmail } from '../config/api'
import OtpInput from '../components/OtpInput'
import LccbLogo from '../assets/LCCB-Logo.jpeg'
import toast from 'react-hot-toast'

function safeInternalPath(value) {
  if (typeof value !== 'string' || value.length === 0) return '/'
  if (!value.startsWith('/')) return '/'
  if (/^\/[/\\]/.test(value)) return '/'
  return value
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otpPending, setOtpPending] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [fallbackOtp, setFallbackOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const { login, verifyOtpLogin, resendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = safeInternalPath(location.state?.from)

  useEffect(() => {
    const pendingOtp = JSON.parse(localStorage.getItem('pendingLoginOtp') || 'null')
    if (!pendingOtp || Date.now() - pendingOtp.createdAt >= 5 * 60 * 1000) {
      localStorage.removeItem('pendingLoginOtp')
      return
    }

    setOtpEmail(pendingOtp.email)
    setOtpPending(true)
    setResendCooldown(Math.max(0, 60 - Math.floor((Date.now() - pendingOtp.createdAt) / 1000)))
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (result.requiresOtp) {
        setOtpEmail(result.email)
        setFallbackOtp(result.otp || '')
        setOtpPending(true)
        setResendCooldown(60)
        localStorage.setItem('pendingLoginOtp', JSON.stringify({
          email: result.email,
          createdAt: Date.now(),
        }))
        toast(result.otp ? 'Email delivery failed. Use the development OTP shown below.' : 'OTP sent to your email', {
          icon: result.otp ? '⚠️' : '✉️',
        })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpComplete = async (otp) => {
    setOtpLoading(true)
    try {
      await verifyOtpLogin(otpEmail, otp)
      localStorage.removeItem('pendingLoginOtp')
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const result = await resendOtp(otpEmail)
      setFallbackOtp(result.otp || '')
      setResendCooldown(60)
      localStorage.setItem('pendingLoginOtp', JSON.stringify({
        email: otpEmail,
        createdAt: Date.now(),
      }))
      toast(result.otp ? 'Email delivery failed. Use the development OTP shown below.' : 'New OTP sent to your email', {
        icon: result.otp ? '⚠️' : '✉️',
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    }
  }

  const handleBackToLogin = () => {
    setOtpPending(false)
    setOtpEmail('')
    setFallbackOtp('')
    localStorage.removeItem('pendingLoginOtp')
    setForm({ email: form.email, password: '' })
  }

  return (
    <div className="page-container animate-fade-in bg-gradient-to-b from-slate-50 via-primary-50/30 to-slate-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-7 sm:p-8">
          {!otpPending ? (
            <>
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-4 shadow-sm ring-2 ring-primary-100">
                  <img src={LccbLogo} alt="LCCB Bookstore" className="w-full h-full object-cover scale-125" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
                <p className="text-slate-500 text-sm mt-1">Sign in to your LCCB Bookstore account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="input-field pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Verify Your Email</h1>
                <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code sent to</p>
                <p className="text-primary-600 font-semibold text-sm mt-0.5">{maskEmail(otpEmail)}</p>
              </div>

              {otpLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-100 border-t-primary-600" />
                </div>
              ) : (
                <OtpInput
                  length={6}
                  onComplete={handleOtpComplete}
                  onResend={handleResend}
                  resendTimer={resendCooldown}
                />
              )}

              {fallbackOtp && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-amber-800">Development OTP fallback</p>
                  <p className="mt-1 text-xl font-bold tracking-[0.35em] text-amber-900">{fallbackOtp}</p>
                  <p className="mt-1 text-xs text-amber-700">Configure working SMTP credentials to send codes by email.</p>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
