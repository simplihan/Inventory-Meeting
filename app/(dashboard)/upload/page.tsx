'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { bulkInsertInventory } from '@/lib/inventory'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Eye, Loader2, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'

const MONTH_MAP: Record<string, number> = {
  jan:1, january:1, feb:2, february:2, mar:3, march:3,
  apr:4, april:4, may:5, jun:6, june:6, jul:7, july:7,
  aug:8, august:8, sep:9, september:9, oct:10, october:10,
  nov:11, november:11, dec:12, december:12,
  '1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'11':11,'12':12
}

function parseMonth(val: any): number {
  if (!val) return new Date().getMonth() + 1
  const s = String(val).toLowerCase().trim()
  return MONTH_MAP[s] || parseInt(s) || new Date().getMonth() + 1
}

function n(val: any) { return parseFloat(String(val || 0).replace(/,/g,'')) || 0 }

function mapRow(row: Record<string, any>, userId: string) {
  const k = (key: string) => {
    const lk = key.toLowerCase().replace(/[\s\-_]+/g,'')
    return Object.keys(row).find(k => k.toLowerCase().replace(/[\s\-_]+/g,'') === lk) || ''
  }
  const g = (key: string) => row[k(key)] ?? ''

  return {
    month: parseMonth(g('month')),
    loc: String(g('loc') || '').trim(),
    bd_loc: String(g('ar(bdloc)') || g('ar') || g('bdloc') || g('arloc') || '').trim(),
    category: String(g('category') || '').trim(),
    sku_type: String(g('skutype') || g('type') || '').trim(),
    current_stock: n(g('currentstock') || g('currentstockvalue')),
    previous_stock: n(g('lastmstock') || g('lastmstockvalue') || g('previousstock')),
    current_bd: n(g('cbd') || g('currentbd')),
    previous_bd: n(g('pbd') || g('previousbd')),
    current_nm: n(g('currentnonmoving') || g('currentnommoving') || g('currentnm')),
    previous_nm: n(g('lastmnonmoving') || g('lastmnommoving') || g('previousnm')),
    target_nm: n(g('targetnonmoving') || g('targetnommoving') || g('targetnm')),
    current_excess: n(g('currentexcess')),
    previous_excess: n(g('lastmexcess') || g('previousexcess')),
    target_excess: n(g('targetexcess')),
    aging_3_9: n(g('39currentaging') || g('currentaging39') || g('aging39')),
    prev_aging_3_9: n(g('39lastmaging') || g('lastmaging39')),
    target_aging: n(g('39targetaging') || g('targetaging39') || g('targetaging')),
    aging_9_plus: n(g('9+currentaging') || g('currentaging9+') || g('aging9plus')),
    prev_aging_9_plus: n(g('9+lastmaging') || g('lastmaging9+')),
    target_aging_9_plus: n(g('9+targetaging') || g('targetaging9+')),
    company_id: null,
    business_unit_id: null,
    created_by: userId,
  }
}

type Status = { type: 'success' | 'error' | 'info'; message: string }

export default function UploadPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapped, setMapped] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [step, setStep] = useState<'idle'|'preview'|'done'>('idle')
  const [userId, setUserId] = useState('')
  const [userRole, setUserRole] = useState('viewer')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => { if (data) setUserRole(data.role) })
      }
    })
  }, [])

  const handleFile = async (f: File) => {
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setStatus({ type: 'error', message: 'Please upload an .xlsx, .xls or .csv file' }); return
    }
    setFile(f); setLoading(true); setStatus(null)
    try {
      const buf = await f.arrayBuffer()
      const wb = XLSX.read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (!raw.length) { setStatus({ type: 'error', message: 'File is empty or has no data rows' }); setLoading(false); return }
      setHeaders(Object.keys(raw[0]))
      setPreview(raw.slice(0, 5))
      setMapped(raw.map(r => mapRow(r, userId)))
      setStep('preview')
    } catch (e: any) {
      setStatus({ type: 'error', message: 'Failed to read file: ' + e.message })
    } finally { setLoading(false) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleImport = async () => {
    if (userRole === 'viewer') { setStatus({ type: 'error', message: 'No permission to import data' }); return }
    setImporting(true); setStatus(null)
    try {
      const valid = mapped.filter(r => r.loc && r.category && r.sku_type)
      if (!valid.length) { setStatus({ type: 'error', message: 'No valid rows found. Check LOC, CATEGORY and SKU TYPE columns.' }); setImporting(false); return }
      await bulkInsertInventory(valid)
      setStatus({ type: 'success', message: `✓ Successfully imported ${valid.length} records! Dashboard updated automatically.` })
      setStep('done')
    } catch (e: any) {
      setStatus({ type: 'error', message: 'Import failed: ' + e.message })
    } finally { setImporting(false) }
  }

  const reset = () => { setFile(null); setPreview([]); setHeaders([]); setMapped([]); setStep('idle'); setStatus(null) }

  if (userRole === 'viewer') {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle size={40} className="text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">View Only Access</h3>
          <p className="text-gray-500 text-sm mt-1">Contact an admin to get manager access for importing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Upload size={22} style={{ color: '#0B2E6D' }} /> Import Excel Data
        </h2>
        <p className="text-sm text-gray-500 mt-1">Upload your monthly inventory Excel file — dashboard updates automatically</p>
      </div>

      {status && (
        <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 border border-green-200' : status.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          {status.type === 'success' ? <CheckCircle size={18} className="text-green-600 flex-shrink-0" /> : <AlertCircle size={18} className="text-red-600 flex-shrink-0" />}
          <p className={`text-sm ${status.type === 'success' ? 'text-green-700' : status.type === 'error' ? 'text-red-700' : 'text-blue-700'}`}>{status.message}</p>
          <button onClick={() => setStatus(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>
      )}

      {step === 'idle' && (
        <div
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer bg-white dark:bg-slate-900"
          onClick={() => fileRef.current?.click()}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#EFF6FF' }}>
            <FileSpreadsheet size={32} style={{ color: '#0B2E6D' }} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Drop your Excel file here</h3>
          <p className="text-sm text-gray-500 mb-4">or click to browse — supports .xlsx, .xls, .csv</p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: '#0B2E6D' }}>
            <Upload size={15} /> Choose File
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {loading && <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Reading file...</div>}
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          {/* File info */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex items-center gap-3">
            <FileSpreadsheet size={20} style={{ color: '#10B981' }} />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{file?.name}</p>
              <p className="text-xs text-gray-500">{mapped.length} rows detected · {headers.length} columns</p>
            </div>
            <button onClick={reset} className="ml-auto p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 size={15} /></button>
          </div>

          {/* Column mapping summary */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Eye size={15} /> Column Mapping Preview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                ['MONTH', 'month'], ['LOC', 'loc'], ['AR/BD LOC', 'bd_loc'],
                ['CATEGORY', 'category'], ['SKU TYPE', 'sku_type'],
                ['CURRENT STOCK', 'current_stock'], ['CURRENT NM', 'current_nm'],
                ['CURRENT EXCESS', 'current_excess'], ['3-9 AGING', 'aging_3_9'],
                ['9+ AGING', 'aging_9_plus'],
              ].map(([label, key]) => {
                const sample = mapped[0]?.[key]
                const hasData = sample !== undefined && sample !== '' && sample !== 0
                return (
                  <div key={key} className={`p-2 rounded-lg border text-xs ${hasData ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <p className={`font-medium ${hasData ? 'text-green-700' : 'text-red-600'}`}>{label}</p>
                    <p className="text-gray-500 truncate">{hasData ? String(sample) : '— not found'}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data preview table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Raw Data Preview (first 5 rows)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800">
                    {headers.slice(0,12).map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap border-b border-gray-100 dark:border-slate-700">{h}</th>
                    ))}
                    {headers.length > 12 && <th className="px-3 py-2 text-gray-400">+{headers.length - 12} more</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {headers.slice(0,12).map(h => (
                        <td key={h} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{String(row[h] || '')}</td>
                      ))}
                      {headers.length > 12 && <td className="px-3 py-2 text-gray-400">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleImport} disabled={importing}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60 hover:opacity-90"
              style={{ background: '#0B2E6D' }}>
              {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {importing ? `Importing ${mapped.length} rows...` : `Import ${mapped.length} Rows`}
            </button>
            <button onClick={reset} className="px-5 py-2.5 text-sm font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Import Complete!</h3>
          <p className="text-gray-500 text-sm mb-6">Your dashboard has been updated automatically.</p>
          <div className="flex gap-3 justify-center">
            <a href="/dashboard" className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition" style={{ background: '#0B2E6D' }}>
              View Dashboard
            </a>
            <button onClick={reset} className="px-5 py-2.5 text-sm font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition">
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
