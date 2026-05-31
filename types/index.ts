export type UserRole = 'admin' | 'manager' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  logo_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BusinessUnit {
  id: string
  name: string
  company_id: string
  created_at: string
}

export interface InventoryData {
  id: string
  category: string
  bd_loc: string
  loc: string
  sku_type: string
  current_stock: number
  previous_stock: number
  current_nm: number
  previous_nm: number
  current_excess: number
  previous_excess: number
  aging_3_9: number
  aging_9_plus: number
  target_nm: number
  target_excess: number
  target_aging: number
  month: number
  year: number
  company_id: string | null
  business_unit_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface KPIData {
  stockValue: number
  stockDiff: number
  currentNM: number
  nmDiff: number
  currentExcess: number
  excessDiff: number
  aging3_9: number
  aging9Plus: number
  targetNM: number
  targetExcess: number
  targetAging: number
  previousStock: number
  previousNM: number
  previousExcess: number
}

export interface FilterState {
  bdLoc: string[]
  loc: string[]
  skuType: string[]
  category: string[]
  month: number | null
  year: number | null
  companyId: string | null
  businessUnitId: string | null
}

export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface MonthlyTrendPoint {
  month: string
  stock: number
  nm: number
  excess: number
  aging: number
}
