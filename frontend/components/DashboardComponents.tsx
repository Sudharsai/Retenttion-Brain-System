"use client"

import React from 'react'
import { 
  Users, AlertCircle, TrendingUp, BarChart3, 
  ChevronRight, Database, X, Zap, Cpu, MousePointer2 
} from 'lucide-react'

// --- Types ---
export type MetricType = 'total' | 'high_risk' | 'revenue_risk' | 'persuadable';

export interface CustomerData {
  id: string | number;
  name: string;
  email: string;
  churn_probability?: number;
  uplift_score?: number;
  revenue?: number;
  revenue_at_risk?: number;
  neural_analysis?: string;
  persuadability_score?: number;
  geography_risk_score?: number;
  retention_probability?: number;
  expected_recovery?: number;
  communication_channel?: string;
}

// --- Sub-components ---

export function AlertTicker({ alerts }: { alerts: { type: string, details: string }[] }) {
  return (
    <div className="bg-blue-600/5 border-y border-white/5 py-2.5 overflow-hidden whitespace-nowrap relative backdrop-blur-sm">
      <div className="flex gap-12 animate-marquee inline-block">
        {alerts.map((alert, i) => (
          <span key={i} className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${alert.type === 'CHURN_RISK' ? 'bg-rose-500' : 'bg-blue-500'} animate-[pulse_2s_infinite] shadow-[0_0_8px_rgba(59,130,246,0.8)]`} />
            <span className="opacity-50">{alert.type} //</span> {alert.details}
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {alerts.length > 0 && alerts.map((alert, i) => (
          <span key={`dup-${i}`} className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${alert.type === 'CHURN_RISK' ? 'bg-rose-500' : 'bg-blue-500'} animate-[pulse_2s_infinite] shadow-[0_0_8px_rgba(59,130,246,0.8)]`} />
            <span className="opacity-50">{alert.type} //</span> {alert.details}
          </span>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#070a13] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#070a13] to-transparent z-10" />
    </div>
  )
}
export function DrillDownModal({ 
  isOpen, 
  onClose, 
  title, 
  data, 
  type 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  data: CustomerData[],
  type: MetricType
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden glass rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col scale-in-center">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-400" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Deep-dive customer analytics cluster</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all hover:rotate-90">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase bg-white/5 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5 tracking-widest font-black">Ref ID</th>
                <th className="px-8 py-5 tracking-widest font-black">Identity</th>
                <th className="px-8 py-5 tracking-widest font-black">Channel</th>
                <th className="px-8 py-5 text-center tracking-widest font-black">Churn Risk</th>
                <th className="px-8 py-5 text-center tracking-widest font-black">Uplift</th>
                <th className="px-8 py-5 text-right tracking-widest font-black">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5 font-mono text-xs text-slate-500">#{item.id}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400">
                        {item.name?.charAt(0)}
                      </div>
                      <span className="font-bold text-white tracking-tight">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-slate-400 border border-white/10 uppercase">
                      {item.communication_channel || 'Email'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="inline-flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${(item.churn_probability ?? 0) > 0.6 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                       <span className="font-black text-white">{( (item.churn_probability ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="font-black text-emerald-400">+{((item.uplift_score ?? 0) * 100).toFixed(1)}%</span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-white">
                    ${(item.revenue ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center">
               <Database className="w-12 h-12 text-slate-800 mb-4" />
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No records detected in this neural stream.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatItem({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 grow">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
      <span className={`text-xs font-black ${color}`}>{value}</span>
    </div>
  )
}

export function NavItem({ 
  icon, 
  label, 
  active = false,
  onClick
}: { 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean,
  onClick?: () => void
}) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
      active 
        ? 'bg-blue-600/20 text-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`}>
      {React.cloneElement(icon as React.ReactElement, { 
        className: `w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-blue-400' : 'text-slate-500'}` 
      })}
      <span className="font-semibold text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
    </div>
  )
}

export function KPICard({ 
  title, 
  value, 
  icon, 
  trend, 
  type, 
  colorClass,
  onClick 
}: { 
  title: string, 
  value: string | undefined, 
  icon: React.ReactNode, 
  trend?: string,
  type: MetricType,
  colorClass: string,
  onClick: (type: MetricType) => void
}) {
  return (
    <div 
      onClick={() => onClick(type)}
      className="glass-card p-7 rounded-[2.5rem] cursor-pointer group relative overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]"
    >
      <div className={`absolute top-0 right-0 p-6 opacity-5 transition-all duration-700 group-hover:opacity-20 group-hover:scale-125 ${colorClass}`}>
        {icon}
      </div>
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500 ${colorClass}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 tracking-[0.2em] shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          READY
        </div>
      </div>
      <div className="space-y-1.5 relative z-10 overflow-hidden">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-slate-400 transition-colors">{title}</p>
        <h3 className={`${(value?.length || 0) > 12 ? 'text-2xl' : 'text-4xl'} font-black text-white tracking-tighter group-hover:vibrant-text transition-all duration-500 truncate`}>
          {value || '0'}
        </h3>
      </div>
      <div className="mt-5 flex items-center gap-2 relative z-10">
        <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-300 transition-colors">{trend}</span>
      </div>
      <div className="mt-6 pt-6 border-t border-white/5 flex items-center text-[9px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 uppercase tracking-[0.3em]">
        Access Data Node <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
      </div>
      
      {/* Decorative Glow */}
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
    </div>
  )
}
