'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { fetchInventoryData, calculateKPIs } from '@/lib/inventory'
import { FileText, Download, Loader2, BarChart3, TrendingUp, Package } from 'lucide-react'
import { formatCurrency, MONTH_NAMES, getMonthName } from '@/lib/utils'
import * as XLSX from 'xlsx'

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchInventoryData({ month }).then(d => { setData(d); setLoading(false) })
  }, [month])

  const kpis = data.length ? calculateKPIs(data) : null

  const exportExcel = async () => {
    setExporting(true)
    const summary = [{
      'Month': getMonthName(month),
      'Total Stock': kpis?.stockValue || 0,
      'Stock Diff': kpis?.stockDiff || 0,
      'Current NM': kpis?.currentNM || 0,
      'NM Diff': kpis?.nmDiff || 0,
      'Target NM': kpis?.targetNM || 0,
      'Current Excess': kpis?.currentExcess || 0,
      'Excess Diff': kpis?.excessDiff || 0,
      'Target Excess': kpis?.targetExcess || 0,
      'Aging 3-9M': kpis?.aging3_9 || 0,
      'Aging 9+M': kpis?.aging9Plus || 0,
      'Target Aging': kpis?.targetAging || 0,
    }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.map(r => ({
      Month: getMonthName(r.month), LOC: r.loc, 'BD LOC': r.bd_loc,
      Category: r.category, 'SKU Type': r.sku_type,
      'Current Stock': r.current_stock, 'Previous Stock': r.previous_stock,
      'Current NM': r.current_nm, 'Target NM': r.target_nm,
      'Current Excess': r.current_excess, 'Target Excess': r.target_excess,
      'Aging 3-9M': r.aging_3_9, 'Aging 9+M': r.aging_9_plus,
    }))), 'Detail Data')
    XLSX.writeFile(wb, `Monthly_Report_${getMonthName(month)}.xlsx`)
    setExporting(false)
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={22} style={{ color: '#0B2E6D' }} /> Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">Generate and export monthly inventory reports</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none">
            {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <button onClick={exportExcel} disabled={exporting || !data.length}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: '#10B981' }}>
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : kpis ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Stock', value: kpis.stockValue, diff: kpis.stockDiff, color: '#10B981' },
              { label: 'Non-Moving', value: kpis.currentNM, diff: kpis.nmDiff, color: '#7C3AED' },
              { label: 'Excess', value: kpis.currentExcess, diff: kpis.excessDiff, color: '#0EA5E9' },
              { label: 'Aging 3-9M', value: kpis.aging3_9, color: '#F59E0B' },
              { label: 'Aging 9+M', value: kpis.aging9Plus, color: '#EF4444' },
              { label: 'Records', value: data.length, color: '#0B2E6D' },
            ].map(item => (
              <div key={item.label} className="kpi-card p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-xl font-bold" style={{ color: item.color }}>{typeof item.value === 'number' && item.value > 999 ? formatCurrency(item.value) : item.value}</p>
                {item.diff !== undefined && (
                  <p className={`text-xs mt-1 ${item.diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {item.diff >= 0 ? '+' : ''}{formatCurrency(item.diff)} MoM
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Data for {getMonthName(month)} — {data.length} records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800">
                    {['Category','LOC','SKU Type','Stock','NM','Excess','Aging 3-9','Aging 9+'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {data.slice(0,20).map(row => (
                    <tr key={row.id} className="hover:bg-blue-50/20">
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{row.category}</td>
                      <td className="px-3 py-2 text-gray-500">{row.loc}</td>
                      <td className="px-3 py-2 text-gray-500">{row.sku_type}</td>
                      <td className="px-3 py-2 text-right font-medium" style={{color:'#10B981'}}>{formatCurrency(row.current_stock)}</td>
                      <td className="px-3 py-2 text-right" style={{color:'#7C3AED'}}>{formatCurrency(row.current_nm)}</td>
                      <td className="px-3 py-2 text-right" style={{color:'#0EA5E9'}}>{formatCurrency(row.current_excess)}</td>
                      <td className="px-3 py-2 text-right" style={{color:'#F59E0B'}}>{formatCurrency(row.aging_3_9)}</td>
                      <td className="px-3 py-2 text-right" style={{color:'#EF4444'}}>{formatCurrency(row.aging_9_plus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 20 && <p className="text-xs text-center text-gray-400 py-2">Showing 20 of {data.length} rows — export for full data</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No data for {getMonthName(month)}</p>
        </div>
      )}
    </div>
  )
}
