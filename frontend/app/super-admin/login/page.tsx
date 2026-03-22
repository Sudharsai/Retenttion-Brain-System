"use client"

import React, { useState } from 'react'
import { Crown, Zap, ShieldCheck, Mail, Lock, ChevronRight, Fingerprint } from 'lucide-react'
import { API_BASE_URL } from '../../../lib/config'

export default function SuperAdminLogin() {
    const [user, setUser] = useState('')
    const [pwd, setPwd] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            const apiBase = API_BASE_URL
            const res = await fetch(`${apiBase}/api/v1/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_field: user, password: pwd })
            })
            const result = await res.json()
            if (res.ok && result.access_token) {
                if (result.role !== 'super_admin') {
                    setError('Access Denied: High-level clearance required.')
                    setIsLoading(false)
                    return
                }
                localStorage.setItem('token', result.access_token)
                localStorage.setItem('role', result.role)
                localStorage.setItem('username', result.username || '')
                window.location.href = '/super-admin'
            } else {
                setError(result.detail || 'Access denied. Verify your kernel credentials.')
            }
        } catch (err) {
            setError('Connection failed. Central Intelligence Hub is offline.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#07050a] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.03)_0%,transparent_70%)]" />

            <div className="w-full max-w-[440px] z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse" />
                        <div className="relative p-5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.4)] mb-6">
                            <Crown className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        KERNEL <span className="text-purple-500">ACCESS</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.4em] flex items-center gap-2">
                        <Fingerprint className="w-3 h-3" /> Root Authorization
                    </p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rounded-full" />
                    
                    <form onSubmit={handleLogin} className="space-y-8">
                        {error && (
                            <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center animate-shake">
                                Security Alert: {error}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Root Identifier</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="root_id"
                                    value={user} 
                                    onChange={e=>setUser(e.target.value)} 
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-14 pr-5 text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/30 focus:bg-white/5 transition-all" 
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Neural Access Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={pwd} 
                                    onChange={e=>setPwd(e.target.value)} 
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-14 pr-5 text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/30 focus:bg-white/5 transition-all" 
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden bg-purple-600 hover:bg-purple-500 text-white font-black py-4.5 px-6 rounded-2xl transition-all shadow-[0_15px_30px_-10px_rgba(147,51,234,0.5)] active:scale-[0.98] disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs font-black">
                                {isLoading ? 'Verifying Clearance...' : 'Establish Secure Link'}
                                {!isLoading && <ChevronRight className="w-4 h-4" />}
                            </span>
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5">
                        <div className="flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center">
                                <ShieldCheck className="w-5 h-5 text-purple-500/60 mb-1" />
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">E2E Sync</span>
                            </div>
                            <div className="w-px h-8 bg-white/5" />
                            <div className="flex flex-col items-center">
                                <Zap className="w-5 h-5 text-indigo-500/60 mb-1" />
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Hyper-Drive</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-12 text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] opacity-40">
                    Proprietary Infrastructure &copy; 2026 Admin Panel
                </p>
            </div>
        </div>
    )
}
