"use client"

import React, { useState } from 'react'
import { Mail, Building2, MessageSquare, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function RequestAccess() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        reason: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('submitting')
        
        // Simulating API call/Email sending
        setTimeout(() => {
            console.log('Access Requested:', formData)
            setStatus('success')
        }, 1500)
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6 font-sans relative overflow-hidden text-white">
                <div className="glass-card p-12 rounded-[2.5rem] border border-white/10 shadow-2xl max-w-md text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-4">Request Transmitted</h1>
                    <p className="text-slate-400 font-bold text-sm leading-relaxed mb-8">
                        Your application has been logged. Our intelligence team will review your organization's eligibility and reach out via the provided neural link.
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Return to Base
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-[500px] z-10">
                <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-8 hover:text-white transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
                </Link>

                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        REQUEST <span className="text-blue-500">ACCESS</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Partner Onboarding Protocol</p>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        placeholder="John Doe"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Addr</label>
                                <div className="relative group">
                                    <input 
                                        type="email" 
                                        placeholder="john@company.com"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Identity</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Enter legal entity name"
                                    required
                                    value={formData.company}
                                    onChange={e => setFormData({...formData, company: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Justification / Intent</label>
                            <div className="relative group">
                                <MessageSquare className="absolute left-4 top-6 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <textarea 
                                    placeholder="Briefly describe why you want to use Retention Brain..."
                                    required
                                    rows={4}
                                    value={formData.reason}
                                    onChange={e => setFormData({...formData, reason: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none" 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={status === 'submitting'}
                            className="w-full relative group overflow-hidden bg-white text-black font-black py-4 px-6 rounded-2xl transition-all shadow-[0_10px_20px_-10px_rgba(255,255,255,0.3)] active:scale-95 disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                                {status === 'submitting' ? 'Transmitting...' : 'Send Request'}
                                {status !== 'submitting' && <ChevronRight className="w-4 h-4" />}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
