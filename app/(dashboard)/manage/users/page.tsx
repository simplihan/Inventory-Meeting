'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users2, Shield, Edit2, Save, X, Loader2, Trash2, Plus, Mail, Copy, CheckCircle } from 'lucide-react'

const ROLES = ['admin','manager','viewer'] as const
const ROLE_META = {
  admin:   { label: 'Admin',   color: '#0B2E6D', bg: '#EFF6FF', desc: 'Full access — manage users, edit & delete all data' },
  manager: { label: 'Manager', color: '#10B981', bg: '#ECFDF5', desc: 'Add & import data, view everything, no user management' },
  viewer:  { label: 'Viewer',  color: '#6B7280', bg: '#F9FAFB', desc: 'Read-only access to dashboard, charts and reports' },
}

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState('')
  const [myRole, setMyRole] = useState('')
  const [editId, setEditId] = useState<string|null>(null)
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviting, setInviting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setMyId(user.id)
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => {
          setMyRole(data?.role || '')
          if (data?.role === 'admin') loadUsers()
          else setLoading(false)
        })
    })
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setUsers(data || [])
    setLoading(false)
  }

  const saveRole = async () => {
    if (!editId) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ role: editRole }).eq('id', editId)
    if (!error) { showToast('Role updated ✓'); loadUsers(); setEditId(null) }
    else showToast('Error: ' + error.message)
    setSaving(false)
  }

  const deleteUser = async (id: string, name: string) => {
    if (id === myId) { showToast("You can't delete your own account"); return }
    if (!confirm(`Delete user "${name}"? This will remove all their access.`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) { showToast('User removed ✓'); loadUsers() }
    else showToast('Error: ' + error.message)
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/login`)
    showToast('Login link copied ✓')
  }

  const initials = (u: any) => (u.full_name || u.email || 'U').slice(0, 2).toUpperCase()
  const avatarBg = (role: string) => role === 'admin' ? '#0B2E6D' : role === 'manager' ? '#10B981' : '#6B7280'

  if (myRole !== 'admin' && !loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Access Required</h3>
          <p className="text-gray-500 text-sm mt-1">Only administrators can manage users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <CheckCircle size={14} className="text-green-400" /> {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users2 size={22} style={{ color: '#0B2E6D' }} /> User Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage roles and access for all users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyInviteLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition">
            <Copy size={13} /> Copy Login Link
          </button>
          <button onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition"
            style={{ background: '#0B2E6D' }}>
            <Plus size={13} /> Add User
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {ROLES.map(role => {
          const meta = ROLE_META[role]
          const count = users.filter(u => u.role === role).length
          return (
            <div key={role} className="rounded-xl p-3 border border-gray-100 dark:border-slate-700 flex items-start gap-3" style={{ background: meta.bg }}>
              <Shield size={16} style={{ color: meta.color, marginTop: 2 }} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: meta.color }}>{count}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Invite new user info */}
      {showInvite && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Plus size={14} /> Add New User
          </h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
            New users need to sign up themselves at your login page. Share this link with them:
          </p>
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700 mb-3">
            <code className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/login</code>
            <button onClick={copyInviteLink} className="text-blue-500 hover:text-blue-700 flex-shrink-0">
              <Copy size={13} />
            </button>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            After they sign up, they appear in this list as <strong>Viewer</strong> by default. You can then change their role below.
          </p>
          <button onClick={() => setShowInvite(false)} className="mt-3 text-xs text-gray-500 hover:text-gray-700">
            ✕ Close
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users2 size={14} /> All Users
            <span className="text-xs font-normal text-gray-500">({users.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {users.map(user => {
              const isMe = user.id === myId
              const isEditing = editId === user.id
              const meta = ROLE_META[user.role as keyof typeof ROLE_META] || ROLE_META.viewer

              return (
                <div key={user.id} className={`flex items-center gap-3 px-4 py-3 transition ${isEditing ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/30'}`}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: avatarBg(user.role) }}>
                    {initials(user)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user.full_name || 'Unnamed User'}
                      </span>
                      {isMe && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#EFF6FF', color: '#0B2E6D' }}>You</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <Mail size={10} /> {user.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <select value={editRole} onChange={e => setEditRole(e.target.value)}
                        className="text-xs border border-blue-300 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400">
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    )}

                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <button onClick={saveRole} disabled={saving}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50">
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {!isMe && (
                          <button onClick={() => { setEditId(user.id); setEditRole(user.role) }}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit role">
                            <Edit2 size={14} />
                          </button>
                        )}
                        {!isMe && (
                          <button onClick={() => deleteUser(user.id, user.full_name || user.email)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove user">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {users.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">No users found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
