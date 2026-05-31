'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Save, Loader2, CheckCircle, User, Bell, Palette } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => { if (data) { setProfile(data); setName(data.full_name || '') } })
          .finally(() => setLoading(false))
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-500" /></div>

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings size={22} style={{ color: '#0B2E6D' }} /> Settings
        </h2>
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle size={15} /> Settings saved successfully
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
            <User size={15} /> Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
              <input value={profile?.email || ''} disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Role</label>
              <div className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 capitalize text-gray-600 dark:text-gray-400">{profile?.role}</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
            <Palette size={15} /> Dashboard Info
          </h3>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between"><span>App Name</span><span className="font-medium text-gray-700 dark:text-gray-300">Monthly Meeting Dashboard</span></div>
            <div className="flex justify-between"><span>Supabase Region</span><span className="font-medium text-gray-700 dark:text-gray-300">ap-south-1</span></div>
            <div className="flex justify-between"><span>Version</span><span className="font-medium text-gray-700 dark:text-gray-300">1.0.0</span></div>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-60 transition"
          style={{ background: '#0B2E6D' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
