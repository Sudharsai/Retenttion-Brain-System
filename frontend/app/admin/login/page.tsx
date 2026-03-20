"use client"

import React, { useState } from 'react'
import { Shield, Zap, Lock, User, ChevronRight } from 'lucide-react'
import { API_BASE_URL } from '../../../lib/config'

export default function AdminLogin() {
    const [idField, setIdField] = useState('')
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
                body: JSON.stringify({ id_field: idField, password: pwd })
            })
            const result = await res.json()
            if (res.ok && result.access_token) {
                localStorage.setItem('token', result.access_token)
                localStorage.setItem('role', 'admin')
                window.location.href = '/admin'
            } else {
                setError(result.detail || 'Access denied. Platform Admin verification failed.')
            }
        } catch (err) {
            setError('Neural Link Failure: Admin Authentication service is unreachable.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 font-sans relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
            
            <div className="w-full max-w-[400px] z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30 mb-6 group cursor-default">
                        <Shield className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2">Platform Control</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Retention Brain Operations</p>
                </div>

                <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2rem] backdrop-blur-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Admin UID</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input 
                                    type="text" 
                                    placeholder="admin_id"
                                    value={idField}
                                    onChange={e=>setIdField(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Access Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={pwd}
                                    onChange={e=>setPwd(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Verifying Neural Match...' : 'Access Core Pipeline'}
                            {!isLoading && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
                
                <p className="text-center mt-10 text-[9px] font-black text-slate-600 uppercase tracking-widest opacity-50">
                    Proprietary Governance System &copy; 2026
                </p>
            </div>
        </div>
    )
}
