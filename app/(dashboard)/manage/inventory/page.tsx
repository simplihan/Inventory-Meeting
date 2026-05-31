'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Plus, Trash2, Edit2, Save, X, Loader2, Download,
  Filter, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle,
  CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown, Copy
} from 'lucide-react'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'
import * as XLSX from 'xlsx'

type Row = Record<string, any>

const COLS = [
  { key: 'month',          label: 'Month',       type: 'month',   width: 'w-20' },
  { key: 'loc',            label: 'LOC',         type: 'text',    width: 'w-20' },
  { key: 'bd_loc',         label: 'BD LOC',      type: 'text',    width: 'w-20' },
  { key: 'category',       label: 'Category',    type: 'text',    width: 'w-40' },
  { key: 'sku_type',       label: 'SKU Type',    type: 'sku',     width: 'w-28' },
  { key: 'previous_stock', label: 'Last M Stock',type: 'number',  width: 'w-28' },
  { key: 'current_stock',  label: 'Curr Stock',  type: 'number',  width: 'w-28' },
  { key: 'previous_nm',    label: 'Last M NM',   type: 'number',  width: 'w-24' },
  { key: 'current_nm',     label: 'Curr NM',     type: 'number',  width: 'w-24' },
  { key: 'target_nm',      label: 'Target NM',   type: 'number',  width: 'w-24' },
  { key: 'previous_excess',label: 'Last M Exc',  type: 'number',  width: 'w-24' },
  { key: 'current_excess', label: 'Curr Excess', type: 'number',  width: 'w-24' },
  { key: 'target_excess',  label: 'Target Exc',  type: 'number',  width: 'w-24' },
  { key: 'aging_3_9',      label: 'Aging 3-9',   type: 'number',  width: 'w-24' },
  { key: 'aging_9_plus',   label: 'Aging 9+',    type: 'number',  width: 'w-24' },
  { key: 'target_aging',   label: 'Tgt Aging',   type: 'number',  width: 'w-24' },
]

const empty = () => ({
  month: new Date().getMonth() + 1, loc: '', bd_loc: '', category: '', sku_type: 'LOCAL',
  previous_stock: 0, current_stock: 0, previous_nm: 0, current_nm: 0, target_nm: 0,
  previous_excess: 0, current_excess: 0, target_excess: 0,
  aging_3_9: 0, aging_9_plus: 0, target_aging: 0,
  company_id: null, business_unit_id: null,
})

export default function InventoryManagePage() {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Row>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterLoc, setFilterLoc] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [showAdd, setShowAdd] = useState(false)
  const [newRow, setNewRow] = useState<Row>(empty())
  const [toast, setToast] = useState('')
  const [userRole, setUserRole] = useState('viewer')
  const [userId, setUserId] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => { if (data) setUserRole(data.role) })
      }
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('inventory_data').select('*').order(sortKey, { ascending: sortDir === 'asc' })
    if (filterMonth) q = q.eq('month', parseInt(filterMonth))
    if (filterLoc) q = q.ilike('loc', `%${filterLoc}%`)
    const { data } = await q
    setRows(data || [])
    setLoading(false)
    setPage(1)
  }, [sortKey, sortDir, filterMonth, filterLoc])

  useEffect(() => { load() }, [load])

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('inv_mgmt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_data' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter(r => Object.values(r).some(v => String(v || '').toLowerCase().includes(q)))
  }, [rows, search])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const pages = Math.ceil(filtered.length / pageSize)

  // Sort toggle
  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // Selection
  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set())
    else setSelected(new Set(paged.map(r => r.id)))
  }

  // Edit
  const startEdit = (row: Row) => { setEditId(row.id); setEditData({ ...row }) }
  const cancelEdit = () => { setEditId(null); setEditData({}) }
  const saveEdit = async () => {
    if (!editId) return
    setSaving(editId)
    const { id, created_at, updated_at, ...updates } = editData
    const { error } = await supabase.from('inventory_data').update(updates).eq('id', editId)
    if (!error) { showToast('Record updated ✓'); cancelEdit(); load() }
    else showToast('Error: ' + error.message)
    setSaving(null)
  }

  // Add new
  const addRow = async () => {
    if (!newRow.loc || !newRow.category || !newRow.sku_type) {
      showToast('LOC, Category and SKU Type are required'); return
    }
    setSaving('new')
    const { error } = await supabase.from('inventory_data').insert({ ...newRow, created_by: userId })
    if (!error) { showToast('Record added ✓'); setShowAdd(false); setNewRow(empty()); load() }
    else showToast('Error: ' + error.message)
    setSaving(null)
  }

  // Duplicate row
  const duplicateRow = async (row: Row) => {
    const { id, created_at, updated_at, ...rest } = row
    const { error } = await supabase.from('inventory_data').insert({ ...rest, created_by: userId })
    if (!error) { showToast('Row duplicated ✓'); load() }
  }

  // Delete single
  const deleteRow = async (id: string) => {
    if (!confirm('Delete this record?')) return
    const { error } = await supabase.from('inventory_data').delete().eq('id', id)
    if (!error) { showToast('Deleted ✓'); load() }
  }

  // Bulk delete
  const bulkDelete = async () => {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} selected records? This cannot be undone.`)) return
    setDeleting(true)
    const { error } = await supabase.from('inventory_data').delete().in('id', [...selected])
    if (!error) { showToast(`${selected.size} records deleted ✓`); setSelected(new Set()); load() }
    else showToast('Delete failed: ' + error.message)
    setDeleting(false)
  }

  // Export
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(r => ({
      Month: MONTH_NAMES[r.month - 1], LOC: r.loc, 'BD LOC': r.bd_loc,
      Category: r.category, 'SKU Type': r.sku_type,
      'Last M Stock': r.previous_stock, 'Curr Stock': r.current_stock,
      'Last M NM': r.previous_nm, 'Curr NM': r.current_nm, 'Target NM': r.target_nm,
      'Last M Excess': r.previous_excess, 'Curr Excess': r.current_excess, 'Target Excess': r.target_excess,
      'Aging 3-9': r.aging_3_9, 'Aging 9+': r.aging_9_plus, 'Target Aging': r.target_aging,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
    XLSX.writeFile(wb, 'inventory_export.xlsx')
  }

  const canEdit = userRole === 'admin' || userRole === 'manager'
  const canDelete = userRole === 'admin'

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown size={11} className="text-gray-300 ml-1" />
    return sortDir === 'asc' ? <ArrowUp size={11} className="text-blue-400 ml-1" /> : <ArrowDown size={11} className="text-blue-400 ml-1" />
  }

  const cellInput = (key: string, val: any, onChange: (v: any) => void) => {
    const col = COLS.find(c => c.key === key)
    if (!col) return null
    if (col.type === 'month') return (
      <select value={val} onChange={e => onChange(parseInt(e.target.value))}
        className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
        {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
      </select>
    )
    if (col.type === 'sku') return (
      <select value={val} onChange={e => onChange(e.target.value)}
        className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
        <option>LOCAL</option><option>OVERSEAS</option>
      </select>
    )
    if (col.type === 'number') return (
      <input type="number" value={val} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-right" />
    )
    return (
      <input type="text" value={val} onChange={e => onChange(e.target.value)}
        className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
    )
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inventory Records</h2>
          <p className="text-sm text-gray-500 mt-0.5">View, edit, add and delete inventory data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={load} disabled={loading}
            className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 transition">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition">
            <Download size={13} /> Export
          </button>
          {canDelete && selected.size > 0 && (
            <button onClick={bulkDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg bg-red-500 hover:bg-red-600 transition disabled:opacity-60">
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete {selected.size}
            </button>
          )}
          {canEdit && (
            <button onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition"
              style={{ background: '#0B2E6D' }}>
              <Plus size={13} /> Add Row
            </button>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-36">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search all columns..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
          className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 focus:outline-none">
          <option value="">All Months</option>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <input value={filterLoc} onChange={e => { setFilterLoc(e.target.value); setPage(1) }}
          placeholder="Filter by LOC..."
          className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 focus:outline-none w-32" />
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length.toLocaleString()} records
          {selected.size > 0 && <span className="ml-2 font-semibold text-blue-600">{selected.size} selected</span>}
        </span>
      </div>

      {/* Add Row Form */}
      {showAdd && canEdit && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Plus size={14} /> Add New Record
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
            {[
              { key: 'month', label: 'Month' }, { key: 'loc', label: 'LOC *' },
              { key: 'bd_loc', label: 'BD LOC' }, { key: 'category', label: 'Category *' },
              { key: 'sku_type', label: 'SKU Type *' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                {cellInput(key, newRow[key], v => setNewRow(r => ({ ...r, [key]: v })))}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {COLS.filter(c => c.type === 'number').map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                {cellInput(key, newRow[key], v => setNewRow(r => ({ ...r, [key]: v })))}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addRow} disabled={saving === 'new'}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition disabled:opacity-60"
              style={{ background: '#0B2E6D' }}>
              {saving === 'new' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save Record
            </button>
            <button onClick={() => { setShowAdd(false); setNewRow(empty()) }}
              className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                {canDelete && (
                  <th className="px-2 py-3 w-8">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-blue-500">
                      {selected.size === paged.length && paged.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  </th>
                )}
                {COLS.map(col => (
                  <th key={col.key}
                    className={`px-2 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 ${col.width}`}
                    onClick={() => toggleSort(col.key)}>
                    <div className="flex items-center">
                      {col.label}<SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                {canEdit && <th className="px-2 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide w-20">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={COLS.length + 2} className="text-center py-12">
                  <Loader2 size={20} className="animate-spin text-blue-400 mx-auto" />
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={COLS.length + 2} className="text-center py-12 text-gray-400">No records found</td></tr>
              ) : paged.map(row => {
                const isEditing = editId === row.id
                const isSelected = selected.has(row.id)
                return (
                  <tr key={row.id}
                    className={`transition ${isEditing ? 'bg-blue-50 dark:bg-blue-900/10' : isSelected ? 'bg-blue-50/50 dark:bg-blue-900/5' : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/50'}`}>
                    {canDelete && (
                      <td className="px-2 py-2">
                        <button onClick={() => toggleSelect(row.id)} className="text-gray-400 hover:text-blue-500">
                          {isSelected ? <CheckSquare size={14} className="text-blue-500" /> : <Square size={14} />}
                        </button>
                      </td>
                    )}
                    {COLS.map(col => (
                      <td key={col.key} className={`px-2 py-1.5 ${col.width}`}>
                        {isEditing ? (
                          cellInput(col.key, editData[col.key], v => setEditData(d => ({ ...d, [col.key]: v })))
                        ) : (
                          <span className={
                            col.type === 'number' ? 'font-medium tabular-nums ' +
                              (col.key === 'current_stock' ? 'text-emerald-600' :
                               col.key === 'current_nm' || col.key === 'previous_nm' ? 'text-purple-600' :
                               col.key === 'current_excess' || col.key === 'previous_excess' ? 'text-sky-600' :
                               col.key === 'aging_3_9' ? 'text-amber-600' :
                               col.key === 'aging_9_plus' ? 'text-red-500' : 'text-gray-600')
                            : 'text-gray-700 dark:text-gray-300'
                          }>
                            {col.type === 'month' ? MONTH_NAMES[(row[col.key] || 1) - 1] :
                             col.type === 'number' ? formatCurrency(row[col.key] || 0) :
                             String(row[col.key] || '')}
                          </span>
                        )}
                      </td>
                    ))}
                    {canEdit && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button onClick={saveEdit} disabled={saving === row.id}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50">
                              {saving === row.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            </button>
                            <button onClick={cancelEdit} className="p-1 text-gray-400 hover:bg-gray-100 rounded transition">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEdit(row)}
                              className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => duplicateRow(row)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition" title="Duplicate">
                              <Copy size={13} />
                            </button>
                            {canDelete && (
                              <button onClick={() => deleteRow(row.id)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500">
            {((page-1)*pageSize)+1}–{Math.min(page*pageSize, filtered.length)} of {filtered.length.toLocaleString()} records
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 transition">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(7, pages) }, (_, i) => {
              const p = page <= 4 ? i+1 : page + i - 3
              if (p < 1 || p > pages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 text-xs rounded font-medium transition ${p===page ? 'text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400'}`}
                  style={p===page ? {background:'#0B2E6D'} : {}}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages || pages===0}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 transition">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
