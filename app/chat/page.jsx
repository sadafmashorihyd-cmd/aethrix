'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Image, Smile, Edit2, Trash2, Check, X, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const EMOJIS = ['❤️', '🔥', '✨', '👏', '😂', '🎨', '💯', '🙌', '👀', '💜', '🫶', '🥹', '😍', '🤩', '💫', '🎭', '🖋️', '🌙', '⭐', '🏆', '💎', '🌊', '🌸', '🦋', '🎯', '💪', '🙏', '😎', '🤍', '😮']

const COLORS = ['#00F0FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
const getColor = (u) => COLORS[(u?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % COLORS.length]
const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function ChatPage() {
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState('')
    const [artist, setArtist] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editText, setEditText] = useState('')
    const [showEmoji, setShowEmoji] = useState(null)
    const [showOnline, setShowOnline] = useState(false)
    const [uploadingImg, setUploadingImg] = useState(false)
    const [isOnline, setIsOnline] = useState(true)
    const chatRef = useRef(null)
    const inputRef = useRef(null)
    const channelRef = useRef(null)

    // Fix scroll — hide footer
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        const footer = document.getElementById('site-footer')
        if (footer) footer.style.display = 'none'
        return () => {
            document.body.style.overflow = ''
            if (footer) footer.style.display = ''
        }
    }, [])

    useEffect(() => { init() }, [])

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
    }, [messages])

    useEffect(() => {
        if (!artist) return
        updateOnlineStatus(artist.username, isOnline)
        const interval = setInterval(() => { if (isOnline) updateOnlineStatus(artist.username, true) }, 30000)
        return () => { clearInterval(interval); updateOnlineStatus(artist.username, false) }
    }, [artist, isOnline])

    const updateOnlineStatus = async (username, online) => {
        await supabase.from('online_status').upsert({ username, is_online: online, last_seen: new Date().toISOString() }, { onConflict: 'username' })
    }

    const fetchOnlineUsers = async () => {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data } = await supabase.from('online_status').select('*').eq('is_online', true).gte('last_seen', fiveMinAgo)
        if (data) setOnlineUsers(data)
    }

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('applications').select('*').eq('email', user.email).eq('status', 'approved').single()
            if (data) { setArtist(data); updateOnlineStatus(data.username, true) }
        }
        const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100)
        if (msgs) setMessages(msgs)
        await fetchOnlineUsers()
        setLoading(false)

        const channel = supabase.channel(`chat-${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                p => setMessages(prev => prev.find(m => m.id === p.new.id) ? prev : [...prev, p.new]))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
                p => setMessages(prev => prev.map(m => m.id === p.new.id ? p.new : m)))
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
                p => setMessages(prev => prev.filter(m => m.id !== p.old.id)))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'online_status' },
                () => fetchOnlineUsers())
            .subscribe()
        channelRef.current = channel
        return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
    }

    const sendMessage = async () => {
        const text = newMsg.trim()
        if (!text || !artist || sending) return
        setSending(true)
        setNewMsg('')
        await supabase.from('messages').insert({ artist_username: artist.username, artist_name: artist.name, message: text })
        setSending(false)
        inputRef.current?.focus()
    }

    const saveEdit = async (id) => {
        if (!editText.trim()) return
        await supabase.from('messages').update({ message: editText.trim(), edited: true }).eq('id', id)
        setEditingId(null)
    }

    const addReaction = async (msg, emoji) => {
        const reactions = msg.reactions || {}
        const users = reactions[emoji] || []
        const username = artist?.username
        if (!username) return
        const newUsers = users.includes(username) ? users.filter(u => u !== username) : [...users, username]
        const newReactions = { ...reactions, [emoji]: newUsers }
        if (newReactions[emoji]?.length === 0) delete newReactions[emoji]
        await supabase.from('messages').update({ reactions: newReactions }).eq('id', msg.id)
        setShowEmoji(null)
    }

    const sendImage = async (e) => {
        const file = e.target.files[0]
        if (!file || !artist) return
        setUploadingImg(true)
        try {
            const fileName = `chat-${Date.now()}.${file.name.split('.').pop()}`
            await supabase.storage.from('artworks').upload(fileName, file)
            const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(fileName)
            await supabase.from('messages').insert({ artist_username: artist.username, artist_name: artist.name, message: '📷 Image', image_url: urlData.publicUrl })
        } catch (err) { console.error(err) }
        setUploadingImg(false)
        e.target.value = ''
    }

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
    const isUserOnline = (username) => onlineUsers.some(u => u.username === username)

    return (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', background: 'var(--void)', zIndex: 10 }}>
            <div style={{ maxWidth: 720, width: '100%', display: 'flex', flexDirection: 'column', height: '100%', padding: '0 16px' }}>

                {/* Header */}
                <div style={{ padding: '16px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div>
                        <p className="font-display" style={{ color: 'var(--ghost)', fontSize: 22, fontWeight: 300, margin: 0 }}>
                            Artist <em style={{ color: 'var(--cyan)', fontStyle: 'italic' }}>Chat</em>
                        </p>
                        <p style={{ color: 'rgba(234,230,242,0.3)', fontSize: 12, margin: '2px 0 0' }}>{messages.length} messages</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {artist && (
                            <button onClick={() => { const n = !isOnline; setIsOnline(n); updateOnlineStatus(artist.username, n) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: isOnline ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isOnline ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.1)'}`, color: isOnline ? 'var(--cyan)' : 'rgba(234,230,242,0.4)', fontSize: 12, cursor: 'pointer' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#00F0FF' : 'rgba(234,230,242,0.3)' }} />
                                {isOnline ? 'Online' : 'Offline'}
                            </button>
                        )}
                        <button onClick={() => setShowOnline(!showOnline)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(234,230,242,0.5)', fontSize: 12, cursor: 'pointer' }}>
                            <Users size={12} /> {onlineUsers.length} online
                        </button>
                    </div>
                </div>

                {/* Online panel */}
                {showOnline && (
                    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {onlineUsers.length === 0
                                ? <span style={{ color: 'rgba(234,230,242,0.3)', fontSize: 12 }}>No one online</span>
                                : onlineUsers.map(u => (
                                    <a key={u.username} href={`/artist/${u.username}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--cyan)', fontSize: 11, textDecoration: 'none' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00F0FF' }} />
                                        @{u.username}
                                    </a>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p className="font-display" style={{ color: 'rgba(234,230,242,0.3)', fontSize: 18 }}>Loading...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <p className="font-display" style={{ color: 'rgba(234,230,242,0.3)', fontSize: 18 }}>No messages yet. Start the conversation!</p>
                        </div>
                    ) : messages.map((msg, i) => {
                        const isMe = msg.artist_username === artist?.username
                        const color = getColor(msg.artist_username)
                        const prev = messages[i - 1]
                        const showName = !prev || prev.artist_username !== msg.artist_username
                        const isEditing = editingId === msg.id
                        const reactions = msg.reactions || {}
                        const online = isUserOnline(msg.artist_username)
                        const isDeleted = msg.message === '🚫 This message was deleted'

                        return (
                            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }} className="group">
                                <div style={{ maxWidth: '78%' }}>
                                    {showName && !isMe && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, marginLeft: 4 }}>
                                            <span style={{ color, fontSize: 12, fontWeight: 500 }}>{msg.artist_name}</span>
                                            {online && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00F0FF' }} />}
                                            <span style={{ color: 'rgba(234,230,242,0.2)', fontSize: 11 }}>{formatTime(msg.created_at)}</span>
                                        </div>
                                    )}

                                    {msg.image_url && (
                                        <img src={msg.image_url} alt="img" onClick={() => window.open(msg.image_url, '_blank')}
                                            style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 12, cursor: 'pointer', display: 'block', marginBottom: 2 }} />
                                    )}

                                    {msg.message !== '📷 Image' && (
                                        <div style={{
                                            padding: '10px 14px',
                                            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: isDeleted ? 'rgba(255,255,255,0.03)' : isMe ? `${color}18` : 'rgba(255,255,255,0.06)',
                                            border: isDeleted ? '1px dashed rgba(255,255,255,0.1)' : `1px solid ${isMe ? `${color}28` : 'rgba(255,255,255,0.09)'}`,
                                        }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <input value={editText} onChange={e => setEditText(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit(msg.id)}
                                                        autoFocus style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 10px', color: 'var(--ghost)', fontSize: 14, outline: 'none' }} />
                                                    <button onClick={() => saveEdit(msg.id)} style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={14} /></button>
                                                    <button onClick={() => setEditingId(null)} style={{ color: 'rgba(234,230,242,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <p style={{ color: isDeleted ? 'rgba(234,230,242,0.3)' : 'var(--ghost)', fontSize: 14, margin: 0, lineHeight: 1.55, fontStyle: isDeleted ? 'italic' : 'normal' }}>
                                                    {msg.message}
                                                </p>
                                            )}
                                            {msg.edited && !isEditing && !isDeleted && (
                                                <p style={{ color: 'rgba(234,230,242,0.2)', fontSize: 10, margin: '2px 0 0' }}>edited</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Reactions */}
                                    {Object.keys(reactions).length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, marginLeft: 2 }}>
                                            {Object.entries(reactions).map(([emoji, users]) => users.length > 0 && (
                                                <button key={emoji} onClick={() => artist && addReaction(msg, emoji)}
                                                    style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: users.includes(artist?.username) ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)', border: users.includes(artist?.username) ? '1px solid rgba(0,240,255,0.3)' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                                                    {emoji} {users.length}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions on hover */}
                                    {artist && !isEditing && !isDeleted && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: isMe ? 'flex-end' : 'flex-start', marginLeft: isMe ? 0 : 4 }}>
                                            <div style={{ position: 'relative' }}>
                                                <button onClick={() => setShowEmoji(showEmoji === msg.id ? null : msg.id)}
                                                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(234,230,242,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Smile size={10} /> React
                                                </button>
                                                {showEmoji === msg.id && (
                                                    <div style={{ position: 'absolute', zIndex: 50, bottom: 28, left: 0, background: '#0E0E24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 8, width: 220 }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                            {EMOJIS.map(emoji => (
                                                                <button key={emoji} onClick={() => addReaction(msg, emoji)}
                                                                    style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 4, transition: 'transform 0.1s' }}
                                                                    onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
                                                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {isMe && (
                                                <>
                                                    <button onClick={() => { setEditingId(msg.id); setEditText(msg.message) }}
                                                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(234,230,242,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <Edit2 size={10} /> Edit
                                                    </button>
                                                    <button onClick={() => supabase.from('messages').delete().eq('id', msg.id)}
                                                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: 'rgba(255,68,68,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,68,68,0.7)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <Trash2 size={10} /> Delete
                                                    </button>
                                                    <button onClick={() => supabase.from('messages').update({ message: '🚫 This message was deleted' }).eq('id', msg.id)}
                                                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: 'rgba(255,68,68,0.05)', border: 'none', cursor: 'pointer', color: 'rgba(255,68,68,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <Trash2 size={10} /> Del for all
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {isMe && (
                                        <p style={{ color: 'rgba(234,230,242,0.2)', fontSize: 11, textAlign: 'right', marginTop: 2 }}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Input */}
                <div style={{ padding: '10px 0 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {artist ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={{ cursor: 'pointer', color: uploadingImg ? 'var(--cyan)' : 'rgba(234,230,242,0.4)', padding: 6, display: 'flex' }}>
                                <Image size={20} />
                                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={sendImage} disabled={uploadingImg} />
                            </label>
                            <input ref={inputRef} type="text"
                                placeholder="Message all artists... (Enter to send)"
                                value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKey}
                                style={{ flex: 1, padding: '11px 18px', borderRadius: 25, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--ghost)', fontSize: 14, outline: 'none' }} />
                            <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                                style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: newMsg.trim() && !sending ? `linear-gradient(135deg, ${getColor(artist.username)}, #B57BFF)` : 'rgba(255,255,255,0.06)', border: 'none', cursor: newMsg.trim() && !sending ? 'pointer' : 'default', flexShrink: 0 }}>
                                <Send size={17} style={{ color: newMsg.trim() && !sending ? 'var(--void)' : 'rgba(234,230,242,0.25)' }} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p style={{ color: 'rgba(234,230,242,0.4)', fontSize: 14 }}>
                                <a href="/login" style={{ color: 'var(--cyan)' }}>Sign in</a> as a verified artist to chat
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}