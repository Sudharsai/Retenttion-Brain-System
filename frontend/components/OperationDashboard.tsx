"use client"

import React from 'react'
import { Users, ShieldAlert, Zap, Target, Globe } from 'lucide-react'
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
  insights: Array<{
    id: number;
    name: string;
    uplift_score: number;
    neural_analysis: string;
    persuadability_score: number;
    geography_risk_score: number;
  }>;
  hideHeader?: boolean;
  hideKPIs?: boolean;
}

export default function OperationDashboard({ 
  metrics, onDrillDown, insights, 
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

    </div>
  )
}
