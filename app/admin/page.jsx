'use client'
import { useState, useEffect } from 'react'
import { Check, X, Eye, Feather, Clock, Users, Image } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending')
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        fetchApplications()
    }, [filter])

    const fetchApplications = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('status', filter)
            .order('created_at', { ascending: false })
        if (!error) setApplications(data || [])
        setLoading(false)
    }

    const updateStatus = async (id, status) => {
        const { error } = await supabase
            .from('applications')
            .update({ status })
            .eq('id', id)
        if (!error) {
            fetchApplications()
            setSelected(null)
        }
    }

    const FILTERS = [
        { id: 'pending', label: 'Pending', icon: Clock },
        { id: 'approved', label: 'Approved', icon: Check },
        { id: 'rejected', label: 'Rejected', icon: X },
    ]

    return (
        <div className="page-enter pt-24 pb-28 px-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <span className="section-label">Sacred Admin</span>
                    <h1 className="font-display text-5xl font-light" style={{ color: 'var(--ghost)' }}>
                        Artist <em className="italic" style={{ color: 'var(--cyan)' }}>Applications</em>
                    </h1>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-3 mb-8">
                    {FILTERS.map(f => {
                        const Icon = f.icon
                        return (
                            <button key={f.id} onClick={() => setFilter(f.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs tracking-widest uppercase transition-all duration-300"
                                style={{
                                    background: filter === f.id ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${filter === f.id ? 'var(--cyan)' : 'rgba(255,255,255,0.08)'}`,
                                    color: filter === f.id ? 'var(--cyan)' : 'rgba(234,230,242,0.4)',
                                }}>
                                <Icon size={12} />
                                {f.label}
                            </button>
                        )
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Applications List */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-20">
                                <p className="font-display text-xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-20">
                                <Feather size={32} className="mx-auto mb-4 opacity-20" strokeWidth={0.8} />
                                <p className="font-display text-xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                    No {filter} applications
                                </p>
                            </div>
                        ) : applications.map(app => (
                            <div key={app.id}
                                onClick={() => setSelected(app)}
                                className="p-4 rounded-sm cursor-pointer transition-all duration-300"
                                style={{
                                    background: selected?.id === app.id ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${selected?.id === app.id ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                }}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{app.name}</p>
                                        <p className="text-xs tracking-wider" style={{ color: 'rgba(234,230,242,0.4)' }}>@{app.username}</p>
                                        <p className="text-xs mt-1" style={{ color: 'rgba(234,230,242,0.25)' }}>{app.medium} · {app.mood}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {filter === 'pending' && (
                                            <>
                                                <button onClick={e => { e.stopPropagation(); updateStatus(app.id, 'approved') }}
                                                    className="w-8 h-8 rounded-sm flex items-center justify-center transition-all"
                                                    style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
                                                    <Check size={14} style={{ color: 'var(--cyan)' }} />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); updateStatus(app.id, 'rejected') }}
                                                    className="w-8 h-8 rounded-sm flex items-center justify-center transition-all"
                                                    style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>
                                                    <X size={14} style={{ color: '#FF4444' }} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs mt-2" style={{ color: 'rgba(234,230,242,0.2)' }}>
                                    {new Date(app.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Detail Panel */}
                    <div className="sticky top-24">
                        {selected ? (
                            <div className="rounded-sm p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {/* Artwork image */}
                                {selected.image_url && (
                                    <div className="mb-5 rounded-sm overflow-hidden aspect-video relative"
                                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <img src={selected.image_url} alt={selected.title}
                                            className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <h2 className="font-display text-2xl font-light mb-1" style={{ color: 'var(--ghost)' }}>{selected.name}</h2>
                                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--cyan)' }}>@{selected.username}</p>

                                <div className="space-y-3 mb-5">
                                    {[
                                        { label: 'Email', val: selected.email },
                                        { label: 'Medium', val: selected.medium },
                                        { label: 'Mood', val: selected.mood },
                                    ].map(r => (
                                        <div key={r.label} className="flex justify-between text-sm">
                                            <span style={{ color: 'rgba(234,230,242,0.3)' }}>{r.label}</span>
                                            <span style={{ color: 'var(--ghost)' }}>{r.val}</span>
                                        </div>
                                    ))}
                                </div>

                                {selected.bio && (
                                    <div className="mb-5 p-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Manifesto</p>
                                        <p className="font-display text-sm font-light italic leading-relaxed" style={{ color: 'rgba(234,230,242,0.6)' }}>
                                            "{selected.bio}"
                                        </p>
                                    </div>
                                )}

                                {selected.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <button onClick={() => updateStatus(selected.id, 'approved')}
                                            className="flex-1 btn-ember justify-center">
                                            <Check size={14} />
                                            <span>Approve</span>
                                        </button>
                                        <button onClick={() => updateStatus(selected.id, 'rejected')}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-xs tracking-widest uppercase transition-all"
                                            style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444' }}>
                                            <X size={14} />
                                            <span>Reject</span>
                                        </button>
                                    </div>
                                )}

                                {selected.status === 'approved' && (
                                    <div className="text-center p-3 rounded-sm" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>
                                        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--cyan)' }}>✓ Approved Artist</p>
                                    </div>
                                )}

                                {selected.status === 'rejected' && (
                                    <div className="text-center p-3 rounded-sm" style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)' }}>
                                        <p className="text-xs tracking-widest uppercase" style={{ color: '#FF4444' }}>✗ Application Rejected</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-sm p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Eye size={32} className="mx-auto mb-4 opacity-20" strokeWidth={0.8} />
                                <p className="font-display text-lg font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                    Select an application to review
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}