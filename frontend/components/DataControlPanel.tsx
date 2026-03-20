"use client"

import React, { useState, useEffect } from 'react'
import { 
  Upload, Database, Cloud, Link, 
  FileText, CheckCircle2, AlertCircle, 
  ArrowRight, Loader2, Trash2, Check, X, Server 
} from 'lucide-react'
import { API_BASE_URL } from '../lib/config'

interface SourceCardProps {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: (id: string) => void;
}

interface Dataset {
  id: number;
  filename: string;
  row_count: number;
  status: string;
  created_at: string;
}

function SourceCard({ id, title, desc, icon, active, onClick }: SourceCardProps) {
  return (
    <div
      onClick={() => onClick(id)}
      className={`p-10 rounded-[2.5rem] border cursor-pointer transition-all group ${
        active 
          ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]' 
          : 'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-6">
        <div className={`p-5 rounded-3xl ${active ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-10 h-10' })}
        </div>
        <div>
          <h4 className="font-black text-xl text-white tracking-tight">{title}</h4>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function DataControlPanel({ onRefresh }: { onRefresh?: () => void }) {
  const [activeSource, setActiveSource] = React.useState<string>('csv');
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<string>('');
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    const isProcessing = datasets.some(ds => ds.status === 'processing');
    if (!isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/v1/customers/datasets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) {
          const newDatasets = result.data;
          const finished = datasets.some(oldDs => 
            oldDs.status === 'processing' && 
            newDatasets.find((n: Dataset) => n.id === oldDs.id)?.status !== 'processing'
          );
          
          setDatasets(newDatasets);
          if (finished && onRefresh) onRefresh();
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [datasets, onRefresh]);

  const fetchDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/customers/datasets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setDatasets(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const handleDeleteDataset = async (id: number) => {
    if (!confirm('Are you sure? This will delete all customers in this dataset.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/customers/datasets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDatasets();
        alert('Dataset deleted successfully.');
      } else {
        const err = await res.json();
        alert(`Deletion failed: ${err.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error during deletion.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} datasets and all their records?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/customers/datasets/bulk-delete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Array.from(selectedIds))
      });
      if (res.ok) {
        setSelectedIds(new Set());
        fetchDatasets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

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
      
      const res = await fetch(`${API_BASE_URL}/api/v1/customers/upload-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await res.json();
      if (res.ok && result.success) {
        setStatus('success');
        fetchDatasets(); // Refresh list
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
    <div className="p-16 space-y-16 w-full max-w-[1900px] mx-auto min-h-screen">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Data Ingestion Hub</h2>
          <p className="text-slate-400 font-bold text-base mt-2 uppercase tracking-[0.4em]">Global Synchronization Control</p>
        </div>
        {selectedIds.size > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Purge Selected ({selectedIds.size})
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-4">
           <SourceCard id="csv" active={activeSource === 'csv'} onClick={setActiveSource} icon={<FileText />} title="Dataset (CSV/Parquet)" desc="Upload local research data" />
           <SourceCard id="s3" active={activeSource === 's3'} onClick={setActiveSource} icon={<Cloud />} title="AWS S3 Bucket" desc="Sync from cloud storage" />
           <SourceCard id="db" active={activeSource === 'db'} onClick={setActiveSource} icon={<Database />} title="Remote Database" desc="Live PostgreSQL/MySQL link" />
        </div>

        <div className="lg:col-span-2 space-y-10">
           <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 flex flex-col">
              {activeSource === 'csv' && (
                <div className="flex-1 flex flex-col">
                   <h3 className="text-xl font-black mb-6 flex items-center gap-3 italic">
                      <Upload className="w-6 h-6 text-blue-400" />
                      Neural Ingestion Zone
                   </h3>
                   
                   <div className="border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center p-12 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />
                      <div className="p-6 bg-blue-600/10 rounded-3xl mb-6 group-hover:scale-110 transition-transform relative z-10">
                         <Upload className="w-12 h-12 text-blue-400" />
                      </div>
                      <p className="text-lg font-black text-white relative z-10">Drop Dataset Matrix</p>
                      <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest text-center max-w-[280px] relative z-10">
                         Max file size: 500MB. Supports .csv, .parquet formats.
                      </p>
                      <input type="file" className="hidden" id="file-upload" onChange={handleFileChange} />
                      <label htmlFor="file-upload" className="mt-8 px-8 py-3 bg-blue-600 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all relative z-10">
                         Access Filesystem
                      </label>
                      {file && (
                        <p className="text-xs font-black text-blue-400 mt-6 bg-blue-400/10 px-4 py-2 rounded-full border border-blue-400/20 animate-pulse">
                          ARMED: {file.name}
                        </p>
                      )}
                   </div>

                   {status === 'success' && (
                      <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-300">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-lg">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-white uppercase tracking-wider">Sync Successful</p>
                               <p className="text-[10px] text-slate-400 font-bold italic underline decoration-emerald-500/30">Binary records integrated into Core Neural Net.</p>
                            </div>
                         </div>
                         <button onClick={() => setStatus('')} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
                      </div>
                   )}

                   <div className="mt-8 flex justify-end">
                      <button 
                        onClick={async () => {
                          await handleUpload();
                        }}
                        disabled={uploading || !file}
                        className="px-10 py-5 bg-blue-600 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)]"
                      >
                         {uploading || status === 'analyzing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}
                         {uploading ? 'Processing Stream...' : status === 'analyzing' ? 'Neural Training...' : 'Initiate Retrieval'}
                      </button>
                   </div>
                </div>
              )}

              {activeSource === 's3' && (
                 <div className="space-y-8">
                    <h3 className="text-xl font-black flex items-center gap-3 text-sky-400">
                       <Cloud className="w-6 h-6" />
                       Cloud Sync Protocol
                    </h3>
                    <div className="p-20 border border-white/5 rounded-3xl bg-white/5 flex flex-col items-center justify-center text-center italic">
                       <Cloud className="w-12 h-12 text-white/10 mb-4" />
                       <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Cloud Integration Module Offline</p>
                       <p className="text-slate-600 text-[10px] mt-2 mt-2">Purchase Enterprise Tier to unlock AWS S3 & Google Cloud Storage sync.</p>
                    </div>
                 </div>
              )}

              {activeSource === 'db' && (
                 <div className="space-y-8">
                    <h3 className="text-xl font-black flex items-center gap-3 text-amber-400">
                       <Database className="w-6 h-6" />
                       Direct Neural Bridge
                    </h3>
                    <div className="p-20 border border-white/5 rounded-3xl bg-white/5 flex flex-col items-center justify-center text-center italic">
                       <Database className="w-12 h-12 text-white/10 mb-4" />
                       <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">SQL Connector Offline</p>
                       <p className="text-slate-600 text-[10px] mt-2">Purchase Professional Tier to unlock live Direct SQL Sync.</p>
                    </div>
                 </div>
              )}
           </div>

           {/* Dataset History Table */}
           <div className="glass-card rounded-[3.5rem] border border-white/5 overflow-hidden">
              <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                  <Database className="w-8 h-8 text-blue-400" />
                  Dataset History
                </h3>
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] bg-white/5 px-6 py-2 rounded-full border border-white/5">
                  Metadata Audit Log
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="p-6 w-10">
                        <div className="w-5 h-5 bg-white/5 border border-white/10 rounded pointer-events-none" />
                      </th>
                      <th className="p-10 text-[11px] font-black text-slate-500 uppercase tracking-widest">Filename</th>
                      <th className="p-10 text-[11px] font-black text-slate-500 uppercase tracking-widest">Records</th>
                      <th className="p-10 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="p-10 text-[11px] font-black text-slate-500 uppercase tracking-widest">Uploaded At</th>
                      <th className="p-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {datasets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-40 text-center italic">
                          <Database className="w-16 h-16 text-white/5 mx-auto mb-6" />
                          <p className="text-slate-500 font-bold text-lg uppercase tracking-widest">No ingestion logs detected</p>
                          <p className="text-sm text-slate-600 mt-3 max-w-md mx-auto">Our neural engines are standing by. Start by uploading a CSV dataset matrix to initiate the analytical sequence.</p>
                        </td>
                      </tr>
                    ) : (
                      datasets.map((ds) => (
                        <tr key={ds.id} className={`group hover:bg-white/[0.02] transition-colors ${selectedIds.has(ds.id) ? 'bg-blue-600/[0.03]' : ''}`}>
                          <td className="p-10">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(ds.id)} 
                              onChange={() => toggleSelect(ds.id)}
                              className="w-6 h-6 rounded border border-white/20 bg-white/5 checked:bg-blue-600 focus:ring-0 transition-all cursor-pointer"
                            />
                          </td>
                          <td className="p-10">
                            <div className="flex items-center gap-4">
                              <FileText className="w-6 h-6 text-blue-400/50 group-hover:text-blue-400 transition-colors" />
                              <span className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{ds.filename}</span>
                            </div>
                          </td>
                          <td className="p-10 text-base font-black text-slate-400">{ds.row_count.toLocaleString()} <span className="text-[10px] text-slate-600 uppercase ml-1">Nodes</span></td>
                          <td className="p-10">
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              ds.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                              ds.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                              'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse'
                            }`}>
                              {ds.status}
                            </span>
                          </td>
                          <td className="p-10 text-sm font-bold text-slate-500 tracking-tight">
                            {new Date(ds.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-10 text-right">
                            <button 
                              onClick={() => handleDeleteDataset(ds.id)}
                              title="Permeantly delete dataset and all related customer records"
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-40 hover:opacity-100 flex items-center gap-2"
                            >
                              <span className="text-[10px] font-black uppercase hidden group-hover:inline">Purge</span>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
