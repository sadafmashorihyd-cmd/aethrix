'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Feather } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ChatPage() {
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState('')
    const [artist, setArtist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        checkUser()
        fetchMessages()

        // Real-time subscription
        const channel = supabase
            .channel('messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    setMessages(prev => [...prev, payload.new])
                }
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from('applications')
                .select('*')
                .eq('email', user.email)
                .eq('status', 'approved')
                .single()
            if (data) setArtist(data)
        }
        setLoading(false)
    }

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100)
        if (data) setMessages(data)
    }

    const sendMessage = async () => {
        if (!newMsg.trim() || !artist || sending) return
        setSending(true)
        await supabase.from('messages').insert({
            artist_username: artist.username,
            artist_name: artist.name,
            message: newMsg.trim(),
        })
        setNewMsg('')
        setSending(false)
    }

    const COLORS = ['#00E5FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
    const getColor = (username) => {
        const hash = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        return COLORS[hash % COLORS.length]
    }

    const formatTime = (ts) => {
        const d = new Date(ts)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="page-enter pt-24 pb-0 px-4" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="max-w-3xl mx-auto w-full flex flex-col flex-1">

                {/* Header */}
                <div className="mb-6">
                    <span className="section-label">Sacred Space</span>
                    <h1 className="font-display text-4xl font-light" style={{ color: 'var(--ghost)' }}>
                        Artist <em className="italic" style={{ color: 'var(--cyan)' }}>Chat</em>
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'rgba(234,230,242,0.3)' }}>
                        Only verified artists can chat here
                    </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto rounded-sm p-4 mb-4 space-y-4"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 0 }}>

                    {loading ? (
                        <div className="text-center py-10">
                            <p className="font-display text-lg font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16">
                            <Feather size={32} className="mx-auto mb-4 opacity-20" strokeWidth={0.8} />
                            <p className="font-display text-xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                No messages yet. Start the conversation!
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.artist_username === artist?.username
                            const color = getColor(msg.artist_username)
                            const prevMsg = messages[i - 1]
                            const showName = !prevMsg || prevMsg.artist_username !== msg.artist_username

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div style={{ maxWidth: '75%' }}>
                                        {showName && !isMe && (
                                            <div className="flex items-center gap-2 mb-1 ml-1">
                                                <a href={`/artist/${msg.artist_username}`}
                                                    className="text-xs tracking-wider font-light"
                                                    style={{ color }}>
                                                    {msg.artist_name}
                                                </a>
                                                <span className="text-xs" style={{ color: 'rgba(234,230,242,0.2)' }}>
                                                    {formatTime(msg.created_at)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="rounded-sm px-4 py-2.5"
                                            style={{
                                                background: isMe ? `${color}15` : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${isMe ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
                                            }}>
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--ghost)' }}>
                                                {msg.message}
                                            </p>
                                        </div>
                                        {isMe && (
                                            <p className="text-xs mt-1 text-right mr-1" style={{ color: 'rgba(234,230,242,0.2)' }}>
                                                {formatTime(msg.created_at)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="pb-6">
                    {artist ? (
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Share your thoughts with fellow artists..."
                                value={newMsg}
                                onChange={e => setNewMsg(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                className="input-sacred flex-1"
                                style={{ borderColor: 'rgba(0,229,255,0.2)' }}
                            />
                            <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                                className="btn-ember px-5"
                                style={{ opacity: !newMsg.trim() || sending ? 0.5 : 1 }}>
                                <Send size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-4 rounded-sm"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-sm" style={{ color: 'rgba(234,230,242,0.4)' }}>
                                <a href="/login" style={{ color: 'var(--cyan)' }}>Sign in</a> as a verified artist to join the conversation
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}