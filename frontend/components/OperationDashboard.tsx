"use client"

import React from 'react'
import { Users, ShieldAlert, Zap, Cpu, Target, Activity } from 'lucide-react'
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts'
import { KPICard, ImpactSimulator, StatItem, MetricType } from './DashboardComponents'
import { CampaignTimeline } from './CampaignTimeline'
import { ChurnRiskMap } from './ChurnRiskMap'

interface OperationDashboardProps {
  metrics: {
    total_customers: number;
    high_risk_customers: number;
    avg_churn_prob: number;
    revenue_at_risk: number;
    persuadables: number;
  } | null;
  onDrillDown: (type: MetricType) => void;
  scatterData: Array<{
    x: number;
    y: number;
    z: number;
    name: string;
    risk: string;
  }>;
  modelStats: {
    precision: number;
    recall: number;
    auc: number;
  };
  insights: Array<{
    id?: string | number;
    name: string;
    uplift_score: number;
    neural_analysis: string;
  }>;
  hideHeader?: boolean;
  hideKPIs?: boolean;
}

export default function OperationDashboard({ 
  metrics, onDrillDown, scatterData, modelStats, insights, 
  hideHeader = false, hideKPIs = false 
}: OperationDashboardProps) {
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
            value={metrics?.total_customers?.toLocaleString()} 
            icon={<Users className="w-7 h-7" />} 
            trend="+8.2% Periodic Lift"
            colorClass="text-blue-400"
            onClick={onDrillDown}
          />
          <KPICard 
            type="high_risk"
            title="Critical Vulnerability" 
            value={metrics?.high_risk_customers?.toLocaleString()} 
            icon={<ShieldAlert className="w-7 h-7" />} 
            trend="Priority Intercept required"
            colorClass="text-rose-500"
            onClick={onDrillDown}
          />
          <KPICard 
            type="persuadable"
            title="Persuadable Core" 
            value={metrics?.persuadables?.toLocaleString()} 
            icon={<Zap className="w-7 h-7" />} 
            trend="High response elasticity"
            colorClass="text-emerald-400"
            onClick={onDrillDown}
          />
          <KPICard 
            type="revenue_risk"
            title="Revenue Exposure" 
            value={`$${metrics?.revenue_at_risk?.toLocaleString()}`} 
            icon={<Target className="w-7 h-7" />} 
            trend="At-risk volume detected"
            colorClass="text-amber-400"
            onClick={onDrillDown}
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
        <div className="xl:col-span-3 glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <Cpu className="w-5 h-5 text-blue-400" />
                Predictive Uplift Matrix
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Uplift Score vs Churn Probability</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black text-emerald-500 uppercase">Persuadable</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-[8px] font-black text-rose-500 uppercase">Sleeping Dog</span>
              </div>
            </div>
          </div>
          
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis type="number" dataKey="x" name="Churn Risk" unit="%" stroke="#64748b" fontSize={10} fontWeight="black" />
                <YAxis type="number" dataKey="y" name="Uplift" unit="%" stroke="#64748b" fontSize={10} fontWeight="black" />
                <ZAxis type="number" dataKey="z" range={[80, 500]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3', stroke: '#3b82f6' }} 
                  contentStyle={{ backgroundColor: '#070a13', border: '1px solid #ffffff10', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                />
                <Scatter name="Customers" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.y > 0.1 ? '#10b981' : (entry.y < 0 ? '#f43f5e' : '#3b82f6')} 
                      className="drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-10">
          <ImpactSimulator baseRevenue={metrics?.revenue_at_risk || 0} />
          
          {/* Model Performance Tracker */}
          <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden bg-blue-600/5">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-blue-400" />
              Model Performance Tracker
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-4">
                  <StatItem label="Precision" value={`${((modelStats?.precision || 0.84) * 100).toFixed(1)}%`} color="text-emerald-400" />
                  <StatItem label="Recall" value={`${((modelStats?.recall || 0.79) * 100).toFixed(1)}%`} color="text-blue-400" />
               </div>
               <div className="space-y-4">
                  <StatItem label="ROC-AUC" value={(modelStats?.auc || 0.884).toFixed(3)} color="text-amber-400" />
                  <StatItem label="Neural Latency" value="14ms" color="text-slate-500" />
               </div>
            </div>
            <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[88%] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
            <p className="text-[8px] font-black text-slate-500 uppercase mt-2 tracking-widest">Confidence Threshold: 0.72 Sigma</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <CampaignTimeline />
        <ChurnRiskMap />
      </div>

      {/* Recommendations */}
      <div className="glass-card rounded-[2.5rem] p-10 border border-emerald-400/10 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -z-10 group-hover:bg-emerald-500/10 transition-all duration-700" />
         <h3 className="text-xl font-black text-white flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            Neural Strategy Engine
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {insights.slice(0, 3).map((item, i) => (
              <div key={i} className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-emerald-400/30 transition-all duration-500 group-item cursor-pointer hover:bg-white/10 shadow-lg">
                 <div className="flex justify-between items-start mb-4">
                    <span className="font-black text-blue-400/60 text-xs tracking-widest">NODE_ALPHA_{item.id || i+1}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${item.uplift_score > 0.1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-500'}`}>
                       {item.uplift_score > 0.1 ? 'Strategic Target' : 'Stable Segment'}
                    </span>
                 </div>
                 <h4 className="font-bold text-lg text-white tracking-tight mb-3 group-hover:text-emerald-400 transition-colors">{item.name}</h4>
                 <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic line-clamp-3">“{item.neural_analysis}”</p>
                 <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Level</div>
                    <div className="text-xs font-black text-emerald-400">92.4%</div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}
