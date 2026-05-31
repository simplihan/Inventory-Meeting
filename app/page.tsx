'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, BarChart3, Loader2, Lock, Mail, TrendingUp, Package, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'

const STATS = [
  { label: 'Stock Value', value: '2.4M', change: '+12%', color: '#10B981' },
  { label: 'Non-Moving', value: '340K', change: '-8%', color: '#7C3AED' },
  { label: 'Excess Stock', value: '180K', change: '-3%', color: '#0EA5E9' },
  { label: 'Aging 9+M', value: '57K', change: '-15%', color: '#EF4444' },
]

const FEATURES = [
  { icon: TrendingUp, text: 'Real-time KPI tracking' },
  { icon: Package, text: 'Excel import & manual entry' },
  { icon: AlertTriangle, text: 'Aging & excess alerts' },
  { icon: CheckCircle, text: 'Role-based access control' },
]

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
  const [mounted, setMounted] = useState(false)
  const [activeCard, setActiveCard] = useState(0)

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => setActiveCard(c => (c + 1) % STATS.length), 2000)
    return () => clearInterval(t)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setResetSent(true); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d1f 0%, #0B2E6D 50%, #0e3a8a 100%)' }}>

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-16 relative overflow-hidden">

        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)', top: '-10%', left: '-10%',
              animation: 'float1 8s ease-in-out infinite' }} />
          <div className="absolute w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)', bottom: '10%', right: '5%',
              animation: 'float2 10s ease-in-out infinite' }} />
          <div className="absolute w-48 h-48 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)', top: '40%', right: '20%',
              animation: 'float3 7s ease-in-out infinite' }} />
        </div>

        <style>{`
          @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
          @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,15px)} }
          @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(10px,20px)} }
          @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
          @keyframes pulse2  { 0%,100%{opacity:1} 50%{opacity:0.6} }
          .slide-up { animation: slideUp 0.6s ease forwards; }
          .fade-in  { animation: fadeIn 0.4s ease forwards; }
          .stat-card-active { transform: scale(1.03); box-shadow: 0 0 30px rgba(96,165,250,0.2); }
        `}</style>

        <div className={`relative z-10 ${mounted ? 'slide-up' : 'opacity-0'}`}>
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Monthly Meeting</h1>
              <p className="text-blue-300 text-sm">Inventory Dashboard</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
            Your inventory,<br />
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              always in view.
            </span>
          </h2>
          <p className="text-blue-200 text-base mb-10 leading-relaxed">
            Track stock, aging, and excess in real-time. Built for monthly review meetings.
          </p>

          {/* Live KPI cards */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {STATS.map((s, i) => (
              <div key={s.label}
                className={`rounded-xl p-4 transition-all duration-500 cursor-default ${activeCard === i ? 'stat-card-active' : ''}`}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${activeCard === i ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, backdropFilter: 'blur(10px)' }}>
                <p className="text-blue-300 text-xs mb-2">{s.label}</p>
                <p className="text-white text-xl font-bold">{s.value}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: s.color }}>{s.change} MoM</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={text} className="flex items-center gap-3"
                style={{ opacity: mounted ? 1 : 0, animation: `slideUp 0.5s ease ${0.1 * i + 0.3}s forwards` }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.2)' }}>
                  <Icon size={13} className="text-blue-300" />
                </div>
                <span className="text-blue-200 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        {/* Glass panel background */}
        <div className="absolute inset-0 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }} />

        <div className={`relative w-full max-w-[420px] ${mounted ? 'fade-in' : 'opacity-0'}`}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)' }}>

            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0B2E6D, #3b82f6, #0ea5e9)' }} />

            <div className="p-8">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0B2E6D' }}>
                  <BarChart3 size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Monthly Meeting</p>
                  <p className="text-xs text-gray-500">Inventory Dashboard</p>
                </div>
              </div>

              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {forgotMode ? 'Reset password' : 'Welcome back'}
                </h2>
                <p className="text-sm text-gray-500">
                  {forgotMode ? 'We\'ll send a reset link to your email' : 'Sign in to your dashboard'}
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3 text-sm"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
              {resetSent && (
                <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3 text-sm"
                  style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-green-700">Reset link sent! Check your inbox.</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Email Address</label>
                  <div className="relative group">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-blue-500" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl transition-all outline-none"
                      style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>
                </div>

                {/* Password */}
                {!forgotMode && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Password</label>
                    <div className="relative group">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-blue-500" />
                      <input type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} required placeholder="Enter your password"
                        className="w-full pl-10 pr-11 py-3 text-sm rounded-xl transition-all outline-none"
                        style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                        onFocus={e => e.target.style.borderColor = '#3b82f6'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember / Forgot */}
                {!forgotMode && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="sr-only" />
                        <div className="w-4.5 h-4.5 w-5 h-5 rounded border-2 flex items-center justify-center transition"
                          style={{ borderColor: rememberMe ? '#0B2E6D' : '#CBD5E1', background: rememberMe ? '#0B2E6D' : 'white' }}
                          onClick={() => setRememberMe(!rememberMe)}>
                          {rememberMe && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 select-none">Remember me</span>
                    </label>
                    <button type="button" onClick={() => { setForgotMode(true); setError('') }}
                      className="text-sm font-semibold transition hover:opacity-70" style={{ color: '#0B2E6D' }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full py-3 px-4 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #0B2E6D, #1d4ed8)' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #1d4ed8, #0B2E6D)' }} />
                    <span className="relative flex items-center gap-2">
                      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                      {loading ? 'Signing in...' : forgotMode ? 'Send Reset Link' : 'Sign In'}
                      {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                    </span>
                  </button>
                </div>
              </form>

              {forgotMode && (
                <button onClick={() => { setForgotMode(false); setError(''); setResetSent(false) }}
                  className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 text-center transition flex items-center justify-center gap-1">
                  ← Back to sign in
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between"
              style={{ background: '#F8FAFC' }}>
              <span className="text-xs text-gray-400">Monthly Meeting Dashboard</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'pulse2 2s infinite' }} />
                <span className="text-xs text-gray-400">Secure login</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
