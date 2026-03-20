"use client"

import React, { useEffect, useState } from 'react'
import { 
  ShieldAlert, LogOut, Users, 
  Plus, Search,
  LayoutDashboard, Zap,
  Briefcase
} from 'lucide-react'
import { API_BASE_URL } from '../../lib/config'

// --- Custom Components ---

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        active 
          ? 'bg-blue-500/20 text-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-blue-500/20' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
  )
}

// --- Main Page ---

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [companyName, setCompanyName] = useState('')

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const fetchAdminData = async () => {
    const token = localStorage.getItem('token')
    const apiBase = API_BASE_URL
    
    try {
      const userRes = await fetch(`${apiBase}/api/v1/admin/users`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      const usrs = await userRes.json()
      if (usrs.success) setUsers(usrs.data)
    } catch (err) {
      setError('Connection failed. Database unreachable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('role')
    const cName = localStorage.getItem('company_name')
    setCompanyName(cName || 'Corporate Division')
    
    if (role !== 'admin') {
      // If super_admin tries to access /admin, redirect to /super-admin
      if (role === 'super_admin') {
        window.location.href = '/super-admin'
      } else {
        window.location.href = '/login'
      }
      return
    }
    fetchAdminData()
  }, [])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#070a13] text-white">
      <Zap className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
      <span className="font-black tracking-[0.2em] text-sm animate-pulse">SYNCHRONIZING SECURE NODE...</span>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#070a13] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/10 flex flex-col bg-[#0a0f1c]">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.4)]">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">BUSINESS</h1>
            <p className="text-[10px] font-bold text-blue-400 tracking-[0.3em] uppercase">Admin Hub</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Operations</p>
          <NavItem 
            icon={<Users />} 
            label="Team Management" 
            active={true}
          />
          
          <div className="my-8 h-px bg-white/5 mx-4" />
          
          <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">External Utilities</p>
          <NavItem icon={<LayoutDashboard />} label="Member Preview" onClick={() => window.location.href = '/'} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 text-blue-400 font-black text-xs uppercase tracking-widest border border-blue-400/20 hover:bg-blue-400/10 transition-all outline-none"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative p-10">
         {/* Background Orbs */}
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] -z-10" />
         
         <header className="flex justify-between items-center mb-12">
            <div>
               <h2 className="text-4xl font-black tracking-tighter mb-2">{companyName}</h2>
               <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                 Authorized workspace management active.
               </p>
            </div>
            <div className="flex gap-4">
               <button 
                onClick={async () => {
                  const username = prompt("Enter Member Username:");
                  const email = prompt("Enter Email:");
                  const password = prompt("Enter Temporary Password:");
                  
                  if(!username || !email || !password) return;
                  
                  const token = localStorage.getItem('token');
                  const cId = localStorage.getItem('company_id');
                  
                  const res = await fetch(`${API_BASE_URL}/api/v1/admin/user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ 
                      username, 
                      email, 
                      password, 
                      role: 'user', 
                      company_id: cId ? parseInt(cId) : null 
                    })
                  });
                  if(res.ok) {
                    alert(`Member Added Successfully!\n\nUsername: ${username}\nAccess: Standard`);
                    fetchAdminData();
                  } else {
                    const err = await res.json();
                    alert(`Action Denied: ${err.detail || 'Generic rejection'}`);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Add Team Member
               </button>
            </div>
         </header>

         {/* Content Area */}
         <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col min-h-[600px] shadow-2xl bg-white/2">
            <div className="px-10 py-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
               <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">Team Roster</h3>
               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                 <input 
                  type="text" 
                  placeholder="Filter members..." 
                  className="bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-5 text-sm font-bold text-white w-64 focus:outline-none focus:border-blue-500/50 transition-all" 
                 />
               </div>
            </div>

            <div className="flex-1">
              <table className="w-full text-left">
                <thead className="bg-[#0f1425] text-slate-600 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-10 py-5">Member Name</th>
                    <th className="px-10 py-5">Email Configuration</th>
                    <th className="px-10 py-5">Authorized Role</th>
                    <th className="px-10 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs opacity-50">
                        No team members registered yet.
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-10 py-6">
                           <p className="font-black text-base text-white tracking-tight leading-none">{u.username}</p>
                        </td>
                        <td className="px-10 py-6">
                           <p className="text-sm text-slate-400 font-bold">{u.email}</p>
                        </td>
                        <td className="px-10 py-6">
                           <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/30">
                             {u.role}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right flex justify-end gap-3">
                           <button 
                             onClick={async () => {
                               const new_password = prompt("New password for " + u.username);
                               if (!new_password) return;
                               const token = localStorage.getItem('token');
                               const res = await fetch(`${API_BASE_URL}/api/v1/admin/user/${u.id}/reset-password`, {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                 body: JSON.stringify({ new_password })
                               });
                               if (res.ok) alert("Password Updated");
                             }}
                             className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-xl border border-white/10 hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest">
                             Reset
                           </button>
                           <button 
                             onClick={async () => {
                               if (!confirm("Remove " + u.username + " from team?")) return;
                               const token = localStorage.getItem('token');
                               const res = await fetch(`${API_BASE_URL}/api/v1/admin/user/${u.id}`, {
                                 method: 'DELETE',
                                 headers: { 'Authorization': `Bearer ${token}` }
                               });
                               if (res.ok) fetchAdminData();
                             }}
                             className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/30 hover:bg-red-500/20 transition-all text-[9px] font-black uppercase tracking-widest">
                             Remove
                           </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
         </div>
      </main>
    </div>
  )
}
