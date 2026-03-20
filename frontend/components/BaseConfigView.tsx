"use client"

import React, { useState } from 'react'
import { 
  Settings, Globe, Shield, Cpu, 
  Terminal, Database, Save, RefreshCcw,
  Zap, Bell, Lock, Activity
} from 'lucide-react'

interface ConfigSectionProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ConfigSection({ title, desc, icon, children }: ConfigSectionProps) {
  return (
    <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden bg-white/[0.01] hover:bg-white/[0.02] transition-all">
      <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-400">
            {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{desc}</p>
          </div>
        </div>
      </div>
      <div className="p-10">
        {children}
      </div>
    </div>
  )
}

export default function BaseConfigView() {
  const [hubName, setHubName] = useState('RETENTION_BRAIN_V2')
  const [threshold, setThreshold] = useState(70)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      alert('Neural configuration synchronized successfully.')
    }, 1500)
  }

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* Workspace Identity */}
        <ConfigSection 
          title="Workspace Identity" 
          desc="Core branding and hub credentials"
          icon={<Globe />}
        >
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Command Hub Name</label>
              <input 
                type="text" 
                value={hubName} 
                onChange={(e) => setHubName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Access Domain</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  readOnly 
                  value="intelligence.retention-brain.io"
                  className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-slate-500 font-mono text-sm cursor-not-allowed"
                />
                <button className="px-6 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/10 hover:bg-white/10 transition-all">
                  Request Alias
                </button>
              </div>
            </div>
          </div>
        </ConfigSection>

        {/* Neural Parameters */}
        <ConfigSection 
          title="Neural Parameters" 
          desc="AI behavioral logic and thresholds"
          icon={<Cpu />}
        >
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Churn Risk Criticality Threshold</label>
                <span className="text-xl font-black text-blue-400">{threshold}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={threshold} 
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[9px] text-slate-600 font-bold leading-relaxed mt-2 uppercase tracking-tight">
                Identities exceeding this probability will be flagged for immediate retention intervention in the Command Center.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Auto-Retrain</span>
                    <div className="h-5 w-10 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
                 </div>
                 <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Cycle: 24h Interval</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Anomaly Guard</span>
                    <div className="h-5 w-10 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
                 </div>
                 <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Sensitivity: Level Sigma</p>
              </div>
            </div>
          </div>
        </ConfigSection>

        {/* Communication Protocol */}
        <ConfigSection 
          title="Communication Layer" 
          desc="External hooks and alert sharding"
          icon={<Bell />}
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                     <Lock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-white uppercase tracking-wider">Secure Webhook Tunnel</p>
                     <p className="text-[10px] text-emerald-500/60 font-bold italic uppercase tracking-tighter">Protocol: AES-256 Encrypted</p>
                  </div>
               </div>
               <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]">Active</span>
            </div>
            <div className="space-y-4">
               <div className="flex items-center gap-3 text-slate-400 group cursor-pointer hover:text-white transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold font-mono">POST // api.techcorp.com/v1/intercept</span>
               </div>
               <div className="flex items-center gap-3 text-slate-400 group cursor-pointer hover:text-white transition-colors">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-bold font-mono">POST // slack.com/services/T04B...</span>
               </div>
               <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2 hover:underline">Manage Tactical Integrations</button>
            </div>
          </div>
        </ConfigSection>

        {/* System Cluster Status */}
        <ConfigSection 
          title="Cluster Status" 
          desc="Neural node health and metadata"
          icon={<Activity />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex flex-col justify-between">
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">System Uptime</p>
                   <p className="text-2xl font-black text-white tracking-tighter">14d 04h 22m</p>
                </div>
                <div className="mt-4 flex gap-1">
                   {[...Array(12)].map((_, i) => (
                      <div key={i} className={`h-4 w-1 flex-1 rounded-sm ${i > 10 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                   ))}
                </div>
             </div>
             <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural SDK</span>
                   <span className="text-xs font-bold text-blue-400">v2.4.0-Stable</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Node ID</span>
                   <span className="text-xs font-bold text-white">PROD_ALPHA_SINGAPORE</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latency Hub</span>
                   <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Optimal</span>
                </div>
             </div>
          </div>
        </ConfigSection>

      </div>

      <div className="mt-12 flex justify-end">
         <button 
           onClick={handleSave}
           disabled={saving}
           className="px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)]"
         >
            {saving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Synchronizing Cluster...' : 'Push Configuration'}
         </button>
      </div>

      {/* Danger Zone */}
      <div className="mt-20 border-t border-red-500/10 pt-12">
         <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-10 flex items-center justify-between">
            <div>
               <h4 className="text-xl font-black text-red-500 tracking-tight">System Decommission</h4>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Permanently purge all neural data for this organization.</p>
            </div>
            <button className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
               Terminate Node Data
            </button>
         </div>
      </div>
    </div>
  )
}
