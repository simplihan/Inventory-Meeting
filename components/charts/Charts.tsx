'use client'

import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { MONTHS, formatCurrency, COLORS } from '@/lib/utils'
import type { InventoryData } from '@/types'

interface ChartsProps { data: InventoryData[] }

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>
}

export default function Charts({ data }: ChartsProps) {
  // Donut 1: Stock vs Non-Moving
  const totalStock = data.reduce((s, d) => s + d.current_stock, 0)
  const totalNM = data.reduce((s, d) => s + d.current_nm, 0)
  const stockVsNM = [
    { name: 'Active Stock', value: Math.max(totalStock - totalNM, 0), color: COLORS.stock },
    { name: 'Non-Moving', value: totalNM, color: COLORS.nonMoving },
  ]

  // Donut 2: Stock vs Aging
  const totalAging = data.reduce((s, d) => s + d.aging_3_9 + d.aging_9_plus, 0)
  const stockVsAging = [
    { name: 'Healthy Stock', value: Math.max(totalStock - totalAging, 0), color: COLORS.stock },
    { name: 'Aging 3-9M', value: data.reduce((s, d) => s + d.aging_3_9, 0), color: COLORS.aging },
    { name: 'Aging 9+M', value: data.reduce((s, d) => s + d.aging_9_plus, 0), color: COLORS.criticalAging },
  ]

  // Donut 3: Stock vs Excess
  const totalExcess = data.reduce((s, d) => s + d.current_excess, 0)
  const stockVsExcess = [
    { name: 'Normal Stock', value: Math.max(totalStock - totalExcess, 0), color: COLORS.stock },
    { name: 'Excess', value: totalExcess, color: COLORS.excess },
  ]

  // Monthly trend
  const monthlyMap: Record<string, { stock: number; nm: number; excess: number; aging: number; count: number }> = {}
  data.forEach(d => {
    const key = `${MONTHS[d.month - 1]} ${d.year}`
    if (!monthlyMap[key]) monthlyMap[key] = { stock: 0, nm: 0, excess: 0, aging: 0, count: 0 }
    monthlyMap[key].stock += d.current_stock
    monthlyMap[key].nm += d.current_nm
    monthlyMap[key].excess += d.current_excess
    monthlyMap[key].aging += d.aging_3_9 + d.aging_9_plus
    monthlyMap[key].count++
  })
  const trendData = Object.entries(monthlyMap).slice(-12).map(([month, v]) => ({ month, ...v }))

  // Category bar
  const catMap: Record<string, { stock: number; nm: number; excess: number }> = {}
  data.forEach(d => {
    if (!catMap[d.category]) catMap[d.category] = { stock: 0, nm: 0, excess: 0 }
    catMap[d.category].stock += d.current_stock
    catMap[d.category].nm += d.current_nm
    catMap[d.category].excess += d.current_excess
  })
  const categoryData = Object.entries(catMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.stock - a.stock).slice(0, 10)

  // Location stacked bar
  const locMap: Record<string, { stock: number; nm: number; aging: number; excess: number }> = {}
  data.forEach(d => {
    if (!locMap[d.loc]) locMap[d.loc] = { stock: 0, nm: 0, aging: 0, excess: 0 }
    locMap[d.loc].stock += d.current_stock
    locMap[d.loc].nm += d.current_nm
    locMap[d.loc].aging += d.aging_3_9 + d.aging_9_plus
    locMap[d.loc].excess += d.current_excess
  })
  const locationData = Object.entries(locMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.stock - a.stock).slice(0, 8)

  // Aging area
  const agingData = trendData.map(d => ({ month: d.month, 'Aging 3-9M': d.aging, 'Non-Moving': d.nm }))

  const tooltipStyle = { background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      {/* Row 1: 3 Donut Charts */}
      <ChartCard title="Stock vs Non-Moving">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={stockVsNM} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
              {stockVsNM.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Stock vs Aging">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={stockVsAging} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
              {stockVsAging.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Stock vs Excess">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={stockVsExcess} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
              {stockVsExcess.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 2: Monthly Trend - full width */}
      <div className="lg:col-span-3">
        <ChartCard title="Monthly Trend">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCurrency} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="stock" stroke={COLORS.stock} strokeWidth={2} dot={false} name="Stock" />
              <Line type="monotone" dataKey="nm" stroke={COLORS.nonMoving} strokeWidth={2} dot={false} name="Non-Moving" />
              <Line type="monotone" dataKey="excess" stroke={COLORS.excess} strokeWidth={2} dot={false} name="Excess" />
              <Line type="monotone" dataKey="aging" stroke={COLORS.aging} strokeWidth={2} dot={false} name="Aging" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Category + Location */}
      <div className="lg:col-span-2">
        <ChartCard title="Category Breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCurrency} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="stock" fill={COLORS.stock} name="Stock" radius={[2, 2, 0, 0]} />
              <Bar dataKey="nm" fill={COLORS.nonMoving} name="Non-Moving" radius={[2, 2, 0, 0]} />
              <Bar dataKey="excess" fill={COLORS.excess} name="Excess" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Location Breakdown">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={locationData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatCurrency} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="stock" stackId="a" fill={COLORS.stock} name="Stock" />
            <Bar dataKey="nm" stackId="a" fill={COLORS.nonMoving} name="Non-Moving" />
            <Bar dataKey="excess" stackId="a" fill={COLORS.excess} name="Excess" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 4: Aging Area - full width */}
      <div className="lg:col-span-3">
        <ChartCard title="Aging Analysis Trend">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={agingData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="agingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.aging} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.aging} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="nmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.nonMoving} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.nonMoving} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCurrency} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="Aging 3-9M" stroke={COLORS.aging} fill="url(#agingGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Non-Moving" stroke={COLORS.nonMoving} fill="url(#nmGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}
