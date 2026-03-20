"use client"

import React, { useState } from 'react'
import { Activity, Zap, ShieldCheck, UserPlus, Lock, ChevronRight, User } from 'lucide-react'
import { API_BASE_URL } from '../../lib/config'
import Link from 'next/link'

export default function Signup() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        
        if (password !== confirmPassword) {
            setError('Protocols mismatch. Access keys must be identical.')
            return
        }

        setIsLoading(true)
        try {
            const apiBase = API_BASE_URL
            const res = await fetch(`${apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setSuccess('Identity localized. Redirecting to uplink...')
                setTimeout(() => {
                    window.location.href = '/login'
                }, 2000)
            } else {
                setError(data.detail || 'Registration failed. Neural link rejected.')
            }
        } catch (err) {
            setError('Uplink failed. Central Intelligence Hub is unreachable.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-[440px] z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="p-4 bg-purple-600 rounded-2xl shadow-[0_0_30px_rgba(147,51,234,0.4)] mb-6 animate-pulse">
                        <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        RETENTION <span className="text-purple-500">BRAIN</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.2em]">Neural Registration Portal</p>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-wider">
                                CRITICAL ERROR: {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-xs font-black uppercase tracking-wider">
                                SUCCESS: {success}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Identity UID</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="choose_identifier"
                                    value={username} 
                                    onChange={e=>setUsername(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all" 
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Establish Access Protocol</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={password} 
                                    onChange={e=>setPassword(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all" 
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Access Protocol</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={confirmPassword} 
                                    onChange={e=>setConfirmPassword(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all" 
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden bg-purple-600 hover:bg-purple-500 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-[0_10px_20px_-10px_rgba(147,51,234,0.5)] active:scale-95 disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                                {isLoading ? 'Localizing Identity...' : 'Initialize Uplink'}
                                {!isLoading && <ChevronRight className="w-4 h-4" />}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Already localized? <Link href="/login" className="text-purple-400 hover:text-white transition-colors">Establish Connection</Link>
                    </div>
                </div>

                <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
                    &copy; 2026 Retention Brain Systems. Neural Linked.
                </p>
            </div>
        </div>
    )
}
