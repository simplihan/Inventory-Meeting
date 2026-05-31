'use client'

import { TrendingUp, TrendingDown, Package, AlertTriangle, Clock, Layers, Target } from 'lucide-react'
import { formatCurrency, calcPercentChange } from '@/lib/utils'
import type { KPIData } from '@/types'

interface KPICardsProps { kpis: KPIData }

interface CardConfig {
  title: string
  value: number
  diff?: number
  target?: number
  icon: React.ElementType
  color: string
  bg: string
  prefix?: string
  format?: 'currency' | 'number'
}

export default function KPICards({ kpis }: KPICardsProps) {
  const cards: CardConfig[] = [
    {
      title: 'Total Stock Value', value: kpis.stockValue, diff: kpis.stockDiff,
      icon: Package, color: '#10B981', bg: '#D1FAE5', format: 'currency'
    },
    {
      title: 'Non-Moving Stock', value: kpis.currentNM, diff: kpis.nmDiff, target: kpis.targetNM,
      icon: AlertTriangle, color: '#7C3AED', bg: '#EDE9FE', format: 'currency'
    },
    {
      title: 'Aging 3-9 Months', value: kpis.aging3_9, diff: undefined, target: kpis.targetAging,
      icon: Clock, color: '#F59E0B', bg: '#FEF3C7', format: 'currency'
    },
    {
      title: 'Aging 9+ Months', value: kpis.aging9Plus, diff: undefined,
      icon: AlertTriangle, color: '#EF4444', bg: '#FEE2E2', format: 'currency'
    },
    {
      title: 'Excess Stock', value: kpis.currentExcess, diff: kpis.excessDiff, target: kpis.targetExcess,
      icon: Layers, color: '#0EA5E9', bg: '#E0F2FE', format: 'currency'
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  )
}

function KPICard({ title, value, diff, target, icon: Icon, color, bg, format = 'currency' }: CardConfig) {
  const pct = diff !== undefined && value - diff !== 0 ? calcPercentChange(value, value - diff) : null
  const isPositive = diff !== undefined ? diff >= 0 : null
  const targetPct = target ? (value / target) * 100 : null

  return (
    <div className="kpi-card p-4 rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={18} style={{ color }} />
        </div>
        {pct !== null && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(pct).toFixed(1)}%
          </div>
        )}
      </div>

      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {formatCurrency(value)}
      </p>

      {diff !== undefined && (
        <p className={`text-xs mt-1 ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {diff >= 0 ? '+' : ''}{formatCurrency(diff)} vs prev
        </p>
      )}

      {target !== undefined && target > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Target</span>
            <span>{targetPct?.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(targetPct || 0, 100)}%`, background: color }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Target: {formatCurrency(target)}</p>
        </div>
      )}
    </div>
  )
}
