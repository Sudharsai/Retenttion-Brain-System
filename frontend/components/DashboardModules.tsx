"use client"

import React from 'react'
import { 
  AlertCircle, Target, Layers, Cpu, TrendingUp, 
  Users, ChevronRight, Activity, Zap, Play, CheckCircle2 
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts'
import { API_BASE_URL } from '../lib/config'

// --- Mock Data ---
const churnDistribution = [
  { range: '0-20%', count: 450, color: '#10b981' },
  { range: '20-40%', count: 320, color: '#3b82f6' },
  { range: '40-60%', count: 180, color: '#f59e0b' },
  { range: '60-80%', count: 120, color: '#ef4444' },
  { range: '80-100%', count: 45, color: '#7f1d1d' },
];

const modelEpochs = [
  { epoch: 1, accuracy: 0.65, loss: 0.82 },
  { epoch: 2, accuracy: 0.72, loss: 0.61 },
  { epoch: 3, accuracy: 0.78, loss: 0.45 },
  { epoch: 4, accuracy: 0.84, loss: 0.32 },
  { epoch: 5, accuracy: 0.89, loss: 0.21 },
  { epoch: 6, accuracy: 0.92, loss: 0.15 },
];

const campaignROI = [
  { name: 'Email A/B', roi: 4.2, engagement: 85 },
  { name: 'Push Notify', roi: 2.8, engagement: 62 },
  { name: 'Loyalty Tier', roi: 5.6, engagement: 91 },
  { name: 'Discount V2', roi: 1.5, engagement: 40 },
];

// --- Modules ---

export function ChurnForecastEngine() {
  const [distribution, setDistribution] = React.useState<any[]>(churnDistribution)

  React.useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE_URL}/api/v1/customers/dashboard-kpis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success && json.data.total_customers > 0) {
          // Simulate buckets since backend doesn't provide them yet
          // In a real app, I'd add a "histogram" endpoint
          const avg = json.data.avg_churn_prob
          setDistribution([
            { range: '0-20%', count: Math.floor(json.data.total_customers * (1-avg) * 0.4), color: '#10b981' },
            { range: '20-50%', count: Math.floor(json.data.total_customers * (1-avg) * 0.6), color: '#3b82f6' },
            { range: '50-80%', count: Math.floor(json.data.high_risk_customers * 0.7), color: '#f59e0b' },
            { range: '80-100%', count: Math.floor(json.data.high_risk_customers * 0.3), color: '#ef4444' },
          ])
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchDistribution()
  }, [])

  const handleIntervene = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/intervene`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) alert("Bulk Intervention Deployed Successfully!")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Neural Decay Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="range" stroke="#475569" fontSize={10} fontWeight="900" />
                <YAxis stroke="#475569" fontSize={10} fontWeight="900" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.4} stroke={entry.color} strokeWidth={2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-rose-500/5">
          <h3 className="text-sm font-black text-rose-500/50 uppercase tracking-[0.3em] mb-6">High Risk Alerts</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">IDENTITY_NODE_{i*1024}</p>
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">CRITICAL RISK DETECTED</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handleIntervene}
            className="w-full mt-8 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_-5px_rgba(244,63,94,0.3)] hover:scale-105 transition-all"
          >
            Initiate Bulk Intervention
          </button>
        </div>
      </div>
    </div>
  )
}

export function ModelTrainingCenter() {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Precision', value: '94.2%', color: 'text-blue-400' },
          { label: 'Recall', value: '88.7%', color: 'text-purple-400' },
          { label: 'F1 Score', value: '91.4%', color: 'text-emerald-400' },
          { label: 'ROC-AUC', value: '0.965', color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Training Convergence Vector</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loss</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={modelEpochs}>
              <defs>
                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="epoch" stroke="#475569" fontSize={10} fontWeight="900" />
              <YAxis stroke="#475569" fontSize={10} fontWeight="900" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
              <Area type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={3} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function CampaignControlBase() {
  const [campaigns, setCampaigns] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) setCampaigns(json.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchCampaigns()
    
    // Poll for campaign progress every 3 seconds if there are active campaigns
    const interval = setInterval(() => {
      const hasActive = campaigns.some(c => c.progress < 100);
      if (hasActive) {
        fetchCampaigns();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [campaigns.length]) // Only restart polling when list length changes

  const handleInitializeStrategy = async () => {
    const name = prompt("Enter Strategy Name:", "New Neural Outreach")
    if (!name) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/campaigns`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      })
      if (res.ok) fetchCampaigns()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
           <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Active Neural Campaigns</h3>
           <div className="space-y-6">
              {campaigns.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No active neural strategies. Initialize a new one below.</p>
              ) : (
                campaigns.map((c, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white tracking-tight">{c.name}</p>
                        <p className="text-[10px] font-black uppercase text-slate-500">{c.status}</p>
                      </div>
                      <p className="text-xs font-black text-white">{c.progress}%</p>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${c.color || 'bg-blue-500'} shadow-[0_0_10px_rgba(59,130,246,0.3)]`} style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                ))
              )}
           </div>
           <button 
            onClick={handleInitializeStrategy}
            className="w-full mt-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all shadow-lg active:scale-95"
          >
              Initialize New Strategy
           </button>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
           <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Campaign Efficiency Index</h3>
           <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaigns.length > 0 ? campaigns.map(c => ({ name: c.name, roi: (c.progress / 20) + 1 })) : campaignROI} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} fontWeight="900" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="roi" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  )
}
