"use client"

import React, { useState } from 'react'
import { 
  Upload, Database, Cloud, Link, 
  FileText, CheckCircle2, AlertCircle, 
  ArrowRight, Loader2, Trash2 
} from 'lucide-react'

interface SourceCardProps {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: (id: string) => void;
}

function SourceCard({ id, title, desc, icon, active, onClick }: SourceCardProps) {
  return (
    <div
      onClick={() => onClick(id)}
      className={`p-6 rounded-[2rem] border cursor-pointer transition-all group ${
        active 
          ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
          : 'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${active ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <div>
          <h4 className="font-bold text-white tracking-tight">{title}</h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function DataControlPanel() {
  const [activeSource, setActiveSource] = React.useState<string>('csv');
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true)
    setStatus('')
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${window.location.origin.replace('3000', '8000')}/api/v1/customers/upload-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await res.json();
      if (res.ok && result.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-10 space-y-10 w-full max-w-[1700px] mx-auto">
      <header>
        <h2 className="text-3xl font-black text-white tracking-tight">Data Ingestion Hub</h2>
        <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Global Synchronization Control</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Source Selection */}
        <div className="space-y-4">
           <SourceCard 
              id="csv"
              active={activeSource === 'csv'} 
              onClick={setActiveSource} 
              icon={<FileText />} 
              title="Dataset (CSV/Parquet)" 
              desc="Upload local research data"
           />
           <SourceCard 
              id="s3"
              active={activeSource === 's3'} 
              onClick={setActiveSource} 
              icon={<Cloud />} 
              title="AWS S3 Bucket" 
              desc="Sync from cloud storage"
           />
           <SourceCard 
              id="db"
              active={activeSource === 'db'} 
              onClick={setActiveSource} 
              icon={<Database />} 
              title="Remote Database" 
              desc="Live PostgreSQL/MySQL link"
           />
        </div>

        {/* Action Area */}
        <div className="lg:col-span-2">
           <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 min-h-[500px] flex flex-col">
              {activeSource === 'csv' && (
                <div className="flex-1 flex flex-col">
                   <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                      <Upload className="w-6 h-6 text-blue-400" />
                      Local Ingestion Zone
                   </h3>
                   
                   <div className="flex-1 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center p-10 hover:border-blue-500/30 transition-all group">
                      <div className="p-6 bg-blue-600/10 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
                         <Upload className="w-12 h-12 text-blue-400" />
                      </div>
                      <p className="text-lg font-black text-white">Drag & Drop Dataset</p>
                      <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest text-center max-w-[280px]">
                         Max file size: 500MB. Supports .csv, .parquet formats for neural retraining.
                      </p>
                      <input type="file" className="hidden" id="file-upload" onChange={handleFileChange} />
                      <label htmlFor="file-upload" className="mt-8 px-8 py-3 bg-blue-600 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all">
                         Browse Local Files
                      </label>
                      {file && (
                        <p className="text-sm text-white mt-4">Selected file: {file.name}</p>
                      )}
                   </div>

                   {status === 'success' && (
                      <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <div>
                               <p className="text-xs font-black text-white uppercase tracking-wider">Sync Successful</p>
                               <p className="text-[10px] text-slate-400 font-bold">12,402 records integrated into Neural Core.</p>
                            </div>
                         </div>
                         <button onClick={() => setStatus('')} className="text-slate-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   )}

                   <div className="mt-8 flex justify-end">
                      <button 
                        onClick={handleUpload}
                        disabled={uploading || !file}
                        className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                         {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                         {uploading ? 'Integrating...' : 'Start Retraining'}
                      </button>
                   </div>
                </div>
              )}

              {activeSource === 's3' && (
                 <div className="space-y-8">
                    <h3 className="text-xl font-black flex items-center gap-3">
                       <Cloud className="w-6 h-6 text-sky-400" />
                       Cloud Bucket Link
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key ID</label>
                          <input type="text" placeholder="AKIA..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-sky-500/50 transition-all" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secret Access Key</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-sky-500/50 transition-all" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bucket Endpoint</label>
                       <input type="text" placeholder="s3://retention-brain-data/ingest/prod" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-sky-500/50 transition-all" />
                    </div>
                    <div className="flex justify-between items-center bg-sky-500/5 p-6 rounded-3xl border border-sky-500/10">
                       <p className="text-[10px] font-bold text-slate-400 max-w-[300px]">Cloud synchronization will run in the background. You'll receive a notification in the Mission Control panel onceRetraining is complete.</p>
                       <button className="px-8 py-3 bg-sky-600 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Establish Link</button>
                    </div>
                 </div>
              )}

              {activeSource === 'db' && (
                 <div className="space-y-8">
                    <h3 className="text-xl font-black flex items-center gap-3">
                       <Database className="w-6 h-6 text-amber-400" />
                       Direct SQL Bridge
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Hostname / IP Address</label>
                          <input type="text" placeholder="db.client-server.aws.com" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Port</label>
                          <input type="text" placeholder="5432" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all" />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Database User</label>
                          <input type="text" placeholder="readonly_agent" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Credentials</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all" />
                       </div>
                    </div>
                    <button className="w-full py-4 bg-amber-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-500 transition-all shadow-[0_10px_20px_-10px_rgba(245,158,11,0.5)]">Verify Connection & Sample Data</button>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
