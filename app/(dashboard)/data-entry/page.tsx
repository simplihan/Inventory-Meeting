'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { insertInventoryRow } from '@/lib/inventory'
import { MONTH_NAMES } from '@/lib/utils'
import { PlusCircle, Save, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

const defaultForm = {
  category: '', bd_loc: '', loc: '', sku_type: '',
  current_stock: '', previous_stock: '',
  current_nm: '', previous_nm: '',
  current_excess: '', previous_excess: '',
  aging_3_9: '', aging_9_plus: '',
  target_nm: '', target_excess: '', target_aging: '',
  month: String(new Date().getMonth() + 1),
  year: String(currentYear),
}

type FormData = typeof defaultForm

export default function DataEntryPage() {
  const supabase = createClient()
  const [form, setForm] = useState<FormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [userRole, setUserRole] = useState<string>('viewer')

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (data) setUserRole(data.role)
      }
    }
    getRole()
  }, [])

  const set = (key: keyof FormData, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userRole === 'viewer') {
      setStatus({ type: 'error', message: 'You do not have permission to add data.' }); return
    }
    setLoading(true); setStatus(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await insertInventoryRow({
        category: form.category, bd_loc: form.bd_loc, loc: form.loc, sku_type: form.sku_type,
        current_stock: parseFloat(form.current_stock) || 0,
        previous_stock: parseFloat(form.previous_stock) || 0,
        current_nm: parseFloat(form.current_nm) || 0,
        previous_nm: parseFloat(form.previous_nm) || 0,
        current_excess: parseFloat(form.current_excess) || 0,
        previous_excess: parseFloat(form.previous_excess) || 0,
        aging_3_9: parseFloat(form.aging_3_9) || 0,
        aging_9_plus: parseFloat(form.aging_9_plus) || 0,
        target_nm: parseFloat(form.target_nm) || 0,
        target_excess: parseFloat(form.target_excess) || 0,
        target_aging: parseFloat(form.target_aging) || 0,
        month: parseInt(form.month), year: parseInt(form.year),
        company_id: null, business_unit_id: null, created_by: user?.id || null,
      })
      setStatus({ type: 'success', message: 'Record added successfully! Dashboard will refresh automatically.' })
      setForm(defaultForm)
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to save record.' })
    } finally {
      setLoading(false)
    }
  }

  if (userRole === 'viewer') {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle size={40} className="text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">View Only Access</h3>
          <p className="text-gray-500 text-sm mt-1">Contact an admin to get manager access.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <PlusCircle size={22} style={{ color: '#0B2E6D' }} />
          Add Inventory Record
        </h2>
        <p className="text-sm text-gray-500 mt-1">Manually enter a new inventory data record</p>
      </div>

      {status && (
        <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {status.type === 'success' ? <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />}
          <p className={`text-sm ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{status.message}</p>
          <button onClick={() => setStatus(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Classification */}
        <Section title="Classification">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Category *" required>
              <input value={form.category} onChange={e => set('category', e.target.value)} required placeholder="e.g. Electronics" className={inputCls} />
            </Field>
            <Field label="BD LOC *" required>
              <input value={form.bd_loc} onChange={e => set('bd_loc', e.target.value)} required placeholder="e.g. BD-01" className={inputCls} />
            </Field>
            <Field label="LOC *" required>
              <input value={form.loc} onChange={e => set('loc', e.target.value)} required placeholder="e.g. WH-A" className={inputCls} />
            </Field>
            <Field label="SKU Type *" required>
              <input value={form.sku_type} onChange={e => set('sku_type', e.target.value)} required placeholder="e.g. Finished Goods" className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Period */}
        <Section title="Period">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Month *">
              <select value={form.month} onChange={e => set('month', e.target.value)} required className={inputCls}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </Field>
            <Field label="Year *">
              <select value={form.year} onChange={e => set('year', e.target.value)} required className={inputCls}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* Stock Values */}
        <Section title="Stock Values">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Current Stock">
              <input type="number" step="0.01" value={form.current_stock} onChange={e => set('current_stock', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Previous Stock">
              <input type="number" step="0.01" value={form.previous_stock} onChange={e => set('previous_stock', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Non-Moving */}
        <Section title="Non-Moving">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Current NM">
              <input type="number" step="0.01" value={form.current_nm} onChange={e => set('current_nm', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Previous NM">
              <input type="number" step="0.01" value={form.previous_nm} onChange={e => set('previous_nm', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Excess */}
        <Section title="Excess">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Current Excess">
              <input type="number" step="0.01" value={form.current_excess} onChange={e => set('current_excess', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Previous Excess">
              <input type="number" step="0.01" value={form.previous_excess} onChange={e => set('previous_excess', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Aging */}
        <Section title="Aging">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Aging 3-9 Months">
              <input type="number" step="0.01" value={form.aging_3_9} onChange={e => set('aging_3_9', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Aging 9+ Months">
              <input type="number" step="0.01" value={form.aging_9_plus} onChange={e => set('aging_9_plus', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Targets */}
        <Section title="Targets">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Target NM">
              <input type="number" step="0.01" value={form.target_nm} onChange={e => set('target_nm', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Target Excess">
              <input type="number" step="0.01" value={form.target_excess} onChange={e => set('target_excess', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Target Aging">
              <input type="number" step="0.01" value={form.target_aging} onChange={e => set('target_aging', e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
          </div>
        </Section>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60 hover:opacity-90"
            style={{ background: '#0B2E6D' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : 'Save Record'}
          </button>
          <button type="button" onClick={() => setForm(defaultForm)}
            className="px-6 py-2.5 text-sm font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition">
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
