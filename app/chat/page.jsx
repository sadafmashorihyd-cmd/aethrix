'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Image, Smile, Edit2, Trash2, Check, X, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const EMOJIS = ['❤️', '🔥', '✨', '👏', '😂', '🎨', '💯', '🙌', '👀', '💜', '🫶', '🥹', '😍', '🤩', '💫', '🎭', '🖋️', '🌙', '⭐', '🏆', '💎', '🌊', '🌸', '🦋', '🎯', '💪', '🙏', '😎', '🤍', '😮']

function timeAgo(ts) {
    const d = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (d < 60) return 'just now'
    if (d < 3600) return `${Math.floor(d / 60)}m ago`
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`
    return new Date(ts).toLocaleDateString()
}

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

    useEffect(() => {
        init()
        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current)
        }
    }, [])

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
    }, [messages])

    // Update online status every 30 seconds
    useEffect(() => {
        if (!artist) return
        updateOnlineStatus(artist.username, isOnline)
        const interval = setInterval(() => {
            if (isOnline) updateOnlineStatus(artist.username, true)
        }, 30000)
        return () => {
            clearInterval(interval)
            updateOnlineStatus(artist.username, false)
        }
    }, [artist, isOnline])

    const updateOnlineStatus = async (username, online) => {
        await supabase.from('online_status').upsert({
            username,
            is_online: online,
            last_seen: new Date().toISOString(),
        }, { onConflict: 'username' })
    }

    const fetchOnlineUsers = async () => {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data } = await supabase
            .from('online_status')
            .select('username, is_online, last_seen')
            .eq('is_online', true)
            .gte('last_seen', fiveMinAgo)
        if (data) setOnlineUsers(data)
    }

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from('applications').select('*')
                .eq('email', user.email).eq('status', 'approved').single()
            if (data) {
                setArtist(data)
                updateOnlineStatus(data.username, true)
            }
        }

        // Fetch messages
        const { data: msgs } = await supabase
            .from('messages').select('*')
            .order('created_at', { ascending: true }).limit(100)
        if (msgs) setMessages(msgs)

        await fetchOnlineUsers()
        setLoading(false)

        // Realtime subscription
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
    }

    const sendMessage = async () => {
        const text = newMsg.trim()
        if (!text || !artist || sending) return
        setSending(true)
        setNewMsg('')
        await supabase.from('messages').insert({
            artist_username: artist.username,
            artist_name: artist.name,
            message: text,
        })
        setSending(false)
        inputRef.current?.focus()
    }

    const saveEdit = async (id) => {
        if (!editText.trim()) return
        await supabase.from('messages').update({ message: editText.trim(), edited: true }).eq('id', id)
        setEditingId(null)
    }

    const deleteForMe = async (id) => {
        await supabase.from('messages').delete().eq('id', id)
    }

    const deleteForEveryone = async (id) => {
        await supabase.from('messages').update({ message: '🚫 This message was deleted', edited: false }).eq('id', id)
    }

    const addReaction = async (msg, emoji) => {
        const reactions = msg.reactions || {}
        const users = reactions[emoji] || []
        const username = artist?.username
        if (!username) return
        const newUsers = users.includes(username) ? users.filter(u => u !== username) : [...users, username]
        const newReactions = { ...reactions, [emoji]: newUsers }
        if (newReactions[emoji].length === 0) delete newReactions[emoji]
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
            await supabase.from('messages').insert({
                artist_username: artist.username,
                artist_name: artist.name,
                message: '📷 Image',
                image_url: urlData.publicUrl,
            })
        } catch (err) { console.error(err) }
        setUploadingImg(false)
        e.target.value = ''
    }

    const toggleOnlineStatus = async () => {
        if (!artist) return
        const newStatus = !isOnline
        setIsOnline(newStatus)
        await updateOnlineStatus(artist.username, newStatus)
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    const COLORS = ['#00F0FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
    const getColor = (u) => COLORS[(u?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % COLORS.length]
    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const isUserOnline = (username) => onlineUsers.some(u => u.username === username)

    return (
        <div className="page-enter pt-16" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="max-w-3xl mx-auto w-full px-4 flex flex-col flex-1" style={{ minHeight: 0 }}>

                {/* Header */}
                <div className="py-5 flex items-center justify-between flex-shrink-0">
                    <div>
                        <span className="section-label">Sacred Space</span>
                        <h1 className="font-display text-3xl font-light" style={{ color: 'var(--ghost)' }}>
                            Artist <em className="italic" style={{ color: 'var(--cyan)' }}>Chat</em>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Online status toggle */}
                        {artist && (
                            <button onClick={toggleOnlineStatus}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all"
                                style={{
                                    background: isOnline ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${isOnline ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                    color: isOnline ? 'var(--cyan)' : 'rgba(234,230,242,0.4)',
                                }}>
                                <div className="w-2 h-2 rounded-full" style={{ background: isOnline ? '#00F0FF' : 'rgba(234,230,242,0.3)' }} />
                                {isOnline ? 'Online' : 'Offline'}
                            </button>
                        )}
                        {/* Online users count */}
                        <button onClick={() => setShowOnline(!showOnline)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(234,230,242,0.5)' }}>
                            <Users size={12} />
                            {onlineUsers.length} online
                        </button>
                    </div>
                </div>

                {/* Online users panel */}
                {showOnline && (
                    <div className="mb-4 p-3 rounded-sm flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(234,230,242,0.3)' }}>
                            Online Now ({onlineUsers.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {onlineUsers.map(u => (
                                <a key={u.username} href={`/artist/${u.username}`}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                                    style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--cyan)' }}>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00F0FF' }} />
                                    @{u.username}
                                </a>
                            ))}
                            {onlineUsers.length === 0 && (
                                <p className="text-xs" style={{ color: 'rgba(234,230,242,0.3)' }}>No one online right now</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div ref={chatRef} className="flex-1 overflow-y-auto rounded-sm p-4 space-y-2 mb-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 0 }}>

                    {loading ? (
                        <div className="text-center py-10">
                            <p className="font-display text-lg font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="font-display text-xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                No messages yet. Start the conversation!
                            </p>
                        </div>
                    ) : messages.map((msg, i) => {
                        const isMe = msg.artist_username === artist?.username
                        const color = getColor(msg.artist_username)
                        const prev = messages[i - 1]
                        const showName = !prev || prev.artist_username !== msg.artist_username
                        const isEditing = editingId === msg.id
                        const reactions = msg.reactions || {}
                        const online = isUserOnline(msg.artist_username)

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                <div style={{ maxWidth: '78%' }}>
                                    {showName && !isMe && (
                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                            <div className="relative">
                                                <span className="text-xs tracking-wider" style={{ color }}>{msg.artist_name}</span>
                                                {online && (
                                                    <div className="absolute -top-0.5 -right-2.5 w-1.5 h-1.5 rounded-full" style={{ background: '#00F0FF' }} />
                                                )}
                                            </div>
                                            <span className="text-xs" style={{ color: 'rgba(234,230,242,0.2)' }}>{formatTime(msg.created_at)}</span>
                                        </div>
                                    )}

                                    {/* Image */}
                                    {msg.image_url && (
                                        <img src={msg.image_url} alt="shared"
                                            onClick={() => window.open(msg.image_url, '_blank')}
                                            className="rounded-sm mb-1 cursor-pointer"
                                            style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                                    )}

                                    {/* Message bubble */}
                                    {msg.message !== '📷 Image' && (
                                        <div className="rounded-sm px-4 py-2.5"
                                            style={{
                                                background: isMe ? `${color}18` : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${isMe ? `${color}30` : 'rgba(255,255,255,0.08)'}`,
                                            }}>
                                            {isEditing ? (
                                                <div className="flex gap-2 items-center">
                                                    <input value={editText} onChange={e => setEditText(e.target.value)}
                                                        className="input-sacred flex-1 py-1 text-sm"
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit(msg.id)} autoFocus />
                                                    <button onClick={() => saveEdit(msg.id)} style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={14} /></button>
                                                    <button onClick={() => setEditingId(null)} style={{ color: 'rgba(234,230,242,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <p className="text-sm leading-relaxed" style={{ color: msg.message === '🚫 This message was deleted' ? 'rgba(234,230,242,0.3)' : 'var(--ghost)', fontStyle: msg.message === '🚫 This message was deleted' ? 'italic' : 'normal' }}>
                                                    {msg.message}
                                                </p>
                                            )}
                                            {msg.edited && !isEditing && msg.message !== '🚫 This message was deleted' && (
                                                <p className="text-xs mt-0.5" style={{ color: 'rgba(234,230,242,0.2)' }}>edited</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Reactions */}
                                    {Object.keys(reactions).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 ml-1">
                                            {Object.entries(reactions).map(([emoji, users]) =>
                                                users.length > 0 && (
                                                    <button key={emoji} onClick={() => artist && addReaction(msg, emoji)}
                                                        className="text-xs px-2 py-0.5 rounded-full transition-all"
                                                        style={{
                                                            background: users.includes(artist?.username) ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
                                                            border: users.includes(artist?.username) ? '1px solid rgba(0,240,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                                        }}>
                                                        {emoji} {users.length}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Action buttons on hover */}
                                    {artist && !isEditing && msg.message !== '🚫 This message was deleted' && (
                                        <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : 'justify-start ml-1'}`}>

                                            {/* Emoji react */}
                                            <div className="relative">
                                                <button onClick={() => setShowEmoji(showEmoji === msg.id ? null : msg.id)}
                                                    className="text-xs px-2 py-0.5 rounded-sm flex items-center gap-1"
                                                    style={{ color: 'rgba(234,230,242,0.4)', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}>
                                                    <Smile size={10} /> React
                                                </button>
                                                {showEmoji === msg.id && (
                                                    <div className="absolute z-50 p-2 rounded-sm shadow-xl"
                                                        style={{ background: '#0E0E24', border: '1px solid rgba(255,255,255,0.12)', width: 220, bottom: 28, left: 0 }}>
                                                        <div className="flex flex-wrap gap-1">
                                                            {EMOJIS.map(emoji => (
                                                                <button key={emoji} onClick={() => addReaction(msg, emoji)}
                                                                    className="text-lg hover:scale-125 transition-transform p-0.5"
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Edit — only own */}
                                            {isMe && (
                                                <button onClick={() => { setEditingId(msg.id); setEditText(msg.message) }}
                                                    className="text-xs px-2 py-0.5 rounded-sm flex items-center gap-1"
                                                    style={{ color: 'rgba(234,230,242,0.4)', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}>
                                                    <Edit2 size={10} /> Edit
                                                </button>
                                            )}

                                            {/* Delete for me */}
                                            {isMe && (
                                                <button onClick={() => deleteForMe(msg.id)}
                                                    className="text-xs px-2 py-0.5 rounded-sm flex items-center gap-1"
                                                    style={{ color: 'rgba(255,68,68,0.6)', background: 'rgba(255,68,68,0.08)', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={10} /> Delete
                                                </button>
                                            )}

                                            {/* Delete for everyone — only own */}
                                            {isMe && (
                                                <button onClick={() => deleteForEveryone(msg.id)}
                                                    className="text-xs px-2 py-0.5 rounded-sm flex items-center gap-1"
                                                    style={{ color: 'rgba(255,68,68,0.4)', background: 'rgba(255,68,68,0.05)', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={10} /> Del for all
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Time for own messages */}
                                    {isMe && (
                                        <p className="text-xs mt-1 text-right mr-1" style={{ color: 'rgba(234,230,242,0.2)' }}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Input */}
                <div className="pb-5 flex-shrink-0">
                    {artist ? (
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer flex-shrink-0 p-2"
                                style={{ color: uploadingImg ? 'var(--cyan)' : 'rgba(234,230,242,0.4)' }}>
                                <Image size={20} />
                                <input type="file" className="hidden" accept="image/*" onChange={sendImage} disabled={uploadingImg} />
                            </label>
                            <input ref={inputRef} type="text"
                                placeholder="Message all artists... (Enter to send)"
                                value={newMsg}
                                onChange={e => setNewMsg(e.target.value)}
                                onKeyDown={handleKey}
                                style={{
                                    flex: 1, padding: '11px 18px', borderRadius: 25,
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'var(--ghost)', fontSize: 14, outline: 'none',
                                }}
                            />
                            <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                                style={{
                                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: newMsg.trim() && !sending ? 'linear-gradient(135deg, var(--cyan), var(--violet))' : 'rgba(255,255,255,0.06)',
                                    border: 'none', cursor: newMsg.trim() && !sending ? 'pointer' : 'default',
                                }}>
                                <Send size={17} style={{ color: newMsg.trim() && !sending ? 'var(--void)' : 'rgba(234,230,242,0.25)' }} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-4 rounded-sm"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-sm" style={{ color: 'rgba(234,230,242,0.4)' }}>
                                <a href="/login" style={{ color: 'var(--cyan)' }}>Sign in</a> as a verified artist to chat
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}