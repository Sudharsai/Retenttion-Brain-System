"use client"

import React from 'react'
import { Globe, ShieldAlert, Signal } from 'lucide-react'
import { API_BASE_URL } from '../lib/config'


interface GeoRegion {
  region: string;
  risk_score: number;
  customer_count: number;
}

const regionCoords: Record<string, { x: string, y: string, color: string }> = {
  "North America": { x: "20%", y: "30%", color: "bg-emerald-500" },
  "Europe": { x: "50%", y: "25%", color: "bg-amber-500" },
  "Asia Pacific": { x: "75%", y: "45%", color: "bg-rose-500" },
  "South America": { x: "32%", y: "70%", color: "bg-emerald-500" },
  "Africa": { x: "52%", y: "60%", color: "bg-amber-500" },
  "Latin America": { x: "32%", y: "75%", color: "bg-rose-500" }
};

export function ChurnRiskMap() {
  const [regions, setRegions] = React.useState<GeoRegion[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchGeoRisk = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/v1/customers/geo-risk`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setRegions(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch geo risk", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGeoRisk();
  }, []);
  return (
    <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <Globe className="w-6 h-6 text-emerald-400" />
            Global Churn Risk Matrix
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Geographic Neural Distribution</p>
        </div>
        <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      <div className="relative h-[400px] bg-blue-900/5 rounded-3xl border border-white/5 overflow-hidden">
        {/* Simple Stylized SVG Grid Map Background */}
        <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-20">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Stylized Continents (Simplified Shapes) */}
          <path d="M100,100 Q200,50 300,150 T500,100 T700,200 L700,300 L100,300 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.2)" />
        </svg>

        {/* Region Hotspots */}
        {regions.map((region, i) => {
          const coords = regionCoords[region.region] || { x: "50%", y: "50%", color: "bg-blue-500" };
          const riskLevel = region.risk_score > 0.6 ? 'High' : (region.risk_score > 0.3 ? 'Medium' : 'Low');
          
          return (
            <div 
              key={i} 
              className="absolute group transition-all"
              style={{ left: coords.x, top: coords.y }}
            >
              <div className={`w-4 h-4 rounded-full ${coords.color} animate-ping absolute opacity-40`} />
              <div className={`w-4 h-4 rounded-full ${coords.color} relative border-2 border-[#070a13] cursor-pointer group-hover:scale-150 transition-transform`} />
              
              {/* Tooltip Overlay */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-40 p-4 glass rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                 <p className="text-[10px] font-black text-white uppercase mb-1">{region.region}</p>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Risk Level</span>
                    <span className={`text-[9px] font-black uppercase ${
                      riskLevel === 'High' ? 'text-rose-500' : (riskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500')
                    }`}>{riskLevel}</span>
                 </div>
                 <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${coords.color}`} 
                      style={{ width: `${region.risk_score * 100}%` }}
                    />
                 </div>
                 <p className="text-[8px] text-slate-400 mt-2">{region.customer_count} Customers</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
         <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
               <ShieldAlert className="w-4 h-4 text-rose-500" />
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Anomalies</h4>
            </div>
            <p className="text-xl font-black text-white">03 Clusters</p>
         </div>
         <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-2">
               <Signal className="w-4 h-4 text-emerald-400" />
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Latency</h4>
            </div>
            <p className="text-xl font-black text-white">0.4ms avg</p>
         </div>
      </div>
    </div>
  )
}
