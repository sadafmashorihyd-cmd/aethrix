'use client'
import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, MessageCircle, Heart, Star, UserCheck, Feather } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const TYPE_ICONS = {
    'dm': { icon: MessageCircle, color: '#00F0FF' },
    'reaction': { icon: Heart, color: '#FF6B35' },
    'streak': { icon: Star, color: '#FFD580' },
    'approved': { icon: UserCheck, color: '#00F0FF' },
    'chat': { icon: MessageCircle, color: '#B57BFF' },
    'default': { icon: Bell, color: '#00F0FF' },
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [artist, setArtist] = useState(null)

    useEffect(() => { init() }, [])

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }

        const { data: me } = await supabase
            .from('applications').select('*')
            .eq('email', user.email).eq('status', 'approved').single()
        if (me) setArtist(me)

        if (me) {
            const { data } = await supabase
                .from('notifications').select('*')
                .eq('username', me.username)
                .order('created_at', { ascending: false })
                .limit(50)
            if (data) setNotifications(data)
        }
        setLoading(false)
    }

    const markAllRead = async () => {
        if (!artist) return
        await supabase.from('notifications')
            .update({ read: true })
            .eq('username', artist.username)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const deleteNotif = async (id) => {
        await supabase.from('notifications').delete().eq('id', id)
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const markRead = async (notif) => {
        if (!notif.read) {
            await supabase.from('notifications').update({ read: true }).eq('id', notif.id)
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
        }
        if (notif.link) window.location.href = notif.link
    }

    const timeAgo = (ts) => {
        const diff = Math.floor((new Date() - new Date(ts)) / 1000)
        if (diff < 60) return 'Just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="page-enter pt-24 pb-28 px-4">
            <div className="max-w-2xl mx-auto">

                <div className="flex items-end justify-between mb-10">
                    <div>
                        <span className="section-label">Sacred Alerts</span>
                        <h1 className="font-display text-5xl font-light" style={{ color: 'var(--ghost)' }}>
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-4 text-2xl px-3 py-1 rounded-full align-middle"
                                    style={{ background: 'var(--cyan)', color: 'var(--void)', fontSize: '1rem', fontWeight: 700 }}>
                                    {unreadCount}
                                </span>
                            )}
                        </h1>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="btn-velvet">
                            <Check size={13} /><span>Mark all read</span>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <p className="font-display text-xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-28">
                        <Bell size={40} className="mx-auto mb-5 opacity-15" strokeWidth={0.8} />
                        <p className="font-display text-2xl font-light mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>
                            No notifications yet
                        </p>
                        <p className="text-sm" style={{ color: 'rgba(234,230,242,0.2)' }}>
                            When someone messages you or reacts to your art, you'll see it here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(notif => {
                            const typeConfig = TYPE_ICONS[notif.type] || TYPE_ICONS.default
                            const Icon = typeConfig.icon
                            return (
                                <div key={notif.id}
                                    onClick={() => markRead(notif)}
                                    className="flex items-start gap-4 p-4 rounded-sm cursor-pointer transition-all group"
                                    style={{
                                        background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(0,240,255,0.05)',
                                        border: `1px solid ${notif.read ? 'rgba(255,255,255,0.06)' : 'rgba(0,240,255,0.15)'}`,
                                    }}>

                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ background: `${typeConfig.color}15`, border: `1px solid ${typeConfig.color}25` }}>
                                        <Icon size={16} style={{ color: typeConfig.color }} strokeWidth={1.5} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-relaxed" style={{ color: notif.read ? 'rgba(234,230,242,0.6)' : 'var(--ghost)' }}>
                                            {notif.message}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'rgba(234,230,242,0.25)' }}>
                                            {timeAgo(notif.created_at)}
                                        </p>
                                    </div>

                                    {/* Unread dot */}
                                    {!notif.read && (
                                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                                            style={{ background: 'var(--cyan)' }} />
                                    )}

                                    {/* Delete */}
                                    <button onClick={e => { e.stopPropagation(); deleteNotif(notif.id) }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        style={{ color: 'rgba(234,230,242,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}