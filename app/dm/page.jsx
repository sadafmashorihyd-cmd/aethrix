'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft, Search, Feather, Image, Check, CheckCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function DMPage() {
    const [artist, setArtist] = useState(null)
    const [artists, setArtists] = useState([])
    const [conversations, setConversations] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [uploadingImg, setUploadingImg] = useState(false)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => { init() }, [])
    useEffect(() => { if (selectedUser) fetchMessages(selectedUser) }, [selectedUser])
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }

        const { data: artistData } = await supabase
            .from('applications')
            .select('*')
            .eq('email', user.email)
            .eq('status', 'approved')
            .single()

        if (!artistData) { window.location.href = '/'; return }
        setArtist(artistData)

        // Fetch all artists except me
        const { data: allArtists } = await supabase
            .from('applications')
            .select('*')
            .eq('status', 'approved')
            .neq('username', artistData.username)

        if (allArtists) setArtists(allArtists)

        // Fetch conversations
        await fetchConversations(artistData.username)
        setLoading(false)

        // Realtime for new messages
        const channel = supabase
            .channel('dm-room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' },
                payload => {
                    const msg = payload.new
                    if (msg.sender_username === artistData.username || msg.receiver_username === artistData.username) {
                        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
                        fetchConversations(artistData.username)
                    }
                }
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }

    const fetchConversations = async (myUsername) => {
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`sender_username.eq.${myUsername},receiver_username.eq.${myUsername}`)
            .order('created_at', { ascending: false })

        if (!data) return

        // Group by conversation partner
        const convMap = {}
        data.forEach(msg => {
            const partner = msg.sender_username === myUsername ? msg.receiver_username : msg.sender_username
            if (!convMap[partner]) convMap[partner] = { partner, lastMsg: msg, unread: 0 }
            if (!msg.read && msg.receiver_username === myUsername) convMap[partner].unread++
        })
        setConversations(Object.values(convMap))
    }

    const fetchMessages = async (otherUser) => {
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_username.eq.${artist.username},receiver_username.eq.${otherUser.username}),and(sender_username.eq.${otherUser.username},receiver_username.eq.${artist.username})`)
            .order('created_at', { ascending: true })

        if (data) setMessages(data)

        // Mark as read
        await supabase
            .from('direct_messages')
            .update({ read: true })
            .eq('receiver_username', artist.username)
            .eq('sender_username', otherUser.username)

        fetchConversations(artist.username)
    }

    const sendMessage = async () => {
        const text = newMsg.trim()
        if (!text || !artist || !selectedUser || sending) return
        setSending(true)
        setNewMsg('')
        await supabase.from('direct_messages').insert({
            sender_username: artist.username,
            sender_name: artist.name,
            receiver_username: selectedUser.username,
            message: text,
        })
        setSending(false)
        inputRef.current?.focus()
    }

    const sendImage = async (e) => {
        const file = e.target.files[0]
        if (!file || !artist || !selectedUser) return
        setUploadingImg(true)
        try {
            const fileName = `dm-${Date.now()}.${file.name.split('.').pop()}`
            const { error: upErr } = await supabase.storage.from('artworks').upload(fileName, file)
            if (upErr) throw upErr
            const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(fileName)
            await supabase.from('direct_messages').insert({
                sender_username: artist.username,
                sender_name: artist.name,
                receiver_username: selectedUser.username,
                message: '📷 Image',
                image_url: urlData.publicUrl,
            })
        } catch (err) { console.error(err) }
        setUploadingImg(false)
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const formatDate = (ts) => new Date(ts).toLocaleDateString()

    const COLORS = ['#00E5FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
    const getColor = (username) => {
        const hash = username?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0
        return COLORS[hash % COLORS.length]
    }

    const filteredArtists = artists.filter(a =>
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
        </div>
    )

    return (
        <div className="page-enter pt-16" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="max-w-6xl mx-auto w-full px-4 flex flex-1" style={{ minHeight: 0, gap: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

                {/* Sidebar */}
                <div className="w-72 flex-shrink-0 flex flex-col rounded-sm overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>

                    <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <h2 className="font-display text-xl font-light mb-3" style={{ color: 'var(--ghost)' }}>
                            Direct <em className="italic" style={{ color: 'var(--cyan)' }}>Messages</em>
                        </h2>
                        <div className="relative">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: 'rgba(234,230,242,0.3)' }} />
                            <input type="text" placeholder="Search artists..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="input-sacred pl-8 py-2 text-xs w-full" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Recent conversations */}
                        {!searchQuery && conversations.length > 0 && (
                            <div>
                                <p className="text-xs tracking-widest uppercase px-4 py-2" style={{ color: 'rgba(234,230,242,0.2)' }}>Recent</p>
                                {conversations.map(conv => {
                                    const convArtist = artists.find(a => a.username === conv.partner)
                                    if (!convArtist) return null
                                    const color = getColor(conv.partner)
                                    return (
                                        <button key={conv.partner} onClick={() => setSelectedUser(convArtist)}
                                            className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all"
                                            style={{
                                                background: selectedUser?.username === conv.partner ? 'rgba(0,229,255,0.06)' : 'transparent',
                                                borderLeft: selectedUser?.username === conv.partner ? '2px solid var(--cyan)' : '2px solid transparent',
                                            }}>
                                            <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden"
                                                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                                                {convArtist.image_url ? (
                                                    <img src={convArtist.image_url} alt={convArtist.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Feather size={12} style={{ color, opacity: 0.7 }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-light truncate" style={{ color: 'var(--ghost)' }}>{convArtist.name}</p>
                                                <p className="text-xs truncate" style={{ color: 'rgba(234,230,242,0.35)' }}>
                                                    {conv.lastMsg.message.substring(0, 25)}...
                                                </p>
                                            </div>
                                            {conv.unread > 0 && (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                                                    style={{ background: 'var(--cyan)', color: 'var(--void)', fontWeight: 700 }}>
                                                    {conv.unread}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* All artists */}
                        <div>
                            <p className="text-xs tracking-widest uppercase px-4 py-2" style={{ color: 'rgba(234,230,242,0.2)' }}>
                                {searchQuery ? 'Search Results' : 'All Artists'}
                            </p>
                            {filteredArtists.map(a => {
                                const color = getColor(a.username)
                                return (
                                    <button key={a.username} onClick={() => setSelectedUser(a)}
                                        className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all"
                                        style={{
                                            background: selectedUser?.username === a.username ? 'rgba(0,229,255,0.06)' : 'transparent',
                                            borderLeft: selectedUser?.username === a.username ? '2px solid var(--cyan)' : '2px solid transparent',
                                        }}>
                                        <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden"
                                            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                                            {a.image_url ? (
                                                <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Feather size={12} style={{ color, opacity: 0.7 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-light truncate" style={{ color: 'var(--ghost)' }}>{a.name}</p>
                                            <p className="text-xs truncate" style={{ color: 'rgba(234,230,242,0.3)' }}>@{a.username}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 flex flex-col rounded-sm overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', minWidth: 0 }}>

                    {selectedUser ? (
                        <>
                            {/* Header */}
                            <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                                    style={{ border: `1px solid ${getColor(selectedUser.username)}40` }}>
                                    {selectedUser.image_url ? (
                                        <img src={selectedUser.image_url} alt={selectedUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"
                                            style={{ background: `${getColor(selectedUser.username)}15` }}>
                                            <Feather size={14} style={{ color: getColor(selectedUser.username), opacity: 0.7 }} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{selectedUser.name}</p>
                                    <a href={`/artist/${selectedUser.username}`} className="text-xs"
                                        style={{ color: 'rgba(0,229,255,0.5)' }}>
                                        @{selectedUser.username} · View Chamber
                                    </a>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: 0 }}>
                                {messages.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Feather size={32} className="mx-auto mb-4 opacity-20" strokeWidth={0.8} />
                                        <p className="font-display text-lg font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                            Start a conversation with {selectedUser.name}
                                        </p>
                                    </div>
                                ) : messages.map((msg, i) => {
                                    const isMe = msg.sender_username === artist.username
                                    const color = getColor(msg.sender_username)
                                    const prev = messages[i - 1]
                                    const prevDate = prev ? formatDate(prev.created_at) : null
                                    const currDate = formatDate(msg.created_at)

                                    return (
                                        <div key={msg.id}>
                                            {currDate !== prevDate && (
                                                <div className="text-center my-4">
                                                    <span className="text-xs px-3 py-1 rounded-full"
                                                        style={{ color: 'rgba(234,230,242,0.3)', background: 'rgba(255,255,255,0.05)' }}>
                                                        {currDate}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div style={{ maxWidth: '70%' }}>
                                                    {msg.image_url && (
                                                        <img src={msg.image_url} alt="shared"
                                                            className="rounded-sm mb-1 cursor-pointer"
                                                            style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
                                                            onClick={() => window.open(msg.image_url, '_blank')} />
                                                    )}
                                                    <div className="rounded-sm px-4 py-2.5"
                                                        style={{
                                                            background: isMe ? `${color}15` : 'rgba(255,255,255,0.05)',
                                                            border: `1px solid ${isMe ? `${color}30` : 'rgba(255,255,255,0.08)'}`,
                                                        }}>
                                                        <p className="text-sm leading-relaxed" style={{ color: 'var(--ghost)' }}>{msg.message}</p>
                                                    </div>
                                                    <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <p className="text-xs" style={{ color: 'rgba(234,230,242,0.2)' }}>{formatTime(msg.created_at)}</p>
                                                        {isMe && (
                                                            msg.read
                                                                ? <CheckCheck size={12} style={{ color: 'var(--cyan)' }} />
                                                                : <Check size={12} style={{ color: 'rgba(234,230,242,0.3)' }} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex gap-2">
                                    <label className="btn-velvet px-3 cursor-pointer flex-shrink-0" style={{ opacity: uploadingImg ? 0.5 : 1 }}>
                                        <Image size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={sendImage} disabled={uploadingImg} />
                                    </label>
                                    <input ref={inputRef} type="text"
                                        placeholder={`Message ${selectedUser.name}...`}
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
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Feather size={48} className="mx-auto mb-4 opacity-15" strokeWidth={0.8} />
                                <p className="font-display text-2xl font-light mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                    Your Messages
                                </p>
                                <p className="text-sm" style={{ color: 'rgba(234,230,242,0.2)' }}>
                                    Select an artist to start a private conversation
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}