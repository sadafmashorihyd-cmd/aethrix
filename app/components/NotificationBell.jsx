'use client'
import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function NotificationBell() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        fetchCount()

        const channel = supabase
            .channel('notif-bell')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => fetchCount()
            )
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' },
                () => fetchCount()
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    const fetchCount = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: me } = await supabase
            .from('applications').select('username')
            .eq('email', user.email).single()
        if (!me) return

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('username', me.username)
            .eq('read', false)

        setCount(count || 0)
    }

    return (
        <a href="/notifications" className="nav-link hidden sm:flex items-center relative" style={{ padding: '4px' }}>
            <Bell size={18} strokeWidth={1.5} />
            {count > 0 && (
                <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    background: 'var(--cyan)',
                    color: 'var(--void)',
                    fontSize: 10,
                    fontWeight: 700,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                }}>
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </a>
    )
}