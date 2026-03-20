"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react'
import { API_BASE_URL } from '../lib/config'


interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  impact: string | number;
  date: string;
}

export function CampaignTimeline() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/v1/customers/campaign-timeline`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setCampaigns(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);
  return (
    <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            Campaign Performance Timeline
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Operational Deployment Schedule</p>
        </div>
        <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase">Real-time Sync</div>
      </div>

      <div className="relative space-y-8">
        {/* Vertical Line */}
        <div className="absolute left-[21px] top-2 bottom-2 w-px bg-white/10" />

        {campaigns.map((camp, i) => (
          <div key={camp.id} className="relative pl-14 group">
            {/* Indicator Dot */}
            <div className={`absolute left-0 top-1 w-11 h-11 rounded-full bg-[#070a13] border-4 border-white/5 flex items-center justify-center transition-all group-hover:scale-110 z-10`}>
                {camp.status === 'Completed' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {camp.status === 'Active' && <Zap className="w-5 h-5 text-amber-400 animate-pulse" />}
                {camp.status === 'Scheduled' && <Clock className="w-5 h-5 text-slate-500" />}
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                 <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{camp.date}</span>
                    <h4 className="text-sm font-bold text-white mt-1">{camp.name}</h4>
                 </div>
                 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                   camp.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                   (camp.status === 'Active' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400')
                 }`}>
                   {camp.status}
                 </span>
              </div>
              <div className="flex justify-between items-center mt-4">
                 <span className="text-[10px] font-bold text-slate-400">{camp.type}</span>
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{camp.impact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-10 pt-6 border-t border-white/5">
         <button className="w-full py-4 rounded-2xl bg-blue-600/10 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">
            Schedule New Intervention
         </button>
      </div>
    </div>
  )
}
