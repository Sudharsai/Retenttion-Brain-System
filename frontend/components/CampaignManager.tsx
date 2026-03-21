"use client"

import React, { useState, useEffect } from 'react'
import {
  Mail, Send, Users, ChevronRight, Trash2,
  CheckCircle2, AlertCircle, Clock, RefreshCcw,
  Eye, X, Zap, BarChart3, Target, Filter
} from 'lucide-react'
import { API_BASE_URL } from '../lib/config'

// --- Types ---
interface Campaign {
  id: number
  name: string
  subject: string
  segment: string
  status: 'draft' | 'sending' | 'sent' | 'failed'
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
  sent_at: string | null
}

interface CampaignDetail extends Campaign {
  body: string
  emails: {
    email: string
    name: string
    status: string
    sent_at: string | null
    error: string | null
  }[]
}

const SEGMENTS = [
  { value: 'all', label: 'All Customers', desc: 'Every customer in your dataset', icon: '👥', color: 'blue' },
  { value: 'high_risk', label: 'High Risk', desc: 'Churn probability ≥ 60%', icon: '🔴', color: 'rose' },
  { value: 'persuadable', label: 'Persuadable', desc: 'Moderate risk, high uplift score', icon: '⚡', color: 'emerald' },
]

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  sending: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <RefreshCcw className="w-3 h-3 animate-spin" />, label: 'Sending' },
  sent:    { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Sent' },
  failed:  { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: <AlertCircle className="w-3 h-3" />, label: 'Failed' },
  draft:   { color: 'text-slate-400 bg-white/5 border-white/10', icon: <Clock className="w-3 h-3" />, label: 'Draft' },
}

// --- Main Component ---
export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [testSending, setTestSending] = useState(false)

  // Compose form state
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [segment, setSegment] = useState('high_risk')
  const [testEmail, setTestEmail] = useState('')

  // Detail modal
  const [detail, setDetail] = useState<CampaignDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  // Preview mode
  const [showPreview, setShowPreview] = useState(false)

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      const json = await res.json()
      if (json.success) setCampaigns(json.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
    // Poll every 5s for sending campaigns
    const interval = setInterval(() => {
      if (campaigns.some(c => c.status === 'sending')) {
        fetchCampaigns()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [campaigns.length])

  const handleSendCampaign = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in Campaign Name, Subject, and Message Body.')
      return
    }
    if (!confirm(`Send "${name}" to all ${SEGMENTS.find(s => s.value === segment)?.label} customers now?`)) return

    setSending(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, subject, body, segment })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        // Reset form
        setName('')
        setSubject('')
        setBody('')
        setSegment('high_risk')
        // Refresh list
        await fetchCampaigns()
      } else {
        alert(json.detail || 'Failed to send campaign.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error. Check backend connection.')
    } finally {
      setSending(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail.trim() || !subject.trim() || !body.trim()) {
      alert('Fill in Subject, Body, and a test email address first.')
      return
    }
    setTestSending(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to_email: testEmail, subject, body })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        alert(`✓ Test email sent to ${testEmail}`)
      } else {
        alert(json.detail || 'Test email failed.')
      }
    } catch (err) {
      alert('Network error sending test email.')
    } finally {
      setTestSending(false)
    }
  }

  const handleViewDetail = async (id: number) => {
    setShowDetail(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      const json = await res.json()
      if (json.success) setDetail(json.data)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campaign and all its records?')) return
    try {
      await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token()}` }
      })
      fetchCampaigns()
    } catch (err) {
      console.error(err)
    }
  }

  // --- Email Preview HTML ---
  const previewHTML = `
    <div style="font-family:-apple-system,sans-serif;background:#f4f7fb;padding:40px 20px;">
      <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 36px;">
          <div style="color:white;font-size:20px;font-weight:900;letter-spacing:-0.5px;">Retention Brain</div>
          <div style="color:rgba(255,255,255,0.65);font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Customer Retention Intelligence</div>
        </div>
        <div style="padding:36px;">
          <div style="display:inline-block;background:#eff6ff;color:#3b82f6;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;padding:4px 10px;border-radius:20px;margin-bottom:16px;">Personalized Outreach</div>
          <div style="font-size:17px;font-weight:700;color:#0f172a;margin-bottom:16px;">Hi [Customer Name],</div>
          <div style="font-size:14px;line-height:1.7;color:#475569;white-space:pre-line;">${body || 'Your message will appear here...'}</div>
        </div>
        <div style="padding:20px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <div style="font-size:11px;color:#94a3b8;">You're receiving this because you're a valued customer.</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;">© 2026 Retention Brain · Neural Outreach Engine</div>
        </div>
      </div>
    </div>
  `

  return (
    <div className="space-y-10 animate-in fade-in duration-700">

      {/* ── Compose Panel ── */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/20">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              Compose Campaign
            </h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 ml-12">
              Write once. Send to your entire segment.
            </p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all"
          >
            <Eye className="w-4 h-4" /> Preview Email
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form fields */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Q2 Win-Back Outreach"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. We miss you — here's something special"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your retention message here. Be personal, concise, and include a clear call to action."
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Test email row */}
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="Test email address..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-blue-500/50 transition-all"
              />
              <button
                onClick={handleTestEmail}
                disabled={testSending}
                className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {testSending ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : 'Send Test'}
              </button>
            </div>
          </div>

          {/* Right: Segment selector + send */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3 h-3" /> Target Segment
              </label>
              <div className="space-y-3">
                {SEGMENTS.map(seg => (
                  <div
                    key={seg.value}
                    onClick={() => setSegment(seg.value)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      segment === seg.value
                        ? 'bg-blue-600/15 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{seg.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-black text-white">{seg.label}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{seg.desc}</p>
                      </div>
                      {segment === seg.value && (
                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSendCampaign}
              disabled={sending || !name.trim() || !subject.trim() || !body.trim()}
              className={`w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${
                sending || !name.trim() || !subject.trim() || !body.trim()
                  ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white border border-blue-500 shadow-[0_10px_30px_-5px_rgba(59,130,246,0.4)] hover:scale-[1.02]'
              }`}
            >
              {sending ? (
                <>
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  Sending Campaign...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Launch Campaign
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center">
              Emails sent via SMTP
            </p>
          </div>
        </div>
      </div>

      {/* ── Campaign History ── */}
      <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
            <BarChart3 className="w-4 h-4" />
            Campaign History
          </h3>
          <button
            onClick={fetchCampaigns}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <RefreshCcw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="p-6 bg-white/5 rounded-3xl">
              <Mail className="w-10 h-10 text-slate-700" />
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No campaigns sent yet.</p>
            <p className="text-[10px] text-slate-600">Compose your first campaign above.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {campaigns.map(c => {
              const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft
              const deliveryRate = c.total_recipients > 0
                ? Math.round((c.sent_count / c.total_recipients) * 100)
                : 0
              return (
                <div key={c.id} className="p-6 hover:bg-white/[0.02] transition-all group flex flex-wrap lg:flex-nowrap items-center gap-6">
                  {/* Campaign info */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-black text-white">{c.name}</p>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold italic">"{c.subject}"</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-1">
                      {SEGMENTS.find(s => s.value === c.segment)?.label} · {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recipients</p>
                      <p className="text-lg font-black text-white">{c.total_recipients}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sent</p>
                      <p className="text-lg font-black text-emerald-400">{c.sent_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Failed</p>
                      <p className="text-lg font-black text-rose-400">{c.failed_count}</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery</p>
                      <p className={`text-lg font-black ${deliveryRate >= 90 ? 'text-emerald-400' : deliveryRate >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {deliveryRate}%
                      </p>
                    </div>
                  </div>

                  {/* Delivery progress bar */}
                  <div className="w-32 hidden lg:block">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${deliveryRate >= 90 ? 'bg-emerald-500' : deliveryRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${deliveryRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetail(c.id)}
                      className="p-2.5 bg-white/5 rounded-xl hover:bg-blue-600 hover:text-white text-slate-400 transition-all"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2.5 bg-white/5 rounded-xl hover:bg-rose-500 hover:text-white text-slate-400 transition-all"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Email Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPreview(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-lg font-black text-white">Email Preview</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">How your email will look to recipients</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 bg-[#f4f7fb]">
              <div
                dangerouslySetInnerHTML={{ __html: previewHTML }}
                className="rounded-xl overflow-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Campaign Detail Modal ── */}
      {showDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDetail(false)} />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col glass-card rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">{detail?.name || 'Campaign Detail'}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Per-recipient delivery log</p>
              </div>
              <button onClick={() => { setShowDetail(false); setDetail(null) }} className="p-2.5 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {detailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : detail ? (
                <div className="space-y-8">
                  {/* Summary stats */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total', value: detail.total_recipients, color: 'text-white' },
                      { label: 'Sent', value: detail.sent_count, color: 'text-emerald-400' },
                      { label: 'Failed', value: detail.failed_count, color: 'text-rose-400' },
                      { label: 'Delivery', value: `${detail.total_recipients > 0 ? Math.round((detail.sent_count / detail.total_recipients) * 100) : 0}%`, color: 'text-blue-400' },
                    ].map((s, i) => (
                      <div key={i} className="glass-card p-4 rounded-2xl border border-white/5 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Subject + body preview */}
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</p>
                    <p className="text-sm font-bold text-white">{detail.subject}</p>
                    <div className="h-px bg-white/5" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Body</p>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{detail.body}</p>
                  </div>

                  {/* Recipient table */}
                  <div className="rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase bg-white/5 text-slate-400">
                        <tr>
                          <th className="px-6 py-4 tracking-widest font-black">Recipient</th>
                          <th className="px-6 py-4 tracking-widest font-black text-center">Status</th>
                          <th className="px-6 py-4 tracking-widest font-black text-right">Sent At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {detail.emails.map((e, i) => {
                          const cfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.draft
                          return (
                            <tr key={i} className="hover:bg-white/[0.02] transition-all">
                              <td className="px-6 py-4">
                                <p className="font-bold text-white">{e.name}</p>
                                <p className="text-[10px] text-slate-500">{e.email}</p>
                                {e.error && <p className="text-[10px] text-rose-400 mt-1">{e.error}</p>}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cfg.color}`}>
                                  {cfg.icon} {cfg.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-[10px] text-slate-400 font-bold">
                                {e.sent_at ? new Date(e.sent_at).toLocaleTimeString() : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
