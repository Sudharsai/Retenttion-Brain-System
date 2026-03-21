"use client"

import React, { useEffect, useState } from 'react'
import { 
  ShieldAlert, LogOut, Users, Building2, 
  History, Plus, Search, ChevronRight, 
  Settings, LayoutDashboard, Database, Zap,
  Crown, Activity
} from 'lucide-react'
import { API_BASE_URL } from '../../lib/config'

// --- Custom Components ---

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        active 
          ? 'bg-purple-600/20 text-purple-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-purple-500/20' 
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
    <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-12 h-12' })}
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
      </div>
    </div>
  )
}

// --- Main Page ---

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState({ tenants: 0, users: 0, customers: 0, pending_requests: 0 })
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'requests' | 'logs'>('companies')
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
      const [compRes, userRes, logRes, statsRes, reqRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/admin/companies`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/admin/logs`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/admin/requests`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      const comps = await compRes.json()
      const usrs = await userRes.json()
      const lgs = await logRes.json()
      const stts = await statsRes.json()
      const reqs = await reqRes.json()

      if (comps.success) setCompanies(comps.data)
      if (usrs.success) setUsers(usrs.data)
      if (lgs.success) setLogs(lgs.data)
      if (stts.success) setStats(stts.data)
      if (reqs.success) setRequests(reqs.data)

    } catch (err) {
      setError('System synchronization failed. Verify backend access.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('role')
    if (role !== 'super_admin') {
      window.location.href = '/login'
      return
    }
    fetchAdminData()
  }, [])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070a13] text-white">
      <Crown className="w-12 h-12 text-purple-500 animate-pulse mb-4" />
      <span className="font-black tracking-[0.2em] text-sm animate-pulse">AUTHORIZING KERNEL ACCESS...</span>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#070a13] text-white font-sans overflow-hidden selection:bg-purple-500/30">
      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/10 flex flex-col bg-[#0a0f1c]">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-[0_0_25px_rgba(147,51,234,0.5)]">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">PLATFORM</h1>
            <p className="text-[10px] font-bold text-purple-400 tracking-[0.3em] uppercase">Kernel Mode</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Management Layer</p>
          <NavItem 
            icon={<Building2 />} 
            label="Tenant Registry" 
            active={activeTab === 'companies'} 
            onClick={() => setActiveTab('companies')} 
          />
          <NavItem 
            icon={<Users />} 
            label="Unified User Meta" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <NavItem 
            icon={<Zap />} 
            label="Access Requests" 
            active={activeTab === 'requests'} 
            onClick={() => setActiveTab('requests')} 
          />
          <NavItem 
            icon={<History />} 
            label="Audit Streams" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
          
          <div className="my-8 h-px bg-white/5 mx-4" />
          
          <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">External Core</p>
          <NavItem icon={<LayoutDashboard />} label="Dashboard Preview" onClick={() => window.location.href = '/'} />
          <NavItem icon={<Activity />} label="System Vitals" />
          <NavItem icon={<Settings />} label="Kernel Config" />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 text-purple-400 font-black text-xs uppercase tracking-widest border border-purple-400/20 hover:bg-purple-400/10 transition-all outline-none"
          >
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative p-10 bg-grid-white/[0.02]">
         {/* Background Orbs */}
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] -z-10" />
         
         <header className="flex justify-between items-center mb-12">
            <div>
               <h2 className="text-4xl font-black tracking-tighter mb-2">Platform Control</h2>
               <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                 Global multi-tenant infrastructure authorized.
               </p>
            </div>
            <div className="flex gap-4">
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
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Provision Tenant
               </button>
            </div>
         </header>

         {/* Quick Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <StatCard title="Active Tenants" value={stats.tenants.toString()} icon={<Building2 className="w-5 h-5" />} colorClass="text-purple-400" />
            <StatCard title="Entity Base" value={stats.users.toString()} icon={<Users className="w-5 h-5" />} colorClass="text-indigo-400" />
            <StatCard title="Global Customers" value={stats.customers.toString()} icon={<Database className="w-5 h-5" />} colorClass="text-blue-400" />
         </div>

         {/* Content Area */}
         <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col min-h-[600px] shadow-2xl">
            <div className="px-10 py-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
               <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">
                 {activeTab === 'companies' ? 'Tenant Matrix' : activeTab === 'users' ? 'Identity Index' : 'Audit Flux'}
               </h3>
               <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                 <input 
                  type="text" 
                  placeholder="Query records..." 
                  className="bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-5 text-sm font-bold text-white w-64 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-slate-700" 
                 />
               </div>
            </div>

            <div className="flex-1">
               {activeTab === 'companies' && (
                 <table className="w-full text-left">
                   <thead className="bg-[#0f1425] text-slate-600 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                     <tr>
                       <th className="px-10 py-5">Tenant ID</th>
                       <th className="px-10 py-5">Corporate Identity</th>
                       <th className="px-10 py-5">Initialization</th>
                       <th className="px-10 py-5 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {companies.map(c => (
                       <tr key={c.id} className="hover:bg-white/5 transition-colors">
                         <td className="px-10 py-6 font-mono text-xs text-slate-500 tracking-tighter">ID:TK-{c.id.toString().padStart(4, '0')}</td>
                         <td className="px-10 py-6">
                            <p className="font-black text-white tracking-tight text-base leading-none mb-1">{c.name}</p>
                            <p className="text-[10px] text-purple-500/70 font-black uppercase tracking-widest">Enterprise Class</p>
                         </td>
                         <td className="px-10 py-6 text-xs text-slate-400 font-bold uppercase tracking-widest">{c.created || 'Authorized'}</td>
                         <td className="px-10 py-6 text-right">
                           <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                             <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}

                {activeTab === 'users' && (
                  <>
                    <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex justify-end">
                      <button 
                        onClick={async () => {
                          const username = prompt("Enter Username:");
                          const email = prompt("Enter Email:");
                          const password = prompt("Enter Password:");
                          const role = prompt("Access Level (admin/user/super_admin):", "user") || "user";
                          const company_id = prompt("Target Company ID (Null for Global):");
                          
                          if(!username || !email || !password) return;
                          
                          const token = localStorage.getItem('token');
                          const res = await fetch(`${API_BASE_URL}/api/v1/admin/user`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ 
                              username, 
                              email, 
                              password, 
                              role, 
                              company_id: company_id ? parseInt(company_id) : null 
                            })
                          });
                          if(res.ok) {
                            alert(`Provisioning Successful!\n\nIdentity: ${username}\nAccess: ${role.toUpperCase()}`);
                            fetchAdminData();
                          } else {
                            const err = await res.json();
                            alert(`AUTH_FAILURE: ${err.detail || 'Protocol Rejection'}`);
                          }
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-500 shadow-xl transition-all">
                        <Plus className="w-4 h-4" /> Provision Identity
                      </button>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-[#0f1425] text-slate-600 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                        <tr>
                          <th className="px-10 py-5">Identity Profile</th>
                          <th className="px-10 py-5">Communication Link</th>
                          <th className="px-10 py-5">Access Tier</th>
                          <th className="px-10 py-5">Affiliation</th>
                          <th className="px-10 py-5 text-right">Ops</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-white/10 transition-colors">
                            <td className="px-10 py-6">
                               <p className="font-black text-base text-white tracking-tight leading-none mb-1">{u.username}</p>
                               <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">UID: {u.id}</p>
                            </td>
                            <td className="px-10 py-6">
                               <p className="text-sm text-slate-400 font-bold">{u.email}</p>
                            </td>
                            <td className="px-10 py-6">
                               <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                 u.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                 u.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                                 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                               }`}>
                                 {u.role}
                               </span>
                            </td>
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${u.company_id ? 'bg-blue-500/50' : 'bg-purple-500/50 animate-pulse'}`} />
                                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                    {u.company_id ? `CID: ${u.company_id}` : 'Infrastructure'}
                                  </p>
                               </div>
                            </td>
                            <td className="px-10 py-6 text-right flex justify-end gap-3">
                               <button 
                                 onClick={async () => {
                                   const new_password = prompt("Relink credentials for " + u.username);
                                   if (!new_password) return;
                                   const token = localStorage.getItem('token');
                                   const res = await fetch(`${API_BASE_URL}/api/v1/admin/user/${u.id}/reset-password`, {
                                     method: 'POST',
                                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                     body: JSON.stringify({ new_password })
                                   });
                                   if (res.ok) alert("Protocol Synced: Password Reset");
                                 }}
                                 className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-xl border border-white/10 hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest">
                                 Reset
                               </button>
                               <button 
                                 disabled={u.role === 'super_admin'}
                                 onClick={async () => {
                                   if (!confirm("Confirm termination of identity: " + u.username + "?")) return;
                                   const token = localStorage.getItem('token');
                                   const res = await fetch(`${API_BASE_URL}/api/v1/admin/user/${u.id}`, {
                                     method: 'DELETE',
                                     headers: { 'Authorization': `Bearer ${token}` }
                                   });
                                   if (res.ok) fetchAdminData();
                                   else {
                                     const err = await res.json();
                                     alert(err.detail || "Operation Restricted");
                                   }
                                 }}
                                 className={`px-3 py-1.5 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${
                                   u.role === 'super_admin' 
                                     ? 'bg-slate-500/5 text-slate-700 border-slate-700/20 cursor-not-allowed' 
                                     : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                                 }`}>
                                 Purge
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {activeTab === 'requests' && (
                  <table className="w-full text-left">
                    <thead className="bg-[#0f1425] text-slate-600 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                      <tr>
                        <th className="px-10 py-5">Initiator</th>
                        <th className="px-10 py-5">Organization</th>
                        <th className="px-10 py-5">Intent</th>
                        <th className="px-10 py-5">Status</th>
                        <th className="px-10 py-5 text-right">Approval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-10 py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">No pending authorization clusters.</td>
                        </tr>
                      ) : (
                        requests.map(r => (
                          <tr key={r.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-10 py-6">
                               <p className="font-black text-white tracking-tight leading-none mb-1">{r.name}</p>
                               <p className="text-[10px] text-slate-500 font-bold">{r.email}</p>
                            </td>
                            <td className="px-10 py-6 font-black text-xs uppercase tracking-widest text-blue-400">{r.company_name}</td>
                            <td className="px-10 py-6 font-bold text-xs text-slate-400 max-w-xs truncate">{r.reason}</td>
                            <td className="px-10 py-6">
                               <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                 r.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                 r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                 'bg-red-500/10 text-red-400 border-red-500/30'
                               }`}>
                                 {r.status}
                               </span>
                            </td>
                            <td className="px-10 py-6 text-right">
                               {r.status === 'pending' && (
                                 <div className="flex justify-end gap-2">
                                   <button 
                                    onClick={async () => {
                                      if(!confirm(`Authorize ${r.company_name}? This will grant access to the platform.`)) return;
                                      const token = localStorage.getItem('token');
                                      const res = await fetch(`${API_BASE_URL}/api/v1/admin/requests/${r.id}/status`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ status: 'approved' })
                                      });
                                      if(res.ok) {
                                        alert("Authorization cluster synched. Tenant access granted.");
                                        fetchAdminData();
                                      }
                                    }}
                                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/30 transition-all">
                                      <ShieldAlert className="w-4 h-4" />
                                   </button>
                                   <button 
                                    onClick={async () => {
                                      if(!confirm(`Deny ${r.company_name}?`)) return;
                                      const token = localStorage.getItem('token');
                                      const res = await fetch(`${API_BASE_URL}/api/v1/admin/requests/${r.id}/status`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ status: 'denied' })
                                      });
                                      if(res.ok) fetchAdminData();
                                    }}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/30 transition-all">
                                      <LogOut className="w-4 h-4" />
                                   </button>
                                 </div>
                               )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

               {activeTab === 'logs' && (
                 <div className="p-10 space-y-5 font-mono text-[11px]">
                    {logs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Database className="w-12 h-12 mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">No active audit flux detected.</p>
                      </div>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className="flex gap-6 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/20 transition-all">
                          <span className="text-slate-600 font-bold tracking-tighter">[{log.timestamp}]</span>
                          <span className={`${log.type === 'ERROR' ? 'text-rose-500' : 'text-purple-400'} font-black uppercase tracking-widest`}>{log.type}</span>
                          <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{log.message}</span>
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
