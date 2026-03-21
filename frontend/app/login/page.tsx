"use client"

import React, { useState } from 'react'
import { Activity, Zap, ShieldCheck, Mail, Lock, ChevronRight } from 'lucide-react'
import { API_BASE_URL } from '../../lib/config'
import Link from 'next/link'


export default function Login() {
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
            const res = await fetch(`${apiBase}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_field: user, password: pwd })
            })
            const result = await res.json()
            if (res.ok && result.access_token) {
                localStorage.setItem('token', result.access_token)
                localStorage.setItem('role', result.role)
                // Store company info if available, otherwise it's likely an admin
                localStorage.setItem('company_id', result.company_id?.toString() || '')
                localStorage.setItem('company_name', result.company_name || 'Platform Admin')
                localStorage.setItem('username', result.username || '')
                
                if (result.role === 'super_admin') {
                    window.location.href = '/super-admin'
                } else if (result.role === 'admin') {
                    window.location.href = '/admin'
                } else {
                    window.location.href = '/'
                }
            } else {
                const errorMsg = result.detail || 'Access denied. Verify your credentials.'
                setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
            }
        } catch (err) {
            setError('Connection failed. Central Intelligence Hub is offline.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-[440px] z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="p-4 bg-blue-600 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.4)] mb-6 animate-bounce-slow">
                        <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        RETENTION <span className="text-blue-500">BRAIN</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.2em]">Neural Authentication Portal</p>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                                Warning: {error}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity UID</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="email_or_username"
                                    value={user} 
                                    onChange={e=>setUser(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all" 
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Protocol</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={pwd} 
                                    onChange={e=>setPwd(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all" 
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-[0_10px_20px_-10px_rgba(59,130,246,0.5)] active:scale-95 disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                                {isLoading ? 'Decrypting Access...' : 'Establish Connection'}
                                {!isLoading && <ChevronRight className="w-4 h-4" />}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5">
                        <div className="flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center">
                                <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">TLS 1.3</span>
                            </div>
                            <div className="w-px h-8 bg-white/5" />
                            <div className="flex flex-col items-center">
                                <Activity className="w-5 h-5 text-blue-500 mb-1" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">AI Scanned</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Want to join? <Link href="/request-access" className="text-blue-400 hover:text-white transition-colors underline underline-offset-4">Request Access</Link>
                </div>

                <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
                    &copy; 2026 Retention Brain Systems. All rights reserved.
                </p>
            </div>
        </div>
    )
}
