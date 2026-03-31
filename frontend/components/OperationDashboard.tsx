"use client"

import React from 'react'
import { Users, ShieldAlert, Zap, Target, Globe, Cpu, ChevronRight } from 'lucide-react'
import { KPICard, MetricType } from './DashboardComponents'
import { API_BASE_URL } from '../lib/config'

interface OperationDashboardProps {
  metrics: {
    total_customers: number;
    high_risk_customers: number;
    avg_churn_prob: number;
    revenue_at_risk: number;
    persuadables: number;
    geography_risk?: number;
    retention_prob?: number;
  } | null;
  onDrillDown: (type: MetricType) => void;
  onRunDecisionEngine?: () => Promise<void>;
  insights: Array<{
    id: number;
    name: string;
    churn_probability: number;
    action_type?: string;
    campaign_type?: string;
    priority_score?: number;
    revenue: number;
    neural_analysis: string;
  }>;
  hideHeader?: boolean;
  hideKPIs?: boolean;
}

export default function OperationDashboard({ 
  metrics, onDrillDown, onRunDecisionEngine, insights, 
  hideHeader = false, hideKPIs = false 
}: OperationDashboardProps) {
  const [deploying, setDeploying] = React.useState(false)

  const handleDeployCampaign = async () => {
    setDeploying(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/intervene`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        alert(`Neural Strategy Deployed! ROI Potential: ${(metrics?.revenue_at_risk || 0).toLocaleString()} targeted across ${json.intervened_count || 'Neural Grid'}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className={`${hideHeader ? 'px-0 py-0' : 'px-10 py-10'} space-y-12 w-full max-w-[1700px] mx-auto relative`}>
      {/* Background Mission Control Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Operation Mode Grid */}
      {!hideKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <KPICard 
            type="total"
            title="Identity Census" 
            value={Math.round(metrics?.total_customers || 0).toLocaleString()} 
            icon={<Users className="w-7 h-7" />} 
            trend="+8.2% Periodic Lift"
            colorClass="text-blue-400"
            onClick={onDrillDown}
          />
          <KPICard 
            type="high_risk"
            title="Critical Vulnerability" 
            value={Math.round(metrics?.high_risk_customers || 0).toLocaleString()} 
            icon={<ShieldAlert className="w-7 h-7" />} 
            trend="Priority Intercept required"
            colorClass="text-rose-500"
            onClick={onDrillDown}
          />
          <KPICard 
            type="persuadable"
            title="Persuadable Core" 
            value={Math.round(metrics?.persuadables || 0).toLocaleString()} 
            icon={<Zap className="w-7 h-7" />} 
            trend="High response elasticity"
            colorClass="text-emerald-400"
            onClick={onDrillDown}
          />
          <KPICard 
            type="revenue_risk"
            title="Revenue Exposure" 
            value={`$${Math.round(metrics?.revenue_at_risk || 0).toLocaleString()}`} 
            icon={<Target className="w-7 h-7" />} 
            trend="At-risk volume detected"
            colorClass="text-amber-400"
            onClick={onDrillDown}
          />
          <KPICard 
            type="total"
            title="Geography Risk" 
            value={`${(metrics?.geography_risk || 0).toFixed(1)}%`} 
            icon={<Globe className="w-7 h-7" />} 
            trend="Global Geo Distribution"
            colorClass="text-indigo-400"
            onClick={onDrillDown}
          />
        </div>
      )}

      {/* Retention Decision Engine Controls */}
      <section className="glass rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-600/20 transition-all duration-700" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Cpu className="w-6 h-6 text-blue-400" />
              Retention Decision Engine
            </h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2 max-w-xl">
              Execute rule-based logic to determine the optimal retention strategy for each high-risk customer. Triggers automated workflows and task assignments.
            </p>
          </div>
          <button 
            disabled={deploying}
            onClick={onRunDecisionEngine}
            className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 transition-all ${
              deploying ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95'
            }`}
          >
            {deploying ? 'Executing Logic...' : 'Run Decision Engine'}
            <Zap className={`w-4 h-4 ${deploying ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </section>

      {/* High Priority Actions Section */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              High Priority Intercepts
            </h3>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-1">Top actions prioritized by RDE priority score</p>
          </div>
          <button 
            onClick={() => onDrillDown('high_risk')}
            className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
          >
            View Full List //
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {insights.length > 0 ? (
            insights.filter(i => (i.priority_score || 0) > 0).sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0)).slice(0, 4).map((insight) => (
              <div key={insight.id} className="p-8 glass rounded-[2rem] border border-white/5 hover:border-blue-500/20 transition-all group relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[40px] font-black text-white/5 -z-10 group-hover:text-blue-500/5 transition-colors">
                    {insight.priority_score?.toFixed(0)}
                </div>
                
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-black text-blue-400">
                        {insight.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-white tracking-tight">{insight.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Factor: {(insight.churn_probability * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      insight.action_type === 'CALL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      insight.action_type === 'EMAIL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                      'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                      {insight.action_type || 'PENDING'}
                    </span>
                 </div>
                 
                 <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6">
                   <p className="text-[10px] text-slate-400 font-bold line-clamp-2 italic leading-relaxed uppercase tracking-tight">
                     {insight.neural_analysis || `Strategic Campaign: ${insight.campaign_type || 'Retention Default'}`}
                   </p>
                 </div>
                 
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Est. Revenue Risk</span>
                      <span className="text-xl font-black text-white tracking-tighter">${insight.revenue?.toLocaleString() || '0'}</span>
                    </div>
                    <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 text-blue-400">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass rounded-[2rem] border border-dashed border-white/10">
               <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-[pulse_3s_infinite]" />
               <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">No high-priority insights in the neural stream</p>
               <button onClick={onRunDecisionEngine} className="mt-6 px-8 py-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] hover:bg-blue-600/20 hover:scale-105 active:scale-95 transition-all outline-none">
                 Initialize Decision Layer
               </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
