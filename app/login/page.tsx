'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, BarChart3, Loader2, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setResetSent(true); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0B2E6D 0%, #1a4fa8 40%, #0ea5e9 100%)' }}>
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${200 + i * 100}px`, height: `${200 + i * 100}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <div className="relative z-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <BarChart3 size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Monthly Meeting</h1>
          <p className="text-xl text-blue-100 mb-8">Inventory Dashboard</p>
          <div className="space-y-4 text-left max-w-sm">
            {['Real-time inventory KPIs', 'Advanced analytics & charts', 'Excel import & manual entry', 'Role-based access control'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-blue-100">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-white">✓</span>
                </div>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0B2E6D' }}>
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Monthly Meeting</p>
                <p className="text-xs text-gray-500">Inventory Dashboard</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {forgotMode ? 'Reset Password' : 'Welcome back'}
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              {forgotMode ? 'Enter your email to receive reset instructions' : 'Sign in to your account'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}
            {resetSent && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                Password reset email sent! Check your inbox.
              </div>
            )}

            <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {!forgotMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {!forgotMode && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button type="button" onClick={() => { setForgotMode(true); setError('') }}
                    className="text-sm font-medium" style={{ color: '#0B2E6D' }}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#0B2E6D' }}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {forgotMode ? 'Send Reset Link' : 'Sign In'}
              </button>
            </form>

            {forgotMode && (
              <button onClick={() => { setForgotMode(false); setError(''); setResetSent(false) }}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 text-center">
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
