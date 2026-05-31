'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database, Trash2, RefreshCw, AlertTriangle, CheckCircle, Loader2, BarChart3, Calendar, MapPin, Tag, Shield } from 'lucide-react'
import { MONTH_NAMES, formatCurrency } from '@/lib/utils'

interface DbStats {
  total: number
  byMonth: { month: number; count: number; stock: number }[]
  byLoc: { loc: string; count: number }[]
  byCategory: { category: string; count: number }[]
  lastImport: string | null
}

export default function DatabasePage() {
  const supabase = createClient()
  const [stats, setStats] = useState<DbStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [myRole, setMyRole] = useState('')
  const [toast, setToast] = useState({ msg: '', type: '' })
  const [delMonth, setDelMonth] = useState('')
  const [delLoc, setDelLoc] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showNukeConfirm, setShowNukeConfirm] = useState(false)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: '' }), 4000)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => { setMyRole(data?.role || ''); loadStats() })
    })
  }, [])

  const loadStats = async () => {
    setLoading(true)
    const { data: all } = await supabase.from('inventory_data').select('month, loc, category, current_stock, created_at')

    if (!all) { setLoading(false); return }

    const byMonth = Object.entries(
      all.reduce((acc: any, r) => {
        const k = r.month
        if (!acc[k]) acc[k] = { month: k, count: 0, stock: 0 }
        acc[k].count++; acc[k].stock += r.current_stock
        return acc
      }, {})
    ).map(([_, v]) => v as any).sort((a: any, b: any) => a.month - b.month)

    const byLoc = Object.entries(
      all.reduce((acc: any, r) => { acc[r.loc] = (acc[r.loc] || 0) + 1; return acc }, {})
    ).map(([loc, count]) => ({ loc, count: count as number })).sort((a, b) => b.count - a.count)

    const byCategory = Object.entries(
      all.reduce((acc: any, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc }, {})
    ).map(([category, count]) => ({ category, count: count as number })).sort((a, b) => b.count - a.count)

    const lastImport = all.length ? all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null

    setStats({ total: all.length, byMonth, byLoc, byCategory, lastImport })
    setLoading(false)
  }

  const deleteByMonth = async () => {
    if (!delMonth) { showToast('Select a month first', 'error'); return }
    if (!confirm(`Delete ALL records for ${MONTH_NAMES[parseInt(delMonth)-1]}? This cannot be undone.`)) return
    setDeleting(true)
    const { error, count } = await supabase.from('inventory_data').delete({ count: 'exact' }).eq('month', parseInt(delMonth))
    if (!error) { showToast(`Deleted ${count} records for ${MONTH_NAMES[parseInt(delMonth)-1]} ✓`); setDelMonth(''); loadStats() }
    else showToast('Error: ' + error.message, 'error')
    setDeleting(false)
  }

  const deleteByLoc = async () => {
    if (!delLoc) { showToast('Select a LOC first', 'error'); return }
    if (!confirm(`Delete ALL records for LOC "${delLoc}"? This cannot be undone.`)) return
    setDeleting(true)
    const { error, count } = await supabase.from('inventory_data').delete({ count: 'exact' }).eq('loc', delLoc)
    if (!error) { showToast(`Deleted ${count} records for ${delLoc} ✓`); setDelLoc(''); loadStats() }
    else showToast('Error: ' + error.message, 'error')
    setDeleting(false)
  }

  const nukeAll = async () => {
    if (confirmText !== 'DELETE ALL') { showToast('Type DELETE ALL to confirm', 'error'); return }
    setDeleting(true)
    const { error } = await supabase.from('inventory_data').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (!error) { showToast('All records deleted ✓'); setShowNukeConfirm(false); setConfirmText(''); loadStats() }
    else showToast('Error: ' + error.message, 'error')
    setDeleting(false)
  }

  if (myRole !== 'admin' && !loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Access Required</h3>
          <p className="text-gray-500 text-sm mt-1">Database tools are restricted to administrators.</p>
        </div>
      </div>
    )
  }

  const allLocs = stats?.byLoc.map(l => l.loc) || []

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-fade-in">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
          {toast.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} className="text-green-400" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database size={22} style={{ color: '#0B2E6D' }} /> Database Tools
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">View stats, manage and clean up inventory data</p>
        </div>
        <button onClick={loadStats} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Stats
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-400" /></div>
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={BarChart3} label="Total Records" value={stats?.total?.toLocaleString() || '0'} color="#0B2E6D" bg="#EFF6FF" />
            <StatCard icon={Calendar} label="Months with Data" value={String(stats?.byMonth.length || 0)} color="#10B981" bg="#ECFDF5" />
            <StatCard icon={MapPin} label="Locations" value={String(stats?.byLoc.length || 0)} color="#0EA5E9" bg="#E0F2FE" />
            <StatCard icon={Tag} label="Categories" value={String(stats?.byCategory.length || 0)} color="#7C3AED" bg="#EDE9FE" />
          </div>

          {stats?.lastImport && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-green-500" />
              Last import: {new Date(stats.lastImport).toLocaleString()}
            </p>
          )}

          {/* By Month breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar size={14} /> Records by Month
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {stats?.byMonth.map(m => {
                  const pct = stats.total > 0 ? (m.count / stats.total) * 100 : 0
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">{MONTH_NAMES[m.month-1].slice(0,3)}</span>
                      <div className="flex-1 h-5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%`, background: '#0B2E6D' }}>
                          <span className="text-xs text-white font-medium">{m.count}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-20 text-right">{formatCurrency(m.stock)}</span>
                    </div>
                  )
                })}
                {stats?.byMonth.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data yet</p>}
              </div>
            </div>
          </div>

          {/* By LOC & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><MapPin size={14} /> By Location</h3>
              </div>
              <div className="p-3 space-y-1.5">
                {stats?.byLoc.map(l => (
                  <div key={l.loc} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{l.loc}</span>
                    <span className="text-xs text-gray-500">{l.count} records</span>
                  </div>
                ))}
                {stats?.byLoc.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No data</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Tag size={14} /> By Category</h3>
              </div>
              <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                {stats?.byCategory.map(c => (
                  <div key={c.category} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{c.category}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{c.count}</span>
                  </div>
                ))}
                {stats?.byCategory.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No data</p>}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle size={15} /> Danger Zone — Data Deletion
            </h3>
            <div className="space-y-4">
              {/* Delete by month */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-red-100 dark:border-red-900 p-4">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Delete all records for a specific month</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={delMonth} onChange={e => setDelMonth(e.target.value)}
                    className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 focus:outline-none">
                    <option value="">Select month...</option>
                    {stats?.byMonth.map(m => (
                      <option key={m.month} value={m.month}>{MONTH_NAMES[m.month-1]} ({m.count} records)</option>
                    ))}
                  </select>
                  <button onClick={deleteByMonth} disabled={!delMonth || deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-50">
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete Month
                  </button>
                </div>
              </div>

              {/* Delete by LOC */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-red-100 dark:border-red-900 p-4">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Delete all records for a specific location</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={delLoc} onChange={e => setDelLoc(e.target.value)}
                    className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 focus:outline-none">
                    <option value="">Select LOC...</option>
                    {allLocs.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button onClick={deleteByLoc} disabled={!delLoc || deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-50">
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete LOC
                  </button>
                </div>
              </div>

              {/* Nuke all */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-red-200 dark:border-red-800 p-4">
                <p className="text-xs font-bold text-red-600 mb-1">⚠ Delete ALL inventory data</p>
                <p className="text-xs text-gray-500 mb-3">This permanently removes every record. Cannot be undone.</p>
                {!showNukeConfirm ? (
                  <button onClick={() => setShowNukeConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition">
                    <Trash2 size={12} /> Wipe All Data
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 font-medium">Type <strong>DELETE ALL</strong> to confirm:</p>
                    <div className="flex items-center gap-2">
                      <input value={confirmText} onChange={e => setConfirmText(e.target.value)}
                        placeholder="DELETE ALL" className="text-xs border border-red-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400 w-32" />
                      <button onClick={nukeAll} disabled={confirmText !== 'DELETE ALL' || deleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-40">
                        {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Confirm Delete
                      </button>
                      <button onClick={() => { setShowNukeConfirm(false); setConfirmText('') }}
                        className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
        <Icon size={17} style={{ color }} />
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
