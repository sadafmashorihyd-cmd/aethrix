'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Send, Search, Image, Check, CheckCheck, ArrowLeft } from 'lucide-react'
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
    const [uploadingImg, setUploadingImg] = useState(false)
    const chatRef = useRef(null)
    const inputRef = useRef(null)

    // Hide footer and fix overflow for DM page
    useEffect(() => {
        document.body.classList.add('dm-page')
        document.body.style.overflow = 'hidden'
        const footer = document.getElementById('site-footer')
        if (footer) footer.style.display = 'none'
        return () => {
            document.body.classList.remove('dm-page')
            document.body.style.overflow = ''
            if (footer) footer.style.display = ''
        }
    }, [])

    useEffect(() => { init() }, [])

    useEffect(() => {
        if (selectedUser && artist) fetchMessages(selectedUser.username)
    }, [selectedUser?.username, artist?.username])

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [messages])

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }
        const { data: me } = await supabase.from('applications').select('*').eq('email', user.email).eq('status', 'approved').single()
        if (!me) { window.location.href = '/'; return }
        setArtist(me)
        const { data: all } = await supabase.from('applications').select('*').eq('status', 'approved').neq('username', me.username).order('name', { ascending: true })
        if (all) setArtists(all)
        await fetchConversations(me.username)
        setLoading(false)
        const urlUser = searchParams.get('user')
        if (urlUser && all) {
            const found = all.find(a => a.username === urlUser)
            if (found) setSelectedUser(found)
        }
        supabase.channel('dm-final2')
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
        const { data } = await supabase.from('direct_messages').select('*')
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
        const { data } = await supabase.from('direct_messages').select('*')
            .or(`and(sender_username.eq.${artist.username},receiver_username.eq.${otherUsername}),and(sender_username.eq.${otherUsername},receiver_username.eq.${artist.username})`)
            .order('created_at', { ascending: true })
        if (data) setMessages(data)
        await supabase.from('direct_messages').update({ read: true }).eq('receiver_username', artist.username).eq('sender_username', otherUsername)
        fetchConversations(artist.username)
    }

    const sendMessage = async () => {
        const text = newMsg.trim()
        if (!text || !artist || !selectedUser || sending) return
        setSending(true)
        setNewMsg('')
        const { error } = await supabase.from('direct_messages').insert({
            sender_username: artist.username,
            sender_name: artist.name,
            receiver_username: selectedUser.username,
            message: text,
        })
        if (error) console.error('Send error:', error)
        setSending(false)
        setTimeout(() => inputRef.current?.focus(), 50)
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
                sender_username: artist.username, sender_name: artist.name,
                receiver_username: selectedUser.username, message: '📷 Image',
                image_url: urlData.publicUrl,
            })
        } catch (err) { console.error(err) }
        setUploadingImg(false)
        e.target.value = ''
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const COLORS = ['#00E5FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
    const getColor = (u) => COLORS[(u?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % COLORS.length]

    const displayList = searchQuery
        ? artists.filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || a.username?.toLowerCase().includes(searchQuery.toLowerCase()))
        : conversations.length > 0
            ? conversations.map(c => { const a = artists.find(x => x.username === c.partner); return a ? { ...a, unread: c.unread, lastMsg: c.lastMsg } : null }).filter(Boolean)
            : artists

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
        </div>
    )

    return (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, display: 'flex', background: 'var(--void)', zIndex: 40 }}>
            <div style={{ maxWidth: 960, width: '100%', margin: '0 auto', display: 'flex', height: '100%' }}>

                {/* SIDEBAR */}
                <div style={{ width: 280, minWidth: 280, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)', display: selectedUser ? 'none' : 'flex', flexDirection: 'column', height: '100%' }} className="md:!flex">
                    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                        <p className="font-display" style={{ color: 'var(--ghost)', fontSize: 20, fontWeight: 300, marginBottom: 12 }}>Messages</p>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(234,230,242,0.3)', pointerEvents: 'none' }} />
                            <input type="text" placeholder="Search..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 30px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ghost)', fontSize: 13, outline: 'none' }} />
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {displayList.map(a => {
                            const color = getColor(a.username)
                            const isSelected = selectedUser?.username === a.username
                            return (
                                <button key={a.username} onClick={() => setSelectedUser(a)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textAlign: 'left', background: isSelected ? 'rgba(0,229,255,0.07)' : 'transparent', borderLeft: `3px solid ${isSelected ? 'var(--cyan)' : 'transparent'}`, border: 'none', cursor: 'pointer' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: `${color}15`, border: `1px solid ${color}25`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {a.image_url ? <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="font-display" style={{ color, fontSize: 18 }}>{a.name?.[0]}</span>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--ghost)', fontSize: 14, fontWeight: a.unread ? 600 : 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                                            {a.lastMsg && <span style={{ color: 'rgba(234,230,242,0.2)', fontSize: 11, flexShrink: 0, marginLeft: 4 }}>{formatTime(a.lastMsg.created_at)}</span>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'rgba(234,230,242,0.3)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.lastMsg ? a.lastMsg.message.substring(0, 25) : `@${a.username}`}</span>
                                            {a.unread > 0 && <span style={{ background: 'var(--cyan)', color: 'var(--void)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, flexShrink: 0, marginLeft: 4 }}>{a.unread}</span>}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* CHAT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                    {selectedUser ? (
                        <>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(234,230,242,0.5)', padding: 4, display: 'flex' }}>
                                    <ArrowLeft size={20} />
                                </button>
                                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: `${getColor(selectedUser.username)}15`, border: `1px solid ${getColor(selectedUser.username)}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {selectedUser.image_url ? <img src={selectedUser.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="font-display" style={{ color: getColor(selectedUser.username), fontSize: 16 }}>{selectedUser.name?.[0]}</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p className="font-display" style={{ color: 'var(--ghost)', fontSize: 16, margin: 0, fontWeight: 300 }}>{selectedUser.name}</p>
                                    <a href={`/artist/${selectedUser.username}`} style={{ color: 'rgba(0,229,255,0.5)', fontSize: 12 }}>@{selectedUser.username}</a>
                                </div>
                            </div>

                            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {messages.length === 0 ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: `${getColor(selectedUser.username)}15`, border: `1px solid ${getColor(selectedUser.username)}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                            {selectedUser.image_url ? <img src={selectedUser.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="font-display" style={{ color: getColor(selectedUser.username), fontSize: 22 }}>{selectedUser.name?.[0]}</span>}
                                        </div>
                                        <p className="font-display" style={{ color: 'var(--ghost)', fontSize: 18, fontWeight: 300 }}>{selectedUser.name}</p>
                                        <p style={{ color: 'rgba(234,230,242,0.3)', fontSize: 13, marginTop: 4 }}>Start a conversation</p>
                                    </div>
                                ) : messages.map((msg, i) => {
                                    const isMe = msg.sender_username === artist.username
                                    const next = messages[i + 1]
                                    const isLast = !next || next.sender_username !== msg.sender_username
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8, marginTop: 2 }}>
                                            {!isMe && (
                                                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: `${getColor(selectedUser.username)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', visibility: isLast ? 'visible' : 'hidden' }}>
                                                    {selectedUser.image_url ? <img src={selectedUser.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: getColor(selectedUser.username), fontSize: 11 }}>{selectedUser.name?.[0]}</span>}
                                                </div>
                                            )}
                                            <div style={{ maxWidth: '65%' }}>
                                                {msg.image_url && <img src={msg.image_url} alt="img" onClick={() => window.open(msg.image_url, '_blank')} style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 12, cursor: 'pointer', display: 'block', marginBottom: 4 }} />}
                                                {msg.message !== '📷 Image' && (
                                                    <div style={{ padding: '9px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.07)', border: isMe ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(255,255,255,0.09)' }}>
                                                        <p style={{ color: 'var(--ghost)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{msg.message}</p>
                                                    </div>
                                                )}
                                                {isLast && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                                        <span style={{ color: 'rgba(234,230,242,0.2)', fontSize: 11 }}>{formatTime(msg.created_at)}</span>
                                                        {isMe && (msg.read ? <CheckCheck size={11} style={{ color: 'var(--cyan)' }} /> : <Check size={11} style={{ color: 'rgba(234,230,242,0.25)' }} />)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <label style={{ cursor: 'pointer', color: uploadingImg ? 'var(--cyan)' : 'rgba(234,230,242,0.4)', display: 'flex', padding: 6 }}>
                                    <Image size={20} />
                                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={sendImage} disabled={uploadingImg} />
                                </label>
                                <input ref={inputRef} type="text" placeholder="Message..."
                                    value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKey}
                                    style={{ flex: 1, padding: '10px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--ghost)', fontSize: 14, outline: 'none' }} />
                                <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                                    style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: newMsg.trim() && !sending ? 'linear-gradient(135deg, var(--cyan), var(--violet))' : 'rgba(255,255,255,0.06)', border: 'none', cursor: newMsg.trim() && !sending ? 'pointer' : 'default' }}>
                                    <Send size={16} style={{ color: newMsg.trim() && !sending ? 'var(--void)' : 'rgba(234,230,242,0.25)' }} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <Send size={26} style={{ color: 'var(--cyan)', opacity: 0.6 }} strokeWidth={1.5} />
                            </div>
                            <p className="font-display" style={{ color: 'var(--ghost)', fontSize: 22, fontWeight: 300, marginBottom: 6 }}>Your Messages</p>
                            <p style={{ color: 'rgba(234,230,242,0.3)', fontSize: 14 }}>Select an artist to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function DMPage() {
    return (
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p className="font-display" style={{ color: 'rgba(234,230,242,0.3)', fontSize: 22 }}>Loading...</p></div>}>
            <DMContent />
        </Suspense>
    )
}