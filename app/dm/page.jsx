'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Send, ArrowLeft, Search, Feather, Image, Check, CheckCheck, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSearchParams } from 'next/navigation'

function DMContent() {
    const searchParams = useSearchParams()
    const [artist, setArtist] = useState(null)
    const [artists, setArtists] = useState([])
    const [conversations, setConversations] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [uploadingImg, setUploadingImg] = useState(false)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => { init() }, [])
    useEffect(() => {
        if (selectedUser) fetchMessages(selectedUser.username)
    }, [selectedUser?.username])
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }

        const { data: me } = await supabase
            .from('applications').select('*').eq('email', user.email).eq('status', 'approved').single()
        if (!me) { window.location.href = '/'; return }
        setArtist(me)

        const { data: all } = await supabase
            .from('applications').select('*').eq('status', 'approved').neq('username', me.username)
        if (all) setArtists(all)

        await fetchConversations(me.username)
        setLoading(false)

        // Auto-open from URL param
        const urlUser = searchParams.get('user')
        if (urlUser && all) {
            const found = all.find(a => a.username === urlUser)
            if (found) setSelectedUser(found)
        }

        // Realtime
        supabase.channel('dm-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' },
                p => {
                    const msg = p.new
                    if (msg.sender_username === me.username || msg.receiver_username === me.username) {
                        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
                        fetchConversations(me.username)
                    }
                })
            .subscribe()
    }

    const fetchConversations = async (myUsername) => {
        const { data } = await supabase
            .from('direct_messages').select('*')
            .or(`sender_username.eq.${myUsername},receiver_username.eq.${myUsername}`)
            .order('created_at', { ascending: false })
        if (!data) return
        const map = {}
        data.forEach(msg => {
            const partner = msg.sender_username === myUsername ? msg.receiver_username : msg.sender_username
            if (!map[partner]) map[partner] = { partner, lastMsg: msg, unread: 0 }
            if (!msg.read && msg.receiver_username === myUsername) map[partner].unread++
        })
        setConversations(Object.values(map))
    }

    const fetchMessages = async (otherUsername) => {
        if (!artist) return
        const { data } = await supabase
            .from('direct_messages').select('*')
            .or(`and(sender_username.eq.${artist.username},receiver_username.eq.${otherUsername}),and(sender_username.eq.${otherUsername},receiver_username.eq.${artist.username})`)
            .order('created_at', { ascending: true })
        if (data) setMessages(data)
        await supabase.from('direct_messages').update({ read: true })
            .eq('receiver_username', artist.username).eq('sender_username', otherUsername)
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
            await supabase.storage.from('artworks').upload(fileName, file)
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
    const COLORS = ['#00E5FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
    const getColor = (u) => COLORS[(u?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % COLORS.length]

    const convArtists = conversations
        .map(c => ({ ...artists.find(a => a.username === c.partner), unread: c.unread, lastMsg: c.lastMsg }))
        .filter(Boolean)

    const filteredArtists = artists.filter(a =>
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
        </div>
    )

    // Mobile: show chat if user selected
    const showChat = selectedUser

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '4rem', background: 'var(--void)' }}>
            <div className="max-w-5xl mx-auto w-full flex flex-1" style={{ minHeight: 0 }}>

                {/* LEFT — Conversations */}
                <div className={`${showChat ? 'hidden md:flex' : 'flex'} flex-col`}
                    style={{ width: '320px', minWidth: '320px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

                    {/* Header */}
                    <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <h2 className="font-display text-xl font-light" style={{ color: 'var(--ghost)' }}>Messages</h2>
                        <button onClick={() => setShowSearch(!showSearch)}
                            style={{ color: 'rgba(234,230,242,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            {showSearch ? <X size={18} /> : <Search size={18} />}
                        </button>
                    </div>

                    {/* Search */}
                    {showSearch && (
                        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <input type="text" placeholder="Search artists..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="input-sacred py-2 text-sm w-full" autoFocus />
                        </div>
                    )}

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {(searchQuery ? filteredArtists : convArtists.length > 0 ? convArtists : artists).map(a => {
                            const color = getColor(a.username)
                            const isSelected = selectedUser?.username === a.username
                            const unread = a.unread || 0
                            return (
                                <button key={a.username} onClick={() => { setSelectedUser(a); setShowSearch(false); setSearchQuery('') }}
                                    className="w-full text-left flex items-center gap-3 px-4 py-3 transition-all"
                                    style={{
                                        background: isSelected ? 'rgba(0,229,255,0.06)' : 'transparent',
                                        borderLeft: isSelected ? '2px solid var(--cyan)' : '2px solid transparent',
                                    }}>
                                    <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden"
                                        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                                        {a.image_url ? (
                                            <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="font-display text-lg font-light" style={{ color }}>{a.name?.[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-light truncate" style={{ color: 'var(--ghost)', fontWeight: unread ? 600 : 300 }}>
                                                {a.name}
                                            </p>
                                            {a.lastMsg && (
                                                <p className="text-xs flex-shrink-0 ml-2" style={{ color: 'rgba(234,230,242,0.25)' }}>
                                                    {formatTime(a.lastMsg.created_at)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs truncate" style={{ color: unread ? 'rgba(234,230,242,0.6)' : 'rgba(234,230,242,0.3)' }}>
                                                {a.lastMsg ? a.lastMsg.message.substring(0, 30) : `@${a.username}`}
                                            </p>
                                            {unread > 0 && (
                                                <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2"
                                                    style={{ background: 'var(--cyan)', color: 'var(--void)', fontSize: '10px', fontWeight: 700 }}>
                                                    {unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* RIGHT — Chat */}
                <div className={`${showChat ? 'flex' : 'hidden md:flex'} flex-col flex-1`} style={{ minWidth: 0 }}>
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                <button className="md:hidden mr-1" onClick={() => setSelectedUser(null)}
                                    style={{ color: 'rgba(234,230,242,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
                                    style={{ background: `${getColor(selectedUser.username)}15`, border: `1px solid ${getColor(selectedUser.username)}25` }}>
                                    {selectedUser.image_url ? (
                                        <img src={selectedUser.image_url} alt={selectedUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-display text-xl font-light" style={{ color: getColor(selectedUser.username) }}>
                                                {selectedUser.name?.[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-display text-base font-light truncate" style={{ color: 'var(--ghost)' }}>
                                        {selectedUser.name}
                                    </p>
                                    <a href={`/artist/${selectedUser.username}`} className="text-xs"
                                        style={{ color: 'rgba(0,229,255,0.5)' }}>
                                        @{selectedUser.username}
                                    </a>
                                </div>
                                <a href={`/artist/${selectedUser.username}`} className="btn-velvet text-xs px-3 py-1.5">
                                    View Chamber
                                </a>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ minHeight: 0 }}>
                                {messages.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden"
                                            style={{ background: `${getColor(selectedUser.username)}15`, border: `1px solid ${getColor(selectedUser.username)}25` }}>
                                            {selectedUser.image_url ? (
                                                <img src={selectedUser.image_url} alt={selectedUser.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="font-display text-2xl" style={{ color: getColor(selectedUser.username) }}>
                                                        {selectedUser.name?.[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-display text-xl font-light mb-1" style={{ color: 'var(--ghost)' }}>
                                            {selectedUser.name}
                                        </p>
                                        <p className="text-sm" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                            Start a conversation
                                        </p>
                                    </div>
                                ) : messages.map((msg, i) => {
                                    const isMe = msg.sender_username === artist.username
                                    const color = getColor(msg.sender_username)
                                    const prev = messages[i - 1]
                                    const next = messages[i + 1]
                                    const isFirst = !prev || prev.sender_username !== msg.sender_username
                                    const isLast = !next || next.sender_username !== msg.sender_username

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}>
                                            {/* Avatar for other person */}
                                            {!isMe && (
                                                <div className="w-8 h-8 rounded-full flex-shrink-0 mr-2 self-end overflow-hidden"
                                                    style={{
                                                        background: `${color}15`,
                                                        border: `1px solid ${color}25`,
                                                        visibility: isLast ? 'visible' : 'hidden'
                                                    }}>
                                                    {selectedUser.image_url ? (
                                                        <img src={selectedUser.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="text-xs font-display" style={{ color }}>{selectedUser.name?.[0]}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ maxWidth: '65%' }}>
                                                {msg.image_url && (
                                                    <div className={`mb-1 ${isMe ? 'flex justify-end' : ''}`}>
                                                        <img src={msg.image_url} alt="shared"
                                                            className="rounded-xl cursor-pointer"
                                                            style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain' }}
                                                            onClick={() => window.open(msg.image_url, '_blank')} />
                                                    </div>
                                                )}
                                                {msg.message !== '📷 Image' && (
                                                    <div className={`px-4 py-2 ${isMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}
                                                        style={{
                                                            background: isMe ? `${getColor(artist.username)}20` : 'rgba(255,255,255,0.07)',
                                                            border: isMe ? `1px solid ${getColor(artist.username)}30` : '1px solid rgba(255,255,255,0.1)',
                                                        }}>
                                                        <p className="text-sm leading-relaxed" style={{ color: 'var(--ghost)' }}>{msg.message}</p>
                                                    </div>
                                                )}
                                                {isLast && (
                                                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <p className="text-xs" style={{ color: 'rgba(234,230,242,0.2)' }}>{formatTime(msg.created_at)}</p>
                                                        {isMe && (msg.read
                                                            ? <CheckCheck size={12} style={{ color: 'var(--cyan)' }} />
                                                            : <Check size={12} style={{ color: 'rgba(234,230,242,0.3)' }} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer flex-shrink-0 p-2 rounded-full transition-all"
                                        style={{ color: 'rgba(234,230,242,0.4)', background: uploadingImg ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                                        <Image size={20} />
                                        <input type="file" className="hidden" accept="image/*" onChange={sendImage} disabled={uploadingImg} />
                                    </label>
                                    <input ref={inputRef} type="text"
                                        placeholder="Message..."
                                        value={newMsg}
                                        onChange={e => setNewMsg(e.target.value)}
                                        onKeyDown={handleKey}
                                        className="flex-1 text-sm px-4 py-2.5 rounded-full"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'var(--ghost)',
                                            outline: 'none',
                                        }}
                                    />
                                    <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                                        style={{
                                            background: newMsg.trim() ? 'linear-gradient(135deg, var(--cyan), var(--violet))' : 'rgba(255,255,255,0.05)',
                                            border: 'none',
                                            cursor: newMsg.trim() ? 'pointer' : 'default',
                                            opacity: sending ? 0.5 : 1,
                                        }}>
                                        <Send size={16} style={{ color: newMsg.trim() ? 'var(--void)' : 'rgba(234,230,242,0.3)' }} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
                                    <Send size={28} style={{ color: 'var(--cyan)', opacity: 0.6 }} strokeWidth={1.5} />
                                </div>
                                <p className="font-display text-2xl font-light mb-2" style={{ color: 'var(--ghost)' }}>Your Messages</p>
                                <p className="text-sm" style={{ color: 'rgba(234,230,242,0.3)' }}>
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

export default function DMPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
            </div>
        }>
            <DMContent />
        </Suspense>
    )
}