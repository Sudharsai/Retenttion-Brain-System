"use client"

import React, { useMemo } from 'react'
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'
import { 
  TrendingUp, Users, DollarSign, Target, 
  ArrowUpRight, ArrowDownRight, Briefcase, 
  BarChart3, PieChart as PieChartIcon
} from 'lucide-react'

// --- Mock Data for Executive View ---
const churnTrendData = [
  { month: 'Oct', rate: 4.2, ltv: 1250 },
  { month: 'Nov', rate: 3.8, ltv: 1320 },
  { month: 'Dec', rate: 4.5, ltv: 1280 },
  { month: 'Jan', rate: 3.2, ltv: 1450 },
  { month: 'Feb', rate: 2.9, ltv: 1580 },
  { month: 'Mar', rate: 2.4, ltv: 1620 },
];

const roiData = [
  { name: 'Email Alpha', roi: 4.2, cost: 1200 },
  { name: 'Direct Beta', roi: 3.8, cost: 800 },
  { name: 'Social Gamma', roi: 5.5, cost: 2500 },
  { name: 'Neural Delta', roi: 7.2, cost: 1800 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

interface DashboardMetrics {
  total_customers: number;
  high_risk_customers: number;
  avg_churn_prob: number;
  revenue_at_risk: number;
  persuadables: number;
}

interface ExecutiveMetrics {
  metrics: {
    nrr: number;
    monthly_churn: number;
    annual_churn: number;
    avg_ltv: number;
    total_ltv: number;
    portfolio_revenue: number;
    revenue_at_risk: number;
    expected_roi: number;
    recovery_potential: number;
  };
  trajectories: {
    churn: number[];
    ltv: number[];
  };
}

export function ExecutiveDashboard({ 
  metrics, 
  executiveData 
}: { 
  metrics: DashboardMetrics | null;
  executiveData: ExecutiveMetrics | null;
}) {
  const chartData = useMemo(() => {
    if (!executiveData) return Array(6).fill(0).map((_, i) => ({ month: `M${i+1}`, rate: 0, ltv: 0 }));
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return executiveData.trajectories.churn.map((rate, i) => ({
      month: months[i] || `M${i+1}`,
      rate,
      ltv: executiveData.trajectories.ltv[i]
    }));
  }, [executiveData]);

  const exec = executiveData?.metrics;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 w-full max-w-[1700px] mx-auto relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-slate-400/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <ExecutiveKPICard 
          title="Net Retention Rate" 
          value={`${exec?.nrr || 0}%`} 
          trend={`${((exec?.nrr || 100) - 100).toFixed(1)}%`} 
          positive={(exec?.nrr || 0) >= 100}
          icon={<Briefcase className="w-6 h-6" />}
          color="text-blue-400"
        />
        <ExecutiveKPICard 
          title="Churn Rate (Avg)" 
          value={`${exec?.monthly_churn || 0}%`} 
          trend="Current Period" 
          positive={true}
          icon={<TrendingUp className="w-6 h-6" />}
          color="text-emerald-400"
        />
        <ExecutiveKPICard 
          title="Customer LTV" 
          value={`$${(exec?.avg_ltv || 0).toLocaleString()}`} 
          trend="+Projected" 
          positive={true}
          icon={<DollarSign className="w-6 h-6" />}
          color="text-indigo-400"
        />
        <ExecutiveKPICard 
          title="Campaign ROI" 
          value={`${(exec?.expected_roi || 0).toFixed(1)}%`} 
          trend="Strategy Forecast" 
          positive={true}
          icon={<Target className="w-6 h-6" />}
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Churn & LTV Trajectory</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Neural Prediction Stream</p>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLtv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="month" stroke="#94a6b8" fontSize={10} fontWeight="black" />
                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} fontWeight="black" tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} fontWeight="black" tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f17 slate-900', border: 'none', borderRadius: '16px' }} />
                <Area yAxisId="left" type="monotone" dataKey="ltv" stroke="#3b82f6" fill="url(#colorLtv)" strokeWidth={4} />
                <Area yAxisId="right" type="monotone" dataKey="rate" stroke="#10b981" fill="url(#colorChurn)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign ROI Analysis */}
        <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 shadow-xl hover:border-slate-500/20 transition-all duration-500">
           <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Campaign Efficiency Index</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">ROI by Retention Channel</p>
            </div>
            <div className="p-3 bg-amber-400/10 rounded-2xl">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" stroke="#94a6b8" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} fontWeight="black" width={100} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff02' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                />
                <Bar dataKey="roi" radius={[0, 12, 12, 0]} barSize={40}>
                  {roiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Insights Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2 glass-card p-8 rounded-[2rem] border border-white/5 flex flex-col justify-center">
            <div className="flex items-center gap-6">
               <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                  <TrendingUp className="w-10 h-10 text-emerald-400" />
               </div>
               <div>
                  <h4 className="text-2xl font-black text-white">$124,500 Estimated Recovery</h4>
                  <p className="text-sm text-slate-400 mt-1 font-medium italic">"Predictive interventions have safeguarded 12.4% of total ARR this quarter."</p>
               </div>
            </div>
         </div>
         <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-blue-600/5">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Strategic Advisory</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
               Focus retention efforts on the <span className="text-white font-bold">Neural Delta</span> segment. High LTV coupled with increasing churn elasticity suggests significant ROI potential from personalized treatment.
            </p>
         </div>
      </div>
    </div>
  )
}
interface ExecutiveKPICardProps {
  title: string;
  value: string | number;
  trend: string;
  positive: boolean;
  icon: React.ReactNode;
  color: string;
}

function ExecutiveKPICard({ title, value, trend, positive, icon, color }: ExecutiveKPICardProps) {
  return (
    <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-slate-500/20 transition-all duration-500 shadow-2xl">
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500 ${color}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-black px-3.5 py-2 rounded-full border shadow-sm ${
          positive ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'
        }`}>
          {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 group-hover:text-slate-300 transition-colors">{title}</p>
        <h3 className="text-5xl font-black text-white tracking-tighter group-hover:scale-[1.02] transition-transform duration-500">{value}</h3>
      </div>
      
      {/* Subtle Background Glow */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-full ${color.replace('text-', 'bg-')}`} />
    </div>
  )
}
