import { createClient } from '@/lib/supabase/client'
import type { InventoryData, FilterState, KPIData } from '@/types'

export async function fetchInventoryData(filters: Partial<FilterState> = {}): Promise<InventoryData[]> {
  const supabase = createClient()
  let query = supabase.from('inventory_data').select('*')

  if (filters.month) query = query.eq('month', filters.month)
  if (filters.year) query = query.eq('year', filters.year)
  if (filters.bdLoc?.length) query = query.in('bd_loc', filters.bdLoc)
  if (filters.loc?.length) query = query.in('loc', filters.loc)
  if (filters.skuType?.length) query = query.in('sku_type', filters.skuType)
  if (filters.category?.length) query = query.in('category', filters.category)
  if (filters.companyId) query = query.eq('company_id', filters.companyId)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export function calculateKPIs(data: InventoryData[]): KPIData {
  const sum = (key: keyof InventoryData) =>
    data.reduce((acc, row) => acc + (Number(row[key]) || 0), 0)

  const currentStock = sum('current_stock')
  const previousStock = sum('previous_stock')
  const currentNM = sum('current_nm')
  const previousNM = sum('previous_nm')
  const currentExcess = sum('current_excess')
  const previousExcess = sum('previous_excess')

  return {
    stockValue: currentStock,
    stockDiff: currentStock - previousStock,
    previousStock,
    currentNM,
    nmDiff: currentNM - previousNM,
    previousNM,
    currentExcess,
    excessDiff: currentExcess - previousExcess,
    previousExcess,
    aging3_9: sum('aging_3_9'),
    aging9Plus: sum('aging_9_plus'),
    targetNM: sum('target_nm'),
    targetExcess: sum('target_excess'),
    targetAging: sum('target_aging'),
  }
}

export async function fetchFilterOptions() {
  const supabase = createClient()
  const { data } = await supabase
    .from('inventory_data')
    .select('bd_loc, loc, sku_type, category, month, year')

  if (!data) return { bdLocs: [], locs: [], skuTypes: [], categories: [], months: [], years: [] }

  return {
    bdLocs: [...new Set(data.map(d => d.bd_loc))].filter(Boolean).sort(),
    locs: [...new Set(data.map(d => d.loc))].filter(Boolean).sort(),
    skuTypes: [...new Set(data.map(d => d.sku_type))].filter(Boolean).sort(),
    categories: [...new Set(data.map(d => d.category))].filter(Boolean).sort(),
    months: [...new Set(data.map(d => d.month))].filter(Boolean).sort((a, b) => a - b),
    years: [...new Set(data.map(d => d.year))].filter(Boolean).sort((a, b) => b - a),
  }
}

export async function insertInventoryRow(row: Omit<InventoryData, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('inventory_data').insert(row).select().single()
  if (error) throw error
  return data
}

export async function bulkInsertInventory(rows: Omit<InventoryData, 'id' | 'created_at' | 'updated_at'>[]) {
  const supabase = createClient()
  const { data, error } = await supabase.from('inventory_data').insert(rows).select()
  if (error) throw error
  return data
}

export async function updateInventoryRow(id: string, updates: Partial<InventoryData>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('inventory_data').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteInventoryRow(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('inventory_data').delete().eq('id', id)
  if (error) throw error
}
