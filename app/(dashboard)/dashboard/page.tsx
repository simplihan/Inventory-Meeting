'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchInventoryData, calculateKPIs } from '@/lib/inventory'
import { createClient } from '@/lib/supabase/client'
import KPICards from '@/components/dashboard/KPICards'
import Filters from '@/components/dashboard/Filters'
import Charts from '@/components/charts/Charts'
import DataTable from '@/components/dashboard/DataTable'
import type { InventoryData, FilterState, KPIData, Profile } from '@/types'
import { RefreshCw, Calendar } from 'lucide-react'
import { MONTH_NAMES } from '@/lib/utils'

const defaultFilters: FilterState = {
  bdLoc: [], loc: [], skuType: [], category: [],
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  companyId: null, businessUnitId: null,
}

export default function DashboardPage() {
  const supabase = createClient()
  const [data, setData] = useState<InventoryData[]>([])
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data)
      }
    }
    getProfile()
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchInventoryData(filters)
      setData(rows)
      setKpis(calculateKPIs(rows))
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { loadData() }, [loadData])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_data' }, () => {
        loadData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const currentMonth = filters.month ? MONTH_NAMES[filters.month - 1] : 'All Months'
  const currentYear = filters.year || new Date().getFullYear()

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inventory Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
            <Calendar size={13} />
            {currentMonth} {currentYear}
            {loading && <span className="text-blue-500">· Refreshing...</span>}
          </p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60 hover:opacity-90"
          style={{ background: '#0B2E6D' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <Filters filters={filters} onChange={setFilters} />

      {/* KPI Cards */}
      {kpis ? (
        <KPICards kpis={kpis} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kpi-card p-4 rounded-xl h-32 animate-pulse bg-gray-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {/* Charts */}
      {data.length > 0 ? (
        <Charts data={data} />
      ) : !loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <p className="text-gray-400 text-sm">No data for the selected filters.</p>
          <p className="text-gray-400 text-xs mt-1">Try adjusting your filters or import data to get started.</p>
        </div>
      ) : null}

      {/* Data Table */}
      <DataTable data={data} onRefresh={loadData} userRole={profile?.role} />

      {/* Last updated */}
      <p className="text-xs text-gray-400 text-right">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </p>
    </div>
  )
}
