"use client"

import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { 
  FileText, Download, ShieldCheck, Cpu, 
  TrendingUp, BarChart3, ChevronRight, RefreshCcw, 
  X, User, Target, DollarSign, AlertCircle, Zap
} from 'lucide-react'
import { API_BASE_URL } from '../lib/config'

// --- Mock Data ---
const trendData = [
  { name: 'Jan', churn: 4000, revenue: 2400 },
  { name: 'Feb', churn: 3000, revenue: 1398 },
  { name: 'Mar', churn: 2000, revenue: 9800 },
  { name: 'Apr', churn: 2780, revenue: 3908 },
  { name: 'May', churn: 1890, revenue: 4800 },
  { name: 'Jun', churn: 2390, revenue: 3800 },
];

const segmentData = [
  { name: 'Enterprise', value: 400 },
  { name: 'Mid-Market', value: 300 },
  { name: 'SME', value: 300 },
  { name: 'Startup', value: 200 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

interface DeepDiveItem {
  id: number;
  name: string;
  email: string;
  churn_risk: number;
  uplift_score: number;
  revenue: number;
  priority: string;
  category: string;
  action: string;
  roi_impact: number;
}

interface DeepDiveSummary {
  total_analyzed: number;
  total_roi_potential: number;
  critical_nodes: number;
}

export default function BIReportView() {
  const [verifying, setVerifying] = useState(true)
  const [handshakeStep, setHandshakeStep] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [deepDiveData, setDeepDiveData] = useState<{ items: DeepDiveItem[], summary: DeepDiveSummary } | null>(null)

  useEffect(() => {
    const steps = [
      "ESTABLISHING SECURE BI PROTOCOL...",
      "AUTHENTICATING DATA SHARD ACCESS...",
      "SYNCHRONIZING NEURAL CLUSTERS...",
      "DECRYPTING STRATEGIC VECTORS..."
    ];

    if (verifying) {
      const interval = setInterval(() => {
        setHandshakeStep(prev => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setTimeout(() => setVerifying(false), 500);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
      return () => clearInterval(interval);
    }
  }, [verifying]);

  const fetchDeepDive = async () => {
    setLoading(true);
    setIsModalOpen(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/deep-dive`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setDeepDiveData(json.data);
      }
    } catch (err) {
      console.error("Deep dive fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = () => {
    setVerifying(true);
    setHandshakeStep(0);
  };

  const handleExport = () => {
    if (!deepDiveData) {
      alert("Please run Deep-Dive Analysis first to generate a full Strategic Brief.");
      return;
    }
    setIsExporting(true);
    // Give UI time to render the 'Exporting' state before blocking print call
    setTimeout(() => {
      window.print();
      // Reset after a small delay since window.print() is blocking
      setTimeout(() => setIsExporting(false), 1000);
    }, 500);
  };

  if (verifying) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center bg-[#070a13] text-white">
        <div className="relative mb-8">
           <div className="w-24 h-24 border-t-4 border-blue-500 rounded-full animate-spin shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
           <ShieldCheck className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center font-mono">
           <p className="text-blue-400 font-bold tracking-[0.3em] text-[10px] mb-2 uppercase">Neural Link Handshake</p>
           <p className="text-white text-xs font-black animate-pulse uppercase tracking-wider">
             {[
               "ESTABLISHING SECURE BI PROTOCOL...",
               "AUTHENTICATING DATA SHARD ACCESS...",
               "SYNCHRONIZING NEURAL CLUSTERS...",
               "DECRYPTING STRATEGIC VECTORS..."
             ][handshakeStep]}
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 py-10 space-y-10 animate-in fade-in zoom-in-95 duration-700 max-w-[1600px] mx-auto relative print:m-0 print:p-8 print:bg-white print:text-black">
      {/* Print-Specific Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .glass-card {
            background: white !important;
            border: 1px solid #ddd !important;
            color: black !important;
            box-shadow: none !important;
          }
          .no-print, .print-hidden {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          header button, nav, .sidebar {
            display: none !important;
          }
          .recharts-surface {
            filter: grayscale(0.2) !important;
          }
          h2, h3, h4, p, span, h1 {
            color: black !important;
          }
          .bg-blue-600 {
             background-color: #2563eb !important;
             color: white !important;
             -webkit-print-color-adjust: exact;
          }
          .bg-emerald-600, .bg-emerald-500 {
             background-color: #059669 !important;
             -webkit-print-color-adjust: exact;
          }
          .bg-rose-600, .bg-rose-500 {
             background-color: #e11d48 !important;
             -webkit-print-color-adjust: exact;
          }
          .text-blue-600, .text-blue-500, .text-blue-400 { color: #2563eb !important; }
          .text-emerald-500, .text-emerald-400 { color: #059669 !important; }
          .text-rose-500, .text-rose-400 { color: #e11d48 !important; }
          
          .print-break-before {
            page-break-before: always;
          }
          .print-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
        .print-only { display: none; }
      `}</style>

      {/* Strategic Report Cover (Print Only) */}
      <div className="print-only mb-20">
        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-black uppercase">Strategic Intelligence Brief</h1>
            <p className="text-xl font-bold text-blue-600 mt-4 tracking-widest uppercase">Neural Operations // Confidential // V2.4</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-500 uppercase">Generated On</p>
            <p className="text-sm font-bold text-black">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <header className="flex justify-between items-center mb-10 no-print">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
            <BarChart3 className="w-10 h-10 text-blue-500" />
            Intelligence Report <span className="text-blue-600">V2.4</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">Strategic Intelligence Engine // Secure Session</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleSync}
             className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
           >
              <RefreshCcw className="w-4 h-4 text-blue-400" />
              Sync Base
           </button>
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
           >
              <Download className="w-4 h-4" />
              Export Brief
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-card p-10 rounded-[2.5rem] border border-white/5">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h3 className="text-xl font-black text-white">Churn vs Revenue Resonance</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">6-Month Macro Analysis</p>
                 </div>
                 <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                 </div>
              </div>
              <div className="h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                       <defs>
                          <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                       <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="900" />
                       <YAxis stroke="#475569" fontSize={10} fontWeight="900" />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                         itemStyle={{ fontWeight: 'bold' }}
                       />
                       <Area type="monotone" dataKey="churn" stroke="#3b82f6" fillOpacity={1} fill="url(#colorChurn)" strokeWidth={3} isAnimationActive={false} />
                       <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" isAnimationActive={false} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-emerald-500/5">
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Positive Vector</h4>
                 <p className="text-xs text-slate-300 leading-relaxed font-bold">
                    Net Revenue Retention has surged to <span className="text-white">104.2%</span>. Higher engagement in the Enterprise segment is successfully offsetting churn in lower tiers.
                 </p>
              </div>
              <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-amber-500/5">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Risk Concentration</h4>
                 <p className="text-xs text-slate-300 leading-relaxed font-bold">
                    The "SME" segment shows <span className="text-white">12.4%</span> higher churn elasticity this month. Recommend immediate campaign deployment for SME accounts with low activity.
                 </p>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8 w-full">Tier Composition</h3>
              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={segmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" isAnimationActive={false}>
                          {segmentData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                 {segmentData.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                       <span className="text-[10px] font-black text-slate-400 uppercase">{s.name}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-blue-600/10 scale-100 hover:scale-[1.02] transition-transform duration-500 no-print">
              <div className="flex gap-4 items-start mb-6">
                 <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                    <Cpu className="w-6 h-6 text-white" />
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-white leading-tight">Neural Briefing</h4>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">AI Generated Analysis</p>
                 </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic mb-8">
                "We have detected a strong synergy between the new Campaign sequences and the high-value Enterprise group. Strategic realignment of retention resources towards this segment will yield an estimated 15% ROI improvement."
              </p>
              <button 
                onClick={fetchDeepDive}
                className="w-full flex justify-between items-center py-4 px-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest group overflow-hidden relative shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                 <span className="relative z-10">Deep-Dive Analysis</span>
                 <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                 <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
              </button>
           </div>
        </div>
      </div>

      {/* Main Report for Printing (Visible during print, hidden during UI if modal closed) */}
      <div className={`print-break-before ${deepDiveData ? 'block' : 'hidden no-print'}`}>
        {deepDiveData && (
           <div className="space-y-10 pt-10">
              <div className="print-only mb-10 h-1 bg-slate-100" />
              <h3 className="text-3xl font-black text-black tracking-tighter border-l-8 border-blue-600 pl-6 uppercase">Strategic Deep-Dive Assessment</h3>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="p-8 border-2 border-slate-100 rounded-3xl bg-slate-50">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">ROI Opportunity</p>
                  <p className="text-4xl font-black text-blue-600">${deepDiveData.summary.total_roi_potential.toLocaleString()}</p>
                </div>
                <div className="p-8 border-2 border-slate-100 rounded-3xl bg-slate-50">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Identity Cluster</p>
                  <p className="text-4xl font-black text-black">{deepDiveData.summary.total_analyzed}</p>
                </div>
                <div className="p-8 border-2 border-slate-100 rounded-3xl bg-slate-50">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Risk Factor</p>
                  <p className="text-4xl font-black text-rose-600">{deepDiveData.summary.critical_nodes} Nodes</p>
                </div>
              </div>

              <div className="print-break-inside-avoid">
                <table className="w-full text-left border-collapse mt-10">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest">Target Name</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Risk %</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Neural Status</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Protocol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deepDiveData.items.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-4">
                          <p className="text-sm font-bold text-black">{item.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold">{item.email}</p>
                        </td>
                        <td className="py-4 text-sm font-bold text-black text-right">{Math.round(item.churn_risk * 100)}%</td>
                        <td className="py-4 text-right">
                          <span className="text-[9px] font-black px-2 py-1 bg-slate-100 rounded uppercase border border-slate-200">{item.priority}</span>
                        </td>
                        <td className="py-4 text-right text-[10px] font-black uppercase tracking-tighter text-blue-600">{item.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20 no-print">
           <div className="absolute inset-0 bg-[#070a13]/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
           <div className="glass-card w-full max-w-6xl max-h-[90vh] rounded-[3rem] border border-white/10 overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95 duration-500 shadow-[0_0_100px_rgba(59,130,246,0.15)]">
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                 <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                       <Target className="w-8 h-8 text-blue-500" />
                       Strategic Deep-Dive Analysis
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Neural Node: Segment Allocation Matrix</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                 {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center">
                       <RefreshCcw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Aggregating Strategic Clusters...</p>
                    </div>
                 ) : deepDiveData ? (
                    <div className="space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-6 bg-blue-600/10 rounded-3xl border border-blue-500/20">
                             <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Total ROI Potential</p>
                             <p className="text-3xl font-black text-white">${deepDiveData.summary.total_roi_potential.toLocaleString()}</p>
                          </div>
                          <div className="p-6 bg-rose-600/10 rounded-3xl border border-rose-500/20">
                             <p className="text-[10px] font-black text-rose-400 uppercase mb-2">Critical Risk Nodes</p>
                             <p className="text-3xl font-black text-white">{deepDiveData.summary.critical_nodes}</p>
                          </div>
                          <div className="p-6 bg-emerald-600/10 rounded-3xl border border-emerald-500/20">
                             <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">Analyzed Identities</p>
                             <p className="text-3xl font-black text-white">{deepDiveData.summary.total_analyzed}</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Prioritized Strategic Map</h4>
                          <div className="grid grid-cols-1 gap-4">
                             {deepDiveData.items.map((item) => (
                                <div key={item.id} className="group p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all flex flex-wrap lg:flex-nowrap justify-between items-center gap-6">
                                   <div className="flex items-center gap-6 min-w-[250px]">
                                      <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center font-black text-blue-400 border border-blue-500/10 group-hover:scale-110 transition-transform">
                                         {item.name.charAt(0)}
                                      </div>
                                      <div>
                                         <p className="text-lg font-black text-white">{item.name}</p>
                                         <p className="text-[10px] text-slate-500 font-bold">{item.email}</p>
                                      </div>
                                   </div>

                                   <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                                      <div>
                                         <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Risk Profile</p>
                                         <div className="flex items-center gap-2">
                                            <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                               <div className={`h-full ${item.churn_risk > 0.7 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${item.churn_risk * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-black text-white">{Math.round(item.churn_risk * 100)}%</span>
                                         </div>
                                      </div>
                                      <div>
                                         <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Neural Priority</p>
                                         <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                                            item.priority === 'SOVEREIGN_HOLD' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                            item.priority === 'REVENUE_GUARD' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                         }`}>{item.priority}</span>
                                      </div>
                                      <div>
                                         <p className="text-[9px] font-black text-slate-600 uppercase mb-1">ROI Impact</p>
                                         <span className="text-xs font-black text-emerald-400">+${item.roi_impact}</span>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Active Action</p>
                                         <p className="text-[10px] font-black text-white uppercase tracking-tighter">{item.action}</p>
                                      </div>
                                   </div>
                                   
                                   <button className="p-4 bg-white/5 rounded-2xl hover:bg-blue-600 transition-all text-slate-500 hover:text-white group-hover:translate-x-1">
                                      <ChevronRight className="w-5 h-5" />
                                   </button>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center py-20">
                       <Zap className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                       <p className="text-slate-500 font-bold uppercase tracking-widest">No Strategic Assets Identified</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
      {isExporting && (
        <div className="fixed bottom-10 right-10 z-[200] glass-card p-6 pr-10 rounded-2xl border border-blue-500/30 flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 no-print">
           <div className="p-3 bg-blue-600 rounded-xl animate-pulse">
              <Download className="w-5 h-5 text-white" />
           </div>
           <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Neural Link Active</p>
              <p className="text-sm font-black text-white">Generating Strategic Brief...</p>
           </div>
        </div>
      )}
    </div>
  );
}
