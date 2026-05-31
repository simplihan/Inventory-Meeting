'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Users, Loader2, CheckCircle, AlertCircle, Trash2, Edit2 } from 'lucide-react'

export default function AdminPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [myRole, setMyRole] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setMyRole(me?.role || '')
      if (me?.role === 'admin') {
        const { data } = await supabase.from('profiles').select('*').order('created_at')
        setProfiles(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const updateRole = async (id: string, role: string) => {
    setSaving(id)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (!error) {
      setProfiles(p => p.map(x => x.id === id ? { ...x, role } : x))
      setMsg('Role updated successfully')
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(null)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-500" /></div>

  if (myRole !== 'admin') {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Access Required</h3>
          <p className="text-gray-500 text-sm mt-1">This page is restricted to administrators.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield size={22} style={{ color: '#0B2E6D' }} /> Admin Panel
        </h2>
        <p className="text-sm text-gray-500 mt-1">Manage user roles and access</p>
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle size={15} /> {msg}
        </div>
      )}

      {/* Role guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { role: 'Admin', desc: 'Full access — manage users, import, delete data', color: '#0B2E6D', bg: '#EFF6FF' },
          { role: 'Manager', desc: 'Can add & import data, view everything', color: '#10B981', bg: '#ECFDF5' },
          { role: 'Viewer', desc: 'Read-only access to dashboard and reports', color: '#6B7280', bg: '#F9FAFB' },
        ].map(r => (
          <div key={r.role} className="rounded-xl p-3 border border-gray-100 dark:border-slate-700" style={{ background: r.bg }}>
            <p className="text-sm font-bold mb-1" style={{ color: r.color }}>{r.role}</p>
            <p className="text-xs text-gray-600">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
          <Users size={15} style={{ color: '#0B2E6D' }} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Users ({profiles.length})</h3>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {profiles.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#0B2E6D' }}>
                {(p.full_name || p.email || 'U').slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.full_name || 'Unnamed'}</p>
                <p className="text-xs text-gray-500 truncate">{p.email}</p>
              </div>
              <select value={p.role} onChange={e => updateRole(p.id, e.target.value)} disabled={saving === p.id}
                className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-slate-800 focus:outline-none disabled:opacity-50">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
              {saving === p.id && <Loader2 size={14} className="animate-spin text-blue-500" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
