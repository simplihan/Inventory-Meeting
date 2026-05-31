'use client'

import { useState, useEffect } from 'react'
import { Filter, X, ChevronDown, Search } from 'lucide-react'
import { fetchFilterOptions } from '@/lib/inventory'
import { MONTH_NAMES } from '@/lib/utils'
import type { FilterState } from '@/types'

interface FiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export default function Filters({ filters, onChange }: FiltersProps) {
  const [options, setOptions] = useState<{
    bdLocs: string[], locs: string[], skuTypes: string[], categories: string[], months: number[], years: number[]
  }>({ bdLocs: [], locs: [], skuTypes: [], categories: [], months: [], years: [] })

  useEffect(() => {
    fetchFilterOptions().then(setOptions)
  }, [])

  const update = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    onChange({ ...filters, [key]: value })
  }

  const clearAll = () => {
    onChange({ bdLoc: [], loc: [], skuType: [], category: [], month: null, year: null, companyId: null, businessUnitId: null })
  }

  const activeCount = [
    filters.bdLoc.length, filters.loc.length, filters.skuType.length, filters.category.length,
    filters.month ? 1 : 0, filters.year ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: '#0B2E6D' }} />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Filters</span>
          {activeCount > 0 && (
            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#0B2E6D' }}>
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <X size={12} /> Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MultiSelect
          label="BD LOC" options={options.bdLocs}
          value={filters.bdLoc} onChange={v => update('bdLoc', v)}
        />
        <MultiSelect
          label="LOC" options={options.locs}
          value={filters.loc} onChange={v => update('loc', v)}
        />
        <MultiSelect
          label="SKU Type" options={options.skuTypes}
          value={filters.skuType} onChange={v => update('skuType', v)}
        />
        <MultiSelect
          label="Category" options={options.categories}
          value={filters.category} onChange={v => update('category', v)}
        />
        <SingleSelect
          label="Month"
          options={options.months.map(m => ({ value: String(m), label: MONTH_NAMES[m - 1] }))}
          value={filters.month ? String(filters.month) : ''}
          onChange={v => update('month', v ? Number(v) : null)}
        />
        <SingleSelect
          label="Year"
          options={options.years.map(y => ({ value: String(y), label: String(y) }))}
          value={filters.year ? String(filters.year) : ''}
          onChange={v => update('year', v ? Number(v) : null)}
        />
      </div>
    </div>
  )
}

function MultiSelect({ label, options, value, onChange }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
        <span className="text-gray-600 dark:text-gray-300 truncate">
          {value.length > 0 ? `${label} (${value.length})` : label}
        </span>
        <ChevronDown size={12} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50 py-1">
          <div className="px-2 pb-1">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-100 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-700 focus:outline-none" />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)}
                  className="w-3.5 h-3.5 rounded" />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{opt}</span>
              </label>
            ))}
            {filtered.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">No options</p>}
          </div>
          <div className="border-t border-gray-100 dark:border-slate-700 px-2 py-1">
            <button onClick={() => { setOpen(false); setSearch('') }}
              className="w-full text-xs text-center text-gray-500 hover:text-gray-700 py-1">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

function SingleSelect({ label, options, value, onChange }: {
  label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 focus:outline-none hover:bg-gray-100 dark:hover:bg-slate-700 appearance-none cursor-pointer">
        <option value="">{label}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}
