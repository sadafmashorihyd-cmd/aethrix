'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Feather, Trash2, Edit2, Check, X, Image } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ChatPage() {
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState('')
    const [artist, setArtist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editText, setEditText] = useState('')
    const [uploadingImg, setUploadingImg] = useState(false)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        init()
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const init = async () => {
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

        const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100)
        if (msgs) setMessages(msgs)
        setLoading(false)

        const channel = supabase
            .channel('chat-room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                payload => setMessages(prev => {
                    if (prev.find(m => m.id === payload.new.id)) return prev
                    return [...prev, payload.new]
                })
            )
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
                payload => setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
            )
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
                payload => setMessages(prev => prev.filter(m => m.id !== payload.old.id))
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
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

    const deleteMessage = async (id) => {
        await supabase.from('messages').delete().eq('id', id)
    }

    const startEdit = (msg) => {
        setEditingId(msg.id)
        setEditText(msg.message)
    }

    const saveEdit = async (id) => {
        if (!editText.trim()) return
        await supabase.from('messages').update({ message: editText.trim(), edited: true }).eq('id', id)
        setEditingId(null)
        setEditText('')
    }

    const sendImage = async (e) => {
        const file = e.target.files[0]
        if (!file || !artist) return
        setUploadingImg(true)
        try {
            const fileName = `chat-${Date.now()}.${file.name.split('.').pop()}`
            const { error: upErr } = await supabase.storage.from('artworks').upload(fileName, file)
            if (upErr) throw upErr
            const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(fileName)
            await supabase.from('messages').insert({
                artist_username: artist.username,
                artist_name: artist.name,
                message: '📷 Image',
                image_url: urlData.publicUrl,
            })
        } catch (err) { console.error(err) }
        setUploadingImg(false)
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    const COLORS = ['#00E5FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
    const getColor = (username) => {
        const hash = username?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0
        return COLORS[hash % COLORS.length]
    }
    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="page-enter" style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '4rem' }}>
            <div className="max-w-3xl mx-auto w-full px-4 flex flex-col flex-1" style={{ minHeight: 0 }}>

                <div className="py-6 flex-shrink-0">
                    <span className="section-label">Sacred Space</span>
                    <h1 className="font-display text-4xl font-light" style={{ color: 'var(--ghost)' }}>
                        Artist <em className="italic" style={{ color: 'var(--cyan)' }}>Chat</em>
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'rgba(234,230,242,0.3)' }}>
                        Only verified artists · {messages.length} messages
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto rounded-sm p-4 space-y-3 mb-4"
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
                    ) : messages.map((msg, i) => {
                        const isMe = msg.artist_username === artist?.username
                        const color = getColor(msg.artist_username)
                        const prev = messages[i - 1]
                        const showName = !prev || prev.artist_username !== msg.artist_username
                        const isEditing = editingId === msg.id

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                <div style={{ maxWidth: '75%' }}>
                                    {showName && !isMe && (
                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                            <a href={`/artist/${msg.artist_username}`} className="text-xs tracking-wider" style={{ color }}>
                                                {msg.artist_name}
                                            </a>
                                            <span className="text-xs" style={{ color: 'rgba(234,230,242,0.2)' }}>{formatTime(msg.created_at)}</span>
                                        </div>
                                    )}

                                    <div className="rounded-sm px-4 py-2.5 relative"
                                        style={{
                                            background: isMe ? `${color}15` : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${isMe ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
                                        }}>

                                        {/* Image */}
                                        {msg.image_url && (
                                            <img src={msg.image_url} alt="shared" className="rounded-sm mb-2 max-w-full"
                                                style={{ maxHeight: '200px', objectFit: 'contain' }} />
                                        )}

                                        {/* Message or edit input */}
                                        {isEditing ? (
                                            <div className="flex gap-2 items-center">
                                                <input value={editText} onChange={e => setEditText(e.target.value)}
                                                    className="input-sacred flex-1 py-1 text-sm"
                                                    onKeyDown={e => e.key === 'Enter' && saveEdit(msg.id)} />
                                                <button onClick={() => saveEdit(msg.id)} style={{ color: 'var(--cyan)' }}><Check size={14} /></button>
                                                <button onClick={() => setEditingId(null)} style={{ color: 'rgba(234,230,242,0.4)' }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--ghost)' }}>{msg.message}</p>
                                        )}

                                        {msg.edited && !isEditing && (
                                            <p className="text-xs mt-1" style={{ color: 'rgba(234,230,242,0.2)' }}>edited</p>
                                        )}
                                    </div>

                                    {/* Actions — only for own messages */}
                                    {isMe && !isEditing && (
                                        <div className="flex gap-2 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(msg)} className="text-xs flex items-center gap-1"
                                                style={{ color: 'rgba(234,230,242,0.3)' }}>
                                                <Edit2 size={11} /> Edit
                                            </button>
                                            <button onClick={() => deleteMessage(msg.id)} className="text-xs flex items-center gap-1"
                                                style={{ color: 'rgba(255,68,68,0.5)' }}>
                                                <Trash2 size={11} /> Delete
                                            </button>
                                        </div>
                                    )}

                                    {isMe && (
                                        <p className="text-xs mt-1 text-right mr-1" style={{ color: 'rgba(234,230,242,0.2)' }}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="pb-6 flex-shrink-0">
                    {artist ? (
                        <div className="flex gap-2">
                            {/* Image upload */}
                            <label className="btn-velvet px-3 cursor-pointer flex-shrink-0"
                                style={{ opacity: uploadingImg ? 0.5 : 1 }}>
                                <Image size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={sendImage} disabled={uploadingImg} />
                            </label>

                            <input ref={inputRef} type="text"
                                placeholder="Share your thoughts... (Enter to send)"
                                value={newMsg}
                                onChange={e => setNewMsg(e.target.value)}
                                onKeyDown={handleKey}
                                className="input-sacred flex-1"
                                style={{ borderColor: 'rgba(0,229,255,0.2)' }}
                            />
                            <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                                className="btn-ember px-5 flex-shrink-0"
                                style={{ opacity: !newMsg.trim() || sending ? 0.5 : 1 }}>
                                <Send size={16} />
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