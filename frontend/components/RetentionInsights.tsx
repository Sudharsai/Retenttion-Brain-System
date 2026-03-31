"use client"

import React, { useEffect, useState } from 'react'
import { ShieldAlert, Zap, TrendingUp, ChevronRight, BarChart3, Mail, Phone, MessageSquare } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { API_BASE_URL } from '../lib/config'

interface RiskCustomer {
  id: number;
  name: string;
  segment: string;
  priority_score: number;
  channel: string;
}

interface CampaignAnalytic {
  campaign: string;
  success_rate: number;
  total_actions: number;
}

export function RiskWidget() {
  const [customers, setCustomers] = useState<RiskCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopRisk = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE_URL}/api/v1/customers/top-risk`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success) setCustomers(json.data)
      } catch (err) {
        console.error("Top risk fetch failed", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTopRisk()
  }, [])

  if (loading) return <div className="h-64 flex items-center justify-center"><Zap className="animate-pulse text-blue-500" /></div>

  return (
    <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          Critical Intercepts (Top 20)
        </h3>
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">LIVE STREAM //</span>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {customers.map((c) => (
          <div key={c.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xs font-black text-blue-400 border border-blue-500/20">
                {c.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-black text-white">{c.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{c.segment}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <div className="flex items-center gap-1">
                        {c.channel === 'CALL' && <Phone className="w-2.5 h-2.5 text-amber-500" />}
                        {c.channel === 'EMAIL' && <Mail className="w-2.5 h-2.5 text-blue-400" />}
                        {c.channel === 'SMS' && <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />}
                        <span className="text-[8px] font-black text-slate-400 uppercase">{c.channel}</span>
                    </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-blue-400">{c.priority_score.toFixed(0)}</p>
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">PRIORITY</p>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-center py-10 text-slate-600 font-black text-[10px] uppercase tracking-widest">No priority intercepts queued.</p>
        )}
      </div>
    </div>
  )
}

export function PerformanceChart() {
  const [data, setData] = useState<CampaignAnalytic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE_URL}/api/v1/customers/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (err) {
        console.error("Analytics fetch failed", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e']

  if (loading) return <div className="h-64 flex items-center justify-center"><BarChart3 className="animate-pulse text-blue-500" /></div>

  return (
    <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
      <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        Campaign Success Loop
      </h3>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis dataKey="campaign" stroke="#94a6b8" fontSize={10} fontWeight="900" />
            <YAxis stroke="#94a6b8" fontSize={10} fontWeight="900" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
              itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
            />
            <Bar dataKey="success_rate" radius={[8, 8, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
