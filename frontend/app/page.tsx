"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { 
  Activity, Users, AlertCircle, TrendingUp, BarChart3, 
  Settings, Target, LogOut, ChevronRight, Info, 
  ArrowUpRight, ArrowDownRight, Zap, ShieldCheck, ShieldAlert,
  Database, Briefcase, Search, X, Cpu, Globe, 
  BarChart as BarChartIcon, MousePointer2, LayoutDashboard,
  Calendar, Layers, Map, Bell, FileText, Layout, Mail
} from 'lucide-react'
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';

import { 
  AlertTicker, DrillDownModal, NavItem, 
  StatItem, KPICard, MetricType, CustomerData 
} from '../components/DashboardComponents';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard';
import OperationDashboard from '../components/OperationDashboard';
import DataStreamHub from '../components/DataStreamHub';
import BaseConfigView from '../components/BaseConfigView';
import { 
  ChurnForecastEngine, 
  UpliftROIMatrix,
  RetentionROIView
} from '../components/DashboardModules';
import CampaignManager from '../components/CampaignManager';
import IdentityBaseView from '../components/IdentityBaseView';
import BIReportView from '../components/BIReportView';
import { API_BASE_URL } from '../lib/config';


// --- Interfaces ---

interface Insight {
  id: number;
  customer_id: string;
  name: string;
  email: string;
  churn_probability: number;
  uplift_score: number;
  persuadability_score: number;
  geography_risk_score: number;
  retention_probability: number;
  expected_recovery: number;
  communication_channel: string;
  revenue: number;
  financial_risk: number;
  neural_analysis: string;
}

interface DashboardMetrics {
  total_customers: number;
  high_risk_customers: number;
  avg_churn_prob: number;
  revenue_at_risk: number;
  persuadables: number;
  nrr?: number;
  monthly_churn?: number;
  annual_churn?: number;
  avg_ltv?: number;
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
interface ModelStats {
  roc_auc: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_date: string;
  feature_importance: Array<{ feature: string; score: number }>;
}

// --- Main Component ---

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [modelStats, setModelStats] = useState<ModelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'operation' | 'executive'>('operation');
  const [drillDown, setDrillDown] = useState<{ isOpen: boolean, title: string, data: CustomerData[], type: MetricType }>({
    isOpen: false, title: '', data: [], type: 'total'
  });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [alerts, setAlerts] = useState<{type: string, details: string}[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [execMetrics, setExecMetrics] = useState<ExecutiveMetrics | null>(null);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  }

  const fetchDrillDown = async (type: MetricType) => {
    const token = localStorage.getItem('token');
    const apiBase = API_BASE_URL;
    let endpoint = '/api/v1/customers/';
    let title = 'Global Data Cluster';

    if (type === 'high_risk') {
      endpoint = '/api/v1/customers/high-risk';
      title = 'Critical Churn Vector';
    } else if (type === 'revenue_risk') {
      endpoint = '/api/v1/customers/revenue-at-risk';
      title = 'Revenue Exposure Analysis';
    } else if (type === 'persuadable') {
      endpoint = '/api/v1/customers/uplift-insights';
      title = 'Persuadable Segment Matrix';
    }

    try {
      const res = await fetch(`${apiBase}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data.items || json.data;
        setDrillDown({ isOpen: true, title, data, type });
      }
    } catch (err) {
      console.error(err);
    }
  }

  const fetchExecutiveData = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/executive-neural-stream`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setExecMetrics(json);
    } catch (err) {
      console.error("Executive fetch failed", err);
    }
  };

  const loadInitialData = useCallback(async () => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    
    if (!token) {
      window.location.href = '/login'
      return
    }

    if (role === 'super_admin') {
      window.location.href = '/super-admin'
      return
    }

    if (role === 'admin') {
      window.location.href = '/admin'
      return
    }

    try {
      const apiBase = API_BASE_URL
      const [kpiRes, insightRes, statRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/customers/dashboard-kpis`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/customers/uplift-insights`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/analytics/model-stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (kpiRes.status === 401) return handleLogout();

      const kpiJson = await kpiRes.json();
      const insightJson = await insightRes.json();
      const statJson = await statRes.json();

      if (kpiJson.success && kpiJson.data) {
        setMetrics(kpiJson.data);
      }
      if (insightJson.success && insightJson.data) {
        setInsights(insightJson.data);
      }
      if (statJson.success && statJson.data) {
        setModelStats(statJson.data);
      }

      // Fetch Alerts
      const alertRes = await fetch(`${apiBase}/api/v1/analytics/alerts`, { headers: { 'Authorization': `Bearer ${token}` } });
      const alertJson = await alertRes.json();
      if (alertJson.success) {
        setAlerts(alertJson.data);
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    if (viewMode === 'executive') fetchExecutiveData();
    
    // Poll for ALL data every 10 seconds for sync
    const interval = setInterval(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadInitialData();
            if (viewMode === 'executive') fetchExecutiveData();
            
            fetch(`${API_BASE_URL}/api/v1/analytics/alerts`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(json => { if (json.success) setAlerts(json.data); });
        }
    }, 10000);
    return () => clearInterval(interval);
  }, [loadInitialData, viewMode]);


  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070a13] text-white">
      <div className="relative">
        <Cpu className="w-16 h-16 text-blue-500 animate-[spin_4s_linear_infinite]" />
        <Zap className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <span className="font-black tracking-[0.4em] text-xs mt-8 animate-pulse text-blue-400">NEURAL SYNC IN PROGRESS</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#070a13] text-white font-sans overflow-hidden selection:bg-blue-500/30 relative">
      {/* Sidebar - Mission Control Navigation */}
      <aside className="w-80 glass border-r border-white/5 flex flex-col hidden xl:flex">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">RETENTION</h1>
            <h1 className="text-xl font-black tracking-tighter text-blue-500 leading-none">BRAIN</h1>
          </div>
        </div>
        
        <div className="px-6 py-8 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
          <section>
            <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">View Orientation</p>
            <nav className="space-y-1">
              <NavItem icon={<Activity />} label="Operation Mode" active={viewMode === 'operation'} onClick={() => {setViewMode('operation'); setActiveTab('dashboard');}} />
              <NavItem icon={<Briefcase />} label="Executive Mode" active={viewMode === 'executive'} onClick={() => {setViewMode('executive'); setActiveTab('dashboard');}} />
            </nav>
          </section>

          {viewMode === 'operation' ? (
            <>

              <section>
                <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">System Operations</p>
                <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 space-y-4 animate-pulse-soft">
                   <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-blue-400">
                      <span>Server Alpha</span>
                      <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-blue-400" /> Online</span>
                   </div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[62%]" />
                   </div>
                   <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-slate-500">
                      <span>CPU LOAD: 14%</span>
                      <span>MEM: 4.2GB</span>
                   </div>
                </div>
              </section>

              <section>
                <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Mission Control</p>
                <nav className="space-y-1">
                  <NavItem icon={<LayoutDashboard />} label="Neural Hub" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                  <NavItem icon={<Users />} label="Identity Base" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
                  <NavItem icon={<AlertCircle />} label="Churn Forecast" active={activeTab === 'predictions'} onClick={() => setActiveTab('predictions')} />
                  <NavItem icon={<Mail />} label="Campaign Manager" active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} />
                  <NavItem icon={<Bell />} label="Alert Stream" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                  <div className="my-8 h-px bg-white/5 mx-4" />
                  <div className="mb-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Compute Layer</div>
                  <NavItem icon={<Database />} label="Data Stream" active={activeTab === 'data'} onClick={() => setActiveTab('data')} />
                  <NavItem icon={<Settings />} label="Base Config" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>
              </section>
            </>
          ) : (
            <section>
              <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Strategic Suite</p>
              <nav className="space-y-1">
                <NavItem icon={<BarChart3 />} label="Executive Brief" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavItem icon={<Users />} label="LTV Segments" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
                <NavItem icon={<FileText />} label="BI Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                <NavItem icon={<TrendingUp />} label="Retention ROI" active={activeTab === 'retention-roi'} onClick={() => setActiveTab('retention-roi')} />
                <NavItem icon={<Target />} label="Uplift & ROI Matrix" active={activeTab === 'uplift-roi'} onClick={() => setActiveTab('uplift-roi')} />
                <div className="my-8 h-px bg-white/5 mx-4" />
                <div className="mb-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Corporate</div>
                <NavItem icon={<Database />} label="Resource Control" active={activeTab === 'data'} onClick={() => setActiveTab('data')} />
                <NavItem icon={<Settings />} label="Global Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              </nav>
            </section>
          )}
        </div>

        <div className="p-8 border-t border-white/5">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 text-red-500 font-black text-xs uppercase tracking-[0.2em] border border-red-500/20 hover:bg-red-500/10 transition-all outline-none"
           >
             <LogOut className="w-4 h-4" /> Terminate Link
           </button>
        </div>
      </aside>

      {/* Main Mission Control */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative p-0 grid-background">
        {/* Real-time Ticker */}
        <AlertTicker alerts={alerts.length > 0 ? alerts : [
          { type: 'SYSTEM', details: "Neural Link Establishing..." },
          { type: 'SYSTEM', details: "Ready for identity ingestion" }
        ]} />

        {/* Global Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[180px] -z-10 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

        <header className="px-10 py-8 flex justify-between items-center sticky top-0 z-20 glass border-b border-white/5">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">
                {viewMode === 'operation' ? 'AI Command Center' : 'Executive Control Panel'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Link: STABLE // Latency: 12ms</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Mode Toggler Toggle */}
             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                <button 
                  onClick={() => setViewMode('operation')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'operation' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Operations
                </button>
                <button 
                  onClick={() => setViewMode('executive')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'executive' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Executive
                </button>
             </div>
              <div className="h-10 w-px bg-white/10 hidden md:block mx-2" />
              <div 
                onClick={() => setActiveTab('settings')}
                className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-all group"
              >
                <Settings className="w-5 h-5 text-blue-400 group-hover:rotate-90 transition-transform" />
              </div>
          </div>
        </header>

        <div className="w-full">
          {activeTab === 'dashboard' ? (
            viewMode === 'operation' ? (
                <OperationDashboard 
                  metrics={metrics} 
                  onDrillDown={fetchDrillDown} 
                  insights={insights}
                />
            ) : (
              <ExecutiveDashboard 
                metrics={metrics} 
                executiveData={execMetrics} 
                onDrillDown={fetchDrillDown}
              />
            )
          ) : activeTab === 'customers' ? (
            <IdentityBaseView
              insights={insights}
              metrics={metrics}
              onDrillDown={fetchDrillDown}
            />
          ) : activeTab === 'predictions' ? (
            <div className="px-10 py-10 space-y-10 animate-in zoom-in-95 duration-500">
               <h2 className="text-3xl font-black mb-6 flex items-center gap-4">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                  Churn Forecast Engine
               </h2>
               <ChurnForecastEngine />
            </div>
          ) : activeTab === 'campaigns' ? (
            <div className="px-10 py-10 space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                     <Mail className="w-8 h-8 text-blue-400" />
                     Campaign Manager
                   </h2>
                   <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.4em] mt-2">
                     Email Retention Outreach · SMTP Powered
                   </p>
                 </div>
               </div>
               <CampaignManager />
            </div>
          ) : activeTab === 'notifications' ? (
            <div className="px-10 py-10 space-y-10 animate-in fade-in duration-500">
               <h2 className="text-3xl font-black mb-6 flex items-center gap-4">
                  <Bell className="w-8 h-8 text-rose-400" />
                  Tactical Alert Stream
               </h2>
               <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs p-10 text-center glass-card rounded-2xl">No recent alerts detected in the neural stream.</p>
                  ) : (
                    alerts.map((alert: any, i) => (
                      <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-6 items-start hover:border-blue-500/20 transition-all group">
                        <div className="text-[10px] font-black text-slate-500 font-mono mt-1">
                            {new Date(alert.created_at).toLocaleTimeString()}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`text-xs font-black uppercase tracking-widest ${alert.type === 'CHURN_RISK' ? 'text-rose-500' : 'text-blue-400'}`}>
                                    {alert.type}
                                </span>
                                <span className="text-[8px] font-bold px-2 py-0.5 bg-white/5 rounded text-slate-500 border border-white/5">PRIORITY: HIGH</span>
                            </div>
                            <p className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors uppercase tracking-tight">{alert.details}</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <ChevronRight className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="px-10 py-10 space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Global System Configuration</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.4em] mt-2">Strategic Neural Node Settings</p>
                  </div>
               </div>
               <BaseConfigView />
            </div>
          ) : activeTab === 'reports' ? (
            <BIReportView />
          ) : activeTab === 'retention-roi' ? (
            <RetentionROIView metrics={metrics} />
          ) : activeTab === 'uplift-roi' ? (
            <div className="px-10 py-10 space-y-10 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-4">
                <Target className="w-8 h-8 text-emerald-400" />
                Uplift & ROI Matrix
              </h2>
              <UpliftROIMatrix />
            </div>
          ) : activeTab === 'data' ? (
            <div className="px-0 py-10 space-y-10 animate-in fade-in duration-500">
               <div className="px-10 flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Intelligence Data Stream</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.4em] mt-2">Neural Ingestion Pipeline Control</p>
                  </div>
               </div>
               <DataStreamHub onRefresh={loadInitialData} />
            </div>
          ) : (
            <div className="px-10 py-20 flex flex-col items-center justify-center text-center">
               <div className="p-6 bg-white/5 rounded-3xl mb-8 border border-white/10">
                  <Settings className="w-12 h-12 text-slate-600 animate-[spin_10s_linear_infinite]" />
               </div>
               <h3 className="text-2xl font-black mb-2 uppercase tracking-widest">{activeTab} Interface</h3>
               <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Secure Terminal Connection Restricted</p>
            </div>
          )}
        </div>
      </main>

      {/* Drill-down Modal */}
      <DrillDownModal 
        isOpen={drillDown.isOpen}
        onClose={() => setDrillDown({ ...drillDown, isOpen: false })}
        title={drillDown.title}
        data={drillDown.data}
        type={drillDown.type}
      />
    </div>
  )
}
