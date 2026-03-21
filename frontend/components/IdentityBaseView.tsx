"use client"

import React, { useState, useEffect } from 'react'
import { Users, AlertCircle, ChevronRight, Search, Filter } from 'lucide-react'
import { API_BASE_URL } from '../lib/config'
import { MetricType } from './DashboardComponents'

interface IdentityBaseViewProps {
  insights: any[]
  metrics: any
  onDrillDown: (type: MetricType) => void
}

export default function IdentityBaseView({ insights, metrics, onDrillDown }: IdentityBaseViewProps) {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'high_risk' | 'persuadable'>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 10

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let endpoint = `/api/v1/customers/?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`
      if (filter === 'high_risk') endpoint = `/api/v1/customers/high-risk`
      if (filter === 'persuadable') endpoint = `/api/v1/customers/uplift-insights`

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) {
        const data = json.data?.items || json.data || []
        setCustomers(data)
        setTotal(json.data?.total || data.length)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [filter, page])

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-10 py-10 space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-black flex items-center gap-4">
          <Users className="w-8 h-8 text-blue-400" />
          Identity Base
        </h2>
        <div className="flex gap-3">
          {(['all', 'high_risk', 'persuadable'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All Identities' : f === 'high_risk' ? 'High Risk' : 'Persuadable'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Identities', value: metrics?.total_customers?.toLocaleString() || '0', color: 'text-white' },
          { label: 'High Risk', value: metrics?.high_risk_customers?.toLocaleString() || '0', color: 'text-rose-400' },
          { label: 'Persuadable', value: metrics?.persuadables?.toLocaleString() || '0', color: 'text-emerald-400' },
          { label: 'Revenue Exposure', value: `$${(metrics?.revenue_at_risk || 0).toLocaleString()}`, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 text-center cursor-pointer hover:border-blue-500/30 transition-all" onClick={() => onDrillDown(i === 0 ? 'total' : i === 1 ? 'high_risk' : i === 2 ? 'persuadable' : 'revenue_risk')}>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all text-sm"
        />
      </div>

      {/* Customer Table */}
      <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase bg-white/5 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-8 py-5 tracking-widest font-black">Identity</th>
              <th className="px-8 py-5 tracking-widest font-black">Channel</th>
              <th className="px-8 py-5 text-center tracking-widest font-black">Churn Risk</th>
              <th className="px-8 py-5 text-center tracking-widest font-black">Uplift</th>
              <th className="px-8 py-5 text-right tracking-widest font-black">Revenue</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                No identities found.
              </td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id || i} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-black text-blue-400">
                      {c.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase tracking-tighter text-xs">{c.customer_id || `ID_${c.id}`}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{c.name}</p>
                      <p className="text-[9px] text-slate-600 italic">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-slate-400 border border-white/10 uppercase">
                    {c.communication_channel || 'Email'}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="inline-flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${(c.churn_probability || 0) > 0.6 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className="font-black text-white">{((c.churn_probability || 0) * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className="font-black text-emerald-400">+{((c.uplift_score || 0) * 100).toFixed(1)}%</span>
                </td>
                <td className="px-8 py-5 text-right font-black text-white">
                  ${(c.revenue || 0).toLocaleString()}
                </td>
                <td className="px-8 py-5">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="p-6 border-t border-white/5 flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase text-slate-400 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-all"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * PAGE_SIZE >= total}
                className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase text-slate-400 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
