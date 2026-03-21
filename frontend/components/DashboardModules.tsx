"use client"

import React from 'react'
import { 
  AlertCircle, Target, Layers, Cpu, TrendingUp, 
  Users, ChevronRight, Activity, Zap, Play, CheckCircle2, RefreshCcw 
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts'
import { API_BASE_URL } from '../lib/config'

// --- Mock Data (Fallbacks) ---
const churnDistribution = [
  { range: '0-20%', count: 0, color: '#10b981' },
  { range: '20-40%', count: 0, color: '#3b82f6' },
  { range: '40-60%', count: 0, color: '#f59e0b' },
  { range: '60-80%', count: 0, color: '#ef4444' },
  { range: '80-100%', count: 0, color: '#7f1d1d' },
];

// --- Modules ---

export function ChurnForecastEngine() {
  const [distribution, setDistribution] = React.useState<any[]>(churnDistribution)
  const [highRiskCustomers, setHighRiskCustomers] = React.useState<any[]>([])
  const [kpis, setKpis] = React.useState<any>(null)
  const [chartLoading, setChartLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')

        // Fetch KPIs for distribution chart
        const kpiRes = await fetch(`${API_BASE_URL}/api/v1/customers/dashboard-kpis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const kpiJson = await kpiRes.json()

        if (kpiJson.success && kpiJson.data.total_customers > 0) {
          const d = kpiJson.data
          setKpis(d)
          setDistribution([
            { range: '0-20%', count: Math.floor(d.total_customers * (1 - d.avg_churn_prob) * 0.5), color: '#10b981' },
            { range: '20-40%', count: Math.floor(d.total_customers * (1 - d.avg_churn_prob) * 0.3), color: '#3b82f6' },
            { range: '40-60%', count: Math.floor(d.total_customers * d.avg_churn_prob * 0.4), color: '#f59e0b' },
            { range: '60-80%', count: Math.floor(d.high_risk_customers * 0.6), color: '#ef4444' },
            { range: '80-100%', count: Math.floor(d.high_risk_customers * 0.4), color: '#7f1d1d' },
          ])
        }

        // Fetch actual high-risk customers for the alert panel
        const riskRes = await fetch(`${API_BASE_URL}/api/v1/customers?filter=high_risk&limit=4`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const riskJson = await riskRes.json()
        if (riskJson.success && riskJson.data?.length) {
          setHighRiskCustomers(riskJson.data.slice(0, 4))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setChartLoading(false)
      }
    }
    fetchData()
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#0f172a] border border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-black text-slate-400 uppercase">Range: {payload[0].payload.range}</p>
          <p className="text-sm font-black text-white">{payload[0].value} Customers</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Neural Decay Distribution</h3>
          {chartLoading ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="range" stroke="#94a6b8" fontSize={10} fontWeight="900" />
                  <YAxis stroke="#94a6b8" fontSize={10} fontWeight="900" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.4} stroke={entry.color} strokeWidth={2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {kpis && (
            <div className="flex gap-8 mt-6 pt-6 border-t border-white/5">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-normal">Total Identities</p>
                <p className="text-xl font-black text-white">{kpis.total_customers?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-normal">Avg Churn Prob</p>
                <p className="text-xl font-black text-amber-400">{((kpis.avg_churn_prob || 0) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-normal">High Risk</p>
                <p className="text-xl font-black text-rose-400">{kpis.high_risk_customers?.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-rose-500/5">
          <h3 className="text-sm font-black text-rose-500/50 uppercase tracking-[0.3em] mb-6">High Risk Alerts</h3>
          <div className="space-y-4">
            {(highRiskCustomers.length > 0 ? highRiskCustomers : [{id:'?',name:'Loading...',churn_probability:0}]).map((customer, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">{customer.name || `NODE_${customer.id}`}</p>
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                    {((customer.churn_probability || 0) * 100).toFixed(0)}% CHURN RISK
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={async () => {
              try {
                const token = localStorage.getItem('token')
                const res = await fetch(`${API_BASE_URL}/api/v1/analytics/intervene`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                  const json = await res.json()
                  alert(`Bulk intervention deployed to ${json.intervened_count || 'all high-risk'} customers.`)
                }
              } catch (err) {
                console.error(err)
              }
            }}
            className="w-full mt-8 py-4 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_-5px_rgba(244,63,94,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            Initiate Bulk Intervention
          </button>
        </div>
      </div>
    </div>
  )
}


export function UpliftROIMatrix() {
  const [roiData, setRoiData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [summary, setSummary] = React.useState({ total_roi: 0, top_channel: '', avg_uplift: 0 })

  React.useEffect(() => {
    const fetchROI = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE_URL}/api/v1/analytics/campaigns`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success && json.data?.length) {
          const mapped = json.data.map((c: any) => ({
            name: c.name,
            roi: parseFloat(((c.progress / 20) + 1).toFixed(2)),
            uplift: parseFloat((c.progress * 0.008).toFixed(3)),
            cost: Math.floor(c.progress * 18) + 400,
            engagement: c.progress || 0,
          }))
          setRoiData(mapped)
          const top = mapped.reduce((a: any, b: any) => a.roi > b.roi ? a : b, mapped[0])
          setSummary({
            total_roi: mapped.reduce((s: number, c: any) => s + c.roi, 0),
            top_channel: top?.name || '—',
            avg_uplift: mapped.reduce((s: number, c: any) => s + c.uplift, 0) / mapped.length
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchROI()
  }, [])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e']

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Portfolio ROI', value: `${summary.total_roi.toFixed(1)}x`, color: 'text-emerald-400' },
          { label: 'Top Channel', value: summary.top_channel || '—', color: 'text-blue-400' },
          { label: 'Avg Uplift Score', value: `${(summary.avg_uplift * 100).toFixed(1)}%`, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Campaign ROI vs Engagement Matrix</h3>
        {loading ? (
          <div className="h-[350px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : roiData.length === 0 ? (
          <div className="h-[350px] flex flex-col items-center justify-center text-slate-500">
            <p className="text-xs font-black uppercase tracking-widest">No campaign data available.</p>
            <p className="text-[10px] mt-2 text-slate-600">Initialize campaigns in Campaign Control Base first.</p>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" stroke="#94a6b8" fontSize={10} fontWeight="900" tickFormatter={(v) => `${v}x`} />
                <YAxis dataKey="name" type="category" stroke="#94a6b8" fontSize={10} fontWeight="900" width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  formatter={(value: any) => [`${value}x ROI`, 'ROI']}
                />
                <Bar dataKey="roi" radius={[0, 8, 8, 0]} barSize={28}>
                  {roiData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export function RetentionROIView({ metrics }: { metrics: any }) {
  const [roiStats, setRoiStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchROI = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE_URL}/api/v1/analytics/executive-metrics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success) setRoiStats(json.data?.metrics || json.metrics)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchROI()
  }, [])

  const revenueAtRisk = metrics?.revenue_at_risk || 0
  const recoveryRate = roiStats?.expected_roi || 0
  const estimatedRecovery = revenueAtRisk * (recoveryRate / 100)

  return (
    <div className="space-y-10 animate-in fade-in duration-700 px-10 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Revenue At Risk</p>
          <p className="text-3xl font-black text-rose-400">${revenueAtRisk.toLocaleString()}</p>
        </div>
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estimated Recovery</p>
          <p className="text-3xl font-black text-emerald-400">
            {loading ? '—' : `$${estimatedRecovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </p>
        </div>
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Expected Campaign ROI</p>
          <p className="text-3xl font-black text-blue-400">
            {loading ? '—' : `${recoveryRate.toFixed(1)}%`}
          </p>
        </div>
      </div>

      {roiStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Retention Metrics</h3>
            {[
              { label: 'Net Revenue Retention', value: `${roiStats.nrr || 0}%`, color: 'text-emerald-400' },
              { label: 'Monthly Churn Rate', value: `${roiStats.monthly_churn || 0}%`, color: 'text-amber-400' },
              { label: 'Annual Churn Rate', value: `${roiStats.annual_churn || 0}%`, color: 'text-rose-400' },
              { label: 'Avg Customer LTV', value: `$${(roiStats.avg_ltv || 0).toLocaleString()}`, color: 'text-blue-400' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.label}</span>
                <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Financial Recovery Forecast</h3>
            {[
              { label: 'Portfolio Revenue', value: `$${(roiStats.portfolio_revenue || 0).toLocaleString()}`, color: 'text-white' },
              { label: 'Recovery Potential', value: `$${(roiStats.recovery_potential || estimatedRecovery).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'text-emerald-400' },
              { label: 'Total LTV Portfolio', value: `$${(roiStats.total_ltv || 0).toLocaleString()}`, color: 'text-blue-400' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.label}</span>
                <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
              </div>
            ))}

            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Neural Advisory</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Targeting <span className="text-white font-black">{metrics?.persuadables || 0}</span> persuadable customers with personalized campaigns could recover an estimated <span className="text-emerald-400 font-black">${estimatedRecovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> in ARR.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
