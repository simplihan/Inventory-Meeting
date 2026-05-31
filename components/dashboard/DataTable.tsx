'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { deleteInventoryRow } from '@/lib/inventory'
import type { InventoryData } from '@/types'
import * as XLSX from 'xlsx'

interface DataTableProps {
  data: InventoryData[]
  onRefresh: () => void
  userRole?: string
}

type SortKey = keyof InventoryData
type SortDir = 'asc' | 'desc'

const COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'bd_loc', label: 'BD LOC' },
  { key: 'loc', label: 'LOC' },
  { key: 'sku_type', label: 'SKU Type' },
  { key: 'current_stock', label: 'Stock', numeric: true },
  { key: 'current_nm', label: 'Non-Moving', numeric: true },
  { key: 'current_excess', label: 'Excess', numeric: true },
  { key: 'aging_3_9', label: 'Aging 3-9M', numeric: true },
  { key: 'aging_9_plus', label: 'Aging 9+M', numeric: true },
  { key: 'target_nm', label: 'Target NM', numeric: true },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

export default function DataTable({ data, onRefresh, userRole = 'viewer' }: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.filter(row =>
      !q || Object.values(row).some(v => String(v).toLowerCase().includes(q))
    )
  }, [data, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as any
      const bv = b[sortKey] as any
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const pages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  const exportCSV = () => {
    const csv = [COLUMNS.map(c => c.label).join(','),
      ...sorted.map(row => COLUMNS.map(c => row[c.key as keyof InventoryData]).join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'inventory_data.csv'; a.click()
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sorted.map(row => {
      const obj: Record<string, any> = {}
      COLUMNS.forEach(c => { obj[c.label] = row[c.key as keyof InventoryData] })
      return obj
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Data')
    XLSX.writeFile(wb, 'inventory_data.xlsx')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return
    try {
      await deleteInventoryRow(id)
      onRefresh()
    } catch (e) { alert('Delete failed') }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-gray-300" />
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Inventory Data</h3>
          <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{ background: '#0B2E6D' }}>
            {filtered.length.toLocaleString()} rows
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search all columns..."
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 focus:outline-none w-44 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition">
            <Download size={13} /> CSV
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg hover:opacity-90 transition"
            style={{ background: '#10B981' }}>
            <Download size={13} /> Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700">
              {COLUMNS.map(col => (
                <th key={col.key}
                  className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 whitespace-nowrap"
                  onClick={() => toggleSort(col.key as SortKey)}>
                  <div className="flex items-center gap-1">
                    {col.label} <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
              {(userRole === 'admin' || userRole === 'manager') && (
                <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {paged.map(row => (
              <tr key={row.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition">
                <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">{row.category}</td>
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{row.bd_loc}</td>
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{row.loc}</td>
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{row.sku_type}</td>
                <td className="px-3 py-2.5 text-right font-medium" style={{ color: '#10B981' }}>{formatCurrency(row.current_stock)}</td>
                <td className="px-3 py-2.5 text-right font-medium" style={{ color: '#7C3AED' }}>{formatCurrency(row.current_nm)}</td>
                <td className="px-3 py-2.5 text-right font-medium" style={{ color: '#0EA5E9' }}>{formatCurrency(row.current_excess)}</td>
                <td className="px-3 py-2.5 text-right font-medium" style={{ color: '#F59E0B' }}>{formatCurrency(row.aging_3_9)}</td>
                <td className="px-3 py-2.5 text-right font-medium" style={{ color: '#EF4444' }}>{formatCurrency(row.aging_9_plus)}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">{formatCurrency(row.target_nm)}</td>
                <td className="px-3 py-2.5 text-gray-500">{getMonthName(row.month)}</td>
                <td className="px-3 py-2.5 text-gray-500">{row.year}</td>
                {(userRole === 'admin' || userRole === 'manager') && (
                  <td className="px-3 py-2.5">
                    {userRole === 'admin' && (
                      <button onClick={() => handleDelete(row.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={COLUMNS.length + 1} className="text-center py-12 text-gray-400">No data found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-500">
          Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length.toLocaleString()}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 transition">
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(5, pages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page + i - 2
            if (p < 1 || p > pages) return null
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 text-xs rounded font-medium transition ${p === page ? 'text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400'}`}
                style={p === page ? { background: '#0B2E6D' } : {}}>
                {p}
              </button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 transition">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
