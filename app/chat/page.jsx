'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Image, Smile, Edit2, Trash2, Check, X, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const EMOJIS = ['❤️', '🔥', '✨', '👏', '😂', '🎨', '💯', '🙌', '👀', '💜', '🫶', '🥹', '😍', '🤩', '💫', '🌙', '⭐', '🏆', '💎', '🌸', '🦋', '💪', '🙏', '😎', '🤍', '😮', '🎯', '🌊', '🎭', '🖋️']
const COLORS = ['#00F0FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
const getColor = (u) => COLORS[(u?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % COLORS.length]
const fmt = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function ChatPage() {
    const [msgs, setMsgs] = useState([])
    const [newMsg, setNewMsg] = useState('')
    const [artist, setArtist] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [editId, setEditId] = useState(null)
    const [editText, setEditText] = useState('')
    const [emojiFor, setEmojiFor] = useState(null)
    const [showOnline, setShowOnline] = useState(false)
    const [isOnline, setIsOnline] = useState(true)
    const [uploadingImg, setUploadingImg] = useState(false)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        // Kill all page scroll
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        document.body.style.height = '100vh'
        const footer = document.getElementById('site-footer')
        if (footer) footer.style.display = 'none'
        return () => {
            document.documentElement.style.overflow = ''
            document.body.style.overflow = ''
            document.body.style.height = ''
            if (footer) footer.style.display = ''
        }
    }, [])

    useEffect(() => { init() }, [])
    useEffect(() => { bottomRef.current?.scrollIntoView() }, [msgs])

    useEffect(() => {
        if (!artist) return
        upsertOnline(artist.username, isOnline)
        const t = setInterval(() => isOnline && upsertOnline(artist.username, true), 30000)
        return () => { clearInterval(t); upsertOnline(artist.username, false) }
    }, [artist, isOnline])

    const upsertOnline = (u, on) => supabase.from('online_status').upsert({ username: u, is_online: on, last_seen: new Date().toISOString() }, { onConflict: 'username' })

    const fetchOnline = async () => {
        const ago = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data } = await supabase.from('online_status').select('*').eq('is_online', true).gte('last_seen', ago)
        if (data) setOnlineUsers(data)
    }

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('applications').select('*').eq('email', user.email).eq('status', 'approved').single()
            if (data) { setArtist(data); upsertOnline(data.username, true) }
        }
        const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100)
        if (data) setMsgs(data)
        await fetchOnline()
        setLoading(false)

        supabase.channel(`chat-${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => setMsgs(prev => prev.find(m => m.id === p.new.id) ? prev : [...prev, p.new]))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, p => setMsgs(prev => prev.map(m => m.id === p.new.id ? p.new : m)))
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, p => setMsgs(prev => prev.filter(m => m.id !== p.old.id)))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'online_status' }, fetchOnline)
            .subscribe()
    }

    const send = async () => {
        const t = newMsg.trim()
        if (!t || !artist || sending) return
        setSending(true); setNewMsg('')
        await supabase.from('messages').insert({ artist_username: artist.username, artist_name: artist.name, message: t })
        setSending(false); inputRef.current?.focus()
    }

    const saveEdit = async (id) => {
        if (!editText.trim()) return
        await supabase.from('messages').update({ message: editText.trim(), edited: true }).eq('id', id)
        setEditId(null)
    }

    const react = async (msg, emoji) => {
        const r = msg.reactions || {}
        const users = r[emoji] || []
        const u = artist?.username; if (!u) return
        const newUsers = users.includes(u) ? users.filter(x => x !== u) : [...users, u]
        const nr = { ...r, [emoji]: newUsers }
        if (!nr[emoji]?.length) delete nr[emoji]
        await supabase.from('messages').update({ reactions: nr }).eq('id', msg.id)
        setEmojiFor(null)
    }

    const sendImg = async (e) => {
        const file = e.target.files[0]; if (!file || !artist) return
        setUploadingImg(true)
        try {
            const n = `chat-${Date.now()}.${file.name.split('.').pop()}`
            await supabase.storage.from('artworks').upload(n, file)
            const { data } = supabase.storage.from('artworks').getPublicUrl(n)
            await supabase.from('messages').insert({ artist_username: artist.username, artist_name: artist.name, message: '📷 Image', image_url: data.publicUrl })
        } catch (err) { console.error(err) }
        setUploadingImg(false); e.target.value = ''
    }

    const isDeleted = (m) => m.message === '🚫 This message was deleted'
    const onlineNow = (u) => onlineUsers.some(x => x.username === u)

    return (
        <div style={{
            position: 'fixed', inset: 0, top: 64,
            display: 'flex', flexDirection: 'column',
            background: '#080818', zIndex: 10,
            fontFamily: 'system-ui,sans-serif'
        }}>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0D0D22', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                    <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: '#F2EEF8', fontSize: 20, fontWeight: 300 }}>
                        Artist <em style={{ color: '#00F0FF', fontStyle: 'italic' }}>Chat</em>
                    </span>
                    <div style={{ color: 'rgba(234,230,242,0.3)', fontSize: 11, marginTop: 2 }}>{msgs.length} messages</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {artist && (
                        <button onClick={() => setIsOnline(p => { upsertOnline(artist.username, !p); return !p })}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: isOnline ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isOnline ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.1)'}`, color: isOnline ? '#00F0FF' : 'rgba(234,230,242,0.4)', fontSize: 12, cursor: 'pointer' }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#00F0FF' : 'rgba(234,230,242,0.3)' }} />
                            {isOnline ? 'Online' : 'Offline'}
                        </button>
                    )}
                    <button onClick={() => setShowOnline(p => !p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(234,230,242,0.5)', fontSize: 12, cursor: 'pointer' }}>
                        <Users size={12} /> {onlineUsers.length} online
                    </button>
                </div>
            </div>

            {/* Online panel */}
            {showOnline && (
                <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0D0D22', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {onlineUsers.length === 0
                            ? <span style={{ color: 'rgba(234,230,242,0.3)', fontSize: 12 }}>No one online</span>
                            : onlineUsers.map(u => (
                                <a key={u.username} href={`/artist/${u.username}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: '#00F0FF', fontSize: 11, textDecoration: 'none' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00F0FF' }} /> @{u.username}
                                </a>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Messages — THIS is the only scrollable part */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(234,230,242,0.3)', fontSize: 18 }}>Loading...</div>
                ) : msgs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(234,230,242,0.3)', fontSize: 18 }}>No messages yet. Start the conversation!</div>
                ) : msgs.map((msg, i) => {
                    const isMe = msg.artist_username === artist?.username
                    const color = getColor(msg.artist_username)
                    const prev = msgs[i - 1]
                    const showName = !prev || prev.artist_username !== msg.artist_username
                    const editing = editId === msg.id
                    const reactions = msg.reactions || {}
                    const online = onlineNow(msg.artist_username)
                    const del = isDeleted(msg)

                    return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }} className="group">
                            <div style={{ maxWidth: '75%' }}>
                                {showName && !isMe && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, marginLeft: 2 }}>
                                        <span style={{ color, fontSize: 12, fontWeight: 500 }}>{msg.artist_name}</span>
                                        {online && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00F0FF' }} />}
                                        <span style={{ color: 'rgba(234,230,242,0.2)', fontSize: 11 }}>{fmt(msg.created_at)}</span>
                                    </div>
                                )}

                                {msg.image_url && (
                                    <img src={msg.image_url} alt="img" onClick={() => window.open(msg.image_url, '_blank')}
                                        style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 12, cursor: 'pointer', display: 'block', marginBottom: 3 }} />
                                )}

                                {msg.message !== '📷 Image' && (
                                    <div style={{
                                        padding: '10px 14px',
                                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                        background: del ? 'rgba(255,255,255,0.03)' : isMe ? `${color}18` : 'rgba(255,255,255,0.07)',
                                        border: del ? '1px dashed rgba(255,255,255,0.08)' : `1px solid ${isMe ? `${color}28` : 'rgba(255,255,255,0.1)'}`,
                                    }}>
                                        {editing ? (
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <input value={editText} onChange={e => setEditText(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && saveEdit(msg.id)} autoFocus
                                                    style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 10px', color: '#F2EEF8', fontSize: 14, outline: 'none' }} />
                                                <button onClick={() => saveEdit(msg.id)} style={{ color: '#00F0FF', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={14} /></button>
                                                <button onClick={() => setEditId(null)} style={{ color: 'rgba(234,230,242,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <p style={{ color: del ? 'rgba(234,230,242,0.3)' : '#F2EEF8', fontSize: 14, margin: 0, lineHeight: 1.55, fontStyle: del ? 'italic' : 'normal' }}>
                                                {msg.message}
                                            </p>
                                        )}
                                        {msg.edited && !editing && !del && <p style={{ color: 'rgba(234,230,242,0.2)', fontSize: 10, margin: '2px 0 0' }}>edited</p>}
                                    </div>
                                )}

                                {/* Reactions */}
                                {Object.keys(reactions).length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3, marginLeft: 2, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                        {Object.entries(reactions).map(([e, u]) => u.length > 0 && (
                                            <button key={e} onClick={() => artist && react(msg, e)}
                                                style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: u.includes(artist?.username) ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)', border: u.includes(artist?.username) ? '1px solid rgba(0,240,255,0.3)' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                                                {e} {u.length}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Actions on hover */}
                                {artist && !editing && !del && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ display: 'flex', gap: 4, marginTop: 3, justifyContent: isMe ? 'flex-end' : 'flex-start', marginLeft: isMe ? 0 : 2, position: 'relative' }}>
                                        <div style={{ position: 'relative' }}>
                                            <button onClick={() => setEmojiFor(emojiFor === msg.id ? null : msg.id)}
                                                style={{ fontSize: 13, padding: '3px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', color: 'rgba(234,230,242,0.6)' }}>
                                                😊
                                            </button>
                                            {emojiFor === msg.id && (
                                                <div style={{ position: 'absolute', zIndex: 100, bottom: 30, [isMe ? 'right' : 'left']: 0, background: '#0E0E24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 10, width: 230, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                        {EMOJIS.map(em => (
                                                            <button key={em} onClick={() => react(msg, em)}
                                                                style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 6, transition: 'transform 0.1s' }}
                                                                onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
                                                                onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                                                                {em}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {isMe && (
                                            <>
                                                <button onClick={() => { setEditId(msg.id); setEditText(msg.message) }}
                                                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', color: 'rgba(234,230,242,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Edit2 size={10} /> Edit
                                                </button>
                                                <button onClick={() => supabase.from('messages').delete().eq('id', msg.id)}
                                                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(255,68,68,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,68,68,0.7)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Trash2 size={10} /> Delete
                                                </button>
                                                <button onClick={() => supabase.from('messages').update({ message: '🚫 This message was deleted' }).eq('id', msg.id)}
                                                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(255,68,68,0.05)', border: 'none', cursor: 'pointer', color: 'rgba(255,68,68,0.4)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Trash2 size={10} /> Del all
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {isMe && (
                                    <p style={{ color: 'rgba(234,230,242,0.2)', fontSize: 11, textAlign: 'right', marginTop: 2 }}>{fmt(msg.created_at)}</p>
                                )}
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0D0D22', flexShrink: 0 }}>
                {artist ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 720, margin: '0 auto' }}>
                        <label style={{ cursor: 'pointer', color: uploadingImg ? '#00F0FF' : 'rgba(234,230,242,0.4)', display: 'flex', padding: 6, flexShrink: 0 }}>
                            <Image size={22} />
                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={sendImg} disabled={uploadingImg} />
                        </label>
                        <input ref={inputRef} type="text" placeholder="Message all artists... (Enter to send)"
                            value={newMsg} onChange={e => setNewMsg(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                            style={{ flex: 1, padding: '12px 20px', borderRadius: 28, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#F2EEF8', fontSize: 14, outline: 'none' }} />
                        <button onClick={send} disabled={!newMsg.trim() || sending}
                            style={{ width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: newMsg.trim() && !sending ? `linear-gradient(135deg,${getColor(artist.username)},#B57BFF)` : 'rgba(255,255,255,0.07)', border: 'none', cursor: newMsg.trim() && !sending ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.3s' }}>
                            <Send size={18} style={{ color: newMsg.trim() && !sending ? '#03030A' : 'rgba(234,230,242,0.25)' }} />
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', maxWidth: 720, margin: '0 auto' }}>
                        <p style={{ color: 'rgba(234,230,242,0.4)', fontSize: 14, margin: 0 }}>
                            <a href="/login" style={{ color: '#00F0FF' }}>Sign in</a> as a verified artist to chat
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}