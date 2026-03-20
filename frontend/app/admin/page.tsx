"use client"

import React, { useEffect, useState } from 'react'
import { 
  ShieldAlert, LogOut, Users, Building2, 
  History, Plus, Search, ChevronRight, 
  Settings, LayoutDashboard, Database, Zap
} from 'lucide-react'
import { API_BASE_URL } from '../../lib/config'

// --- Custom Components ---

function AdminNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        active 
          ? 'bg-red-500/20 text-red-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
  )
}

function StatCard({ title, value, icon, colorClass }: { title: string, value: string, icon: React.ReactNode, colorClass: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
      </div>
    </div>
  )
}

// --- Main Page ---

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'logs'>('companies')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const fetchAdminData = async () => {
    const token = localStorage.getItem('token')
    const apiBase = API_BASE_URL
    
    try {
      // Parallel fetch for speed
      const [compRes, userRes, logRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/admin/companies`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/admin/logs`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      const comps = await compRes.json()
      const usrs = await userRes.json()
      const lgs = await logRes.json()

      if (comps.success) setCompanies(comps.data)
      if (usrs.success) setUsers(usrs.data)
      if (lgs.success) setLogs(lgs.data)

    } catch (err) {
      setError('System synchronization failed. Verify backend access.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('role')
    if (role !== 'admin') {
      window.location.href = '/login'
      return
    }
    fetchAdminData()
  }, [])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070a13] text-white">
      <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse mb-4" />
      <span className="font-black tracking-[0.2em] text-sm animate-pulse">AUTHORIZING ADMIN ACCESS...</span>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#070a13] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/10 flex flex-col">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
          <div className="p-2 bg-red-600 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.5)]">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">SUPERADMIN</h1>
            <p className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Kernel Mode</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          <p className="px-4 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Management</p>
          <AdminNavItem 
            icon={<Building2 />} 
            label="Tenants (Companies)" 
            active={activeTab === 'companies'} 
            onClick={() => setActiveTab('companies')} 
          />
          <AdminNavItem 
            icon={<Users />} 
            label="Unified User Directory" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <AdminNavItem 
            icon={<History />} 
            label="System Audit Logs" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
          
          <div className="my-8 h-px bg-white/5 mx-4" />
          
          <p className="px-4 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">External Operations</p>
          <AdminNavItem icon={<LayoutDashboard />} label="Dashboard Preview" onClick={() => window.location.href = '/'} />
          <AdminNavItem icon={<Settings />} label="Kernel Config" />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-red-400 font-black text-xs uppercase tracking-widest border border-red-400/20 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-4 h-4" /> Terminate Control
          </button>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative p-8">
         {/* Background Orbs */}
         <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-red-600/10 rounded-full blur-[100px] -z-10" />
         
         <header className="flex justify-between items-center mb-10">
            <div>
               <h2 className="text-3xl font-black tracking-tight mb-1">Central Intelligence Hub</h2>
               <p className="text-slate-400 font-bold text-xs flex items-center gap-2">
                 <Zap className="w-3 h-3 text-red-400" />
                 Global state management and multi-tenant isolation authorized.
               </p>
            </div>
            <div className="flex gap-3">
               <button 
                onClick={async () => {
                  const name = prompt("Enter Company Name:");
                  if(!name) return;
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API_BASE_URL}/api/v1/admin/company`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ name })
                  });
                  if(res.ok) fetchAdminData();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Provision New Tenant
               </button>
            </div>
         </header>

         {/* Quick Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard title="Active Companies" value={companies.length.toString()} icon={<Building2 className="w-5 h-5" />} colorClass="text-blue-400" />
            <StatCard title="System Users" value={users.length.toString()} icon={<Users className="w-5 h-5" />} colorClass="text-emerald-400" />
            <StatCard title="Audit Events" value={logs.length.toString()} icon={<Database className="w-5 h-5" />} colorClass="text-amber-400" />
         </div>

         {/* Content Area */}
         <div className="glass-card rounded-2xl overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
            <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
               <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-300">
                 {activeTab === 'companies' ? 'Tenant Registry' : activeTab === 'users' ? 'User Matrix' : 'Audit Flux'}
               </h3>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input type="text" placeholder="Filter records..." className="bg-[#0f1425] border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs font-bold text-white w-48 focus:outline-none focus:border-red-500/50 transition-all" />
               </div>
            </div>

            <div className="flex-1">
               {activeTab === 'companies' && (
                 <table className="w-full text-left">
                   <thead className="bg-[#0f1425] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                     <tr>
                       <th className="px-8 py-4">Tenant ID</th>
                       <th className="px-8 py-4">Entity Identity</th>
                       <th className="px-8 py-4">Provisioned At</th>
                       <th className="px-8 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {companies.map(c => (
                       <tr key={c.id} className="hover:bg-white/5 transition-colors">
                         <td className="px-8 py-5 font-mono text-xs text-slate-400">TEN-00{c.id}</td>
                         <td className="px-8 py-5">
                            <p className="font-bold text-sm">{c.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold">Standard Tier</p>
                         </td>
                         <td className="px-8 py-5 text-xs text-slate-400 font-medium">{c.created}</td>
                         <td className="px-8 py-5 text-right">
                           <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
                             <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}

                {activeTab === 'users' && (
                  <>
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-end">
                      <button 
                        onClick={async () => {
                          const username = prompt("Enter Username:");
                          const password = prompt("Enter Password:");
                          const role = prompt("Enter Role (admin/user):", "user");
                          const company_id = prompt("Enter Company ID (leave blank for none):");
                          if(!username || !password) return;
                          const token = localStorage.getItem('token');
                          const res = await fetch(`${API_BASE_URL}/api/v1/admin/user`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ username, password, role, company_id: company_id ? parseInt(company_id) : null })
                          });
                          if(res.ok) fetchAdminData();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-500 transition-all">
                        <Plus className="w-3 h-3" /> Add System User
                      </button>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-[#0f1425] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-8 py-4">User Identity</th>
                          <th className="px-8 py-4">Authorized Role</th>
                          <th className="px-8 py-4">Affiliate Tenant</th>
                          <th className="px-8 py-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-8 py-5">
                               <p className="font-bold text-sm">{u.username}</p>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                 u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                               }`}>
                                 {u.role}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-xs text-slate-400 font-medium">
                              {u.company_id ? `Comp ID: ${u.company_id}` : 'Infrastructure (Global)'}
                            </td>
                            <td className="px-8 py-5 text-right">
                               <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] font-black">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  VERIFIED
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

               {activeTab === 'logs' && (
                 <div className="p-8 space-y-4 font-mono text-xs">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 text-center py-12">No audit events found in current cycle.</p>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className="flex gap-4 p-3 bg-white/5 rounded border border-white/5">
                          <span className="text-slate-500">[{log.timestamp}]</span>
                          <span className={`${log.type === 'ERROR' ? 'text-red-400' : 'text-blue-400'} font-bold`}>{log.type}</span>
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                      ))
                    )}
                 </div>
               )}
            </div>
         </div>
      </main>
    </div>
  )
}
