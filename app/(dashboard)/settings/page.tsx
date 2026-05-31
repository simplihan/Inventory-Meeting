'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Settings, Save, Loader2, CheckCircle, User, Palette, Bell,
  Shield, ChevronRight, Camera, Mail, Hash, Globe, Moon, Sun,
  Lock, LogOut, Trash2, Eye, EyeOff, X
} from 'lucide-react'

const TABS = [
  { id: 'profile',   label: 'Profile',      icon: User },
  { id: 'security',  label: 'Security',     icon: Shield },
  { id: 'app',       label: 'App Info',     icon: Globe },
]

const ROLE_META: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  admin:   { label: 'Admin',   color: '#0B2E6D', bg: '#EFF6FF', desc: 'Full access to all features' },
  manager: { label: 'Manager', color: '#10B981', bg: '#ECFDF5', desc: 'Can add and import data' },
  viewer:  { label: 'Viewer',  color: '#6B7280', bg: '#F9FAFB', desc: 'Read-only access' },
}

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => {
            if (data) { setProfile(data); setName(data.full_name || '') }
            setLoading(false)
          })
      }
    })
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)
      if (!error) { setProfile((p: any) => ({ ...p, full_name: name })); showToast('Profile updated successfully') }
      else showToast(error.message, 'error')
    }
    setSaving(false)
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return }
    if (newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) { showToast('Password changed successfully'); setNewPassword(''); setConfirmPassword('') }
    else showToast(error.message, 'error')
    setChangingPw(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.email || 'U').slice(0, 2).toUpperCase()

  const roleMeta = ROLE_META[profile?.role] || ROLE_META.viewer

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin" style={{ color: '#0B2E6D' }} />
        <p className="text-sm text-gray-500">Loading settings...</p>
      </div>
    </div>
  )

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all"
  const inputStyle = { background: '#F8FAFC', border: '1.5px solid #E2E8F0' }

  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ background: 'var(--background)' }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all`}
          style={{ background: toast.type === 'success' ? '#0B2E6D' : '#EF4444', color: 'white',
            animation: 'slideUp 0.3s ease' }}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <X size={15} />}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0B2E6D' }}>
              <Settings size={17} className="text-white" />
            </div>
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-11">Manage your profile and account preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── SIDEBAR ── */}
          <div className="w-full lg:w-56 flex-shrink-0">
            {/* Avatar card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 mb-4 text-center">
              <div className="relative inline-block mb-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white mx-auto"
                  style={{ background: 'linear-gradient(135deg, #0B2E6D, #3b82f6)' }}>
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: roleMeta.color }}>
                  <span className="text-white" style={{ fontSize: '8px' }}>✓</span>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.full_name || 'Your Name'}</p>
              <p className="text-xs text-gray-500 truncate mb-3">{profile?.email}</p>
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: roleMeta.bg, color: roleMeta.color }}>
                {roleMeta.label}
              </span>
            </div>

            {/* Nav tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left ${activeTab === id ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                  style={activeTab === id ? { background: '#0B2E6D' } : {}}>
                  <Icon size={15} />
                  <span className="flex-1">{label}</span>
                  {activeTab !== id && <ChevronRight size={13} className="text-gray-300" />}
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-slate-700">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left">
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0">

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <User size={15} style={{ color: '#0B2E6D' }} /> Profile Information
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Update your personal details</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                      className={inputCls} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                      onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={profile?.email || ''} disabled
                        className={`${inputCls} pl-9 opacity-60 cursor-not-allowed`} style={inputStyle} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Role</label>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: roleMeta.bg, border: `1.5px solid ${roleMeta.color}20` }}>
                      <Shield size={15} style={{ color: roleMeta.color }} />
                      <div>
                        <p className="text-sm font-bold" style={{ color: roleMeta.color }}>{roleMeta.label}</p>
                        <p className="text-xs text-gray-500">{roleMeta.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-end" style={{ background: '#FAFAFA' }}>
                  <button onClick={saveProfile} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #0B2E6D, #1d4ed8)' }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Lock size={15} style={{ color: '#0B2E6D' }} /> Change Password
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Choose a strong password</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">New Password</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} value={newPassword}
                          onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters"
                          className={`${inputCls} pr-10`} style={inputStyle}
                          onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                          onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Confirm Password</label>
                      <input type={showPw ? 'text' : 'password'} value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password"
                        className={inputCls} style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                        onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
                    </div>
                    {/* Strength indicator */}
                    {newPassword && (
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all"
                              style={{ background: newPassword.length >= i * 3 ? (newPassword.length >= 12 ? '#10B981' : newPassword.length >= 8 ? '#F59E0B' : '#EF4444') : '#E5E7EB' }} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          {newPassword.length < 6 ? 'Too short' : newPassword.length < 8 ? 'Weak' : newPassword.length < 12 ? 'Good' : 'Strong'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-end" style={{ background: '#FAFAFA' }}>
                    <button onClick={changePassword} disabled={changingPw || !newPassword}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #0B2E6D, #1d4ed8)' }}>
                      {changingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                      {changingPw ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>

                {/* Sign out all devices */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Sign out everywhere</p>
                      <p className="text-xs text-gray-500 mt-0.5">Sign out from all devices and sessions</p>
                    </div>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 rounded-xl border border-red-200 hover:bg-red-50 transition flex-shrink-0">
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── APP TAB ── */}
            {activeTab === 'app' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe size={15} style={{ color: '#0B2E6D' }} /> Application Info
                  </h2>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                  {[
                    { label: 'Application', value: 'Monthly Meeting Dashboard' },
                    { label: 'Version', value: '1.0.0' },
                    { label: 'Supabase Project', value: 'ntuswtobbykwliabzqil' },
                    { label: 'Region', value: 'ap-south-1 (Mumbai)' },
                    { label: 'Framework', value: 'Next.js 16 + React 19' },
                    { label: 'Database', value: 'PostgreSQL (Supabase)' },
                    { label: 'Hosting', value: 'Vercel' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                      <span className="text-xs font-medium text-gray-500">{label}</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white text-right ml-4">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700" style={{ background: '#FAFAFA' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulse 2s infinite' }} />
                    <span className="text-xs text-gray-500">All systems operational</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
