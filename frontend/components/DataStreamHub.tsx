"use client"

import React, { useState, useEffect } from 'react'
import { 
  Database, Activity, ShieldCheck, 
  BarChart, Zap, Layers, RefreshCcw,
  ArrowUpRight, Server, Globe
} from 'lucide-react'
import DataControlPanel from './DataControlPanel'
import { API_BASE_URL } from '../lib/config'

interface MetricCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  trend?: string;
}

function MetricCard({ label, value, sub, icon, trend }: MetricCardProps) {
  return (
    <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend && (
           <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest animate-pulse">
              <ArrowUpRight className="w-3 h-3" /> {trend}
           </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
        <p className="text-[10px] text-slate-600 font-bold uppercase mt-2">{sub}</p>
      </div>
    </div>
  )
}

export default function DataStreamHub({ onRefresh }: { onRefresh?: () => void }) {
  const [stats, setStats] = useState({ total_rows: 0, dataset_count: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE_URL}/api/v1/customers/dashboard-kpis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success) {
          setStats({
            total_rows: json.data.total_customers,
            dataset_count: json.data.dataset_count || 0
          })
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12 px-10">
        <MetricCard 
          label="Global Ingestion" 
          value={stats.total_rows.toLocaleString()} 
          sub="Unified Binary Units" 
          icon={<Database className="w-6 h-6" />}
          trend="+12%"
        />
        <MetricCard 
          label="Active Pipelines" 
          value={stats.dataset_count || 1} 
          sub="Concurrent Stream Matrix" 
          icon={<Layers className="w-6 h-6" />}
        />
        <MetricCard 
          label="Neural Integrity" 
          value="98.2%" 
          sub="Data Quality Index" 
          icon={<ShieldCheck className="w-6 h-6" />}
        />
        <MetricCard 
          label="Sync Latency" 
          value="14ms" 
          sub="Edge Point Resonance" 
          icon={<Activity className="w-6 h-6" />}
        />
      </div>

      <div className="relative">
         {/* Live Pipeline Visual Overlay (Decorative) */}
         <div className="absolute top-0 right-10 flex gap-2 items-center px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full z-10">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Live Node Connection</span>
         </div>
         
         <DataControlPanel onRefresh={onRefresh} />
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 px-10">
         <div className="lg:col-span-2 glass-card p-10 rounded-[2.5rem] border border-white/5 bg-blue-600/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-10">
               <Globe className="w-32 h-32" />
            </div>
            <h3 className="text-xl font-black text-white mb-4">Strategic Data Sharding</h3>
            <p className="text-sm text-slate-400 font-bold leading-relaxed max-w-2xl">
               Our neural sharding protocol ensures that every ingestion event is automatically cross-referenced with your global retention parameters. Current active nodes are stationed in <span className="text-blue-400">Singapore</span>, <span className="text-purple-400">London</span>, and <span className="text-blue-400">Silicon Valley</span>.
            </p>
            <div className="flex gap-4 mt-8">
               <button className="px-6 py-3 bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/[0.25] transition-all">Optimizing Nodes</button>
               <button className="px-6 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Shard Logs</button>
            </div>
         </div>
         <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-center text-center">
            <Server className="w-12 h-12 text-blue-500/30 mx-auto mb-6" />
            <h4 className="text-lg font-black text-white mb-2 tracking-tight">External Stream Sync</h4>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose">
               Purchase <span className="text-white">Enterprise Tier</span> to unlock persistent database streaming via Apache Kafka & MQTT.
            </p>
         </div>
      </div>
      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}
