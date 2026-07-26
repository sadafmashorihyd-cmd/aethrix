'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Send, Search, Image, Check, CheckCheck, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSearchParams } from 'next/navigation'

const EMOJIS = ['❤️', '🔥', '✨', '👏', '😂', '🎨', '💯', '🙌', '👀', '💜', '🫶', '🥹', '😍', '🤩', '💫', '🌙', '⭐', '🏆', '💎', '🌸', '🦋', '💪', '🙏', '😎', '🤍', '😮', '🎯', '🌊', '🎭', '🖋️']
const COLS = ['#00F0FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']
const gc = (u) => COLS[(u?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % COLS.length]
const ft = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const ta = (ts) => {
    const d = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (d < 60) return 'Just now'
    if (d < 3600) return `${Math.floor(d / 60)}m ago`
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`
    return new Date(ts).toLocaleDateString()
}

function DM() {
    const sp = useSearchParams()
    const [me, setMe] = useState(null)
    const [all, setAll] = useState([])
    const [convs, setConvs] = useState([])
    const [sel, setSel] = useState(null)
    const [msgs, setMsgs] = useState([])
    const [txt, setTxt] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [q, setQ] = useState('')
    const [imgUp, setImgUp] = useState(false)
    const [emojiFor, setEmojiFor] = useState(null)
    const [online, setOnline] = useState([])
    const chatRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => { boot() }, [])
    useEffect(() => { if (sel && me) fetchMsgs(sel.username) }, [sel?.username, me?.username])
    useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [msgs])

    const isOnline = (u) => online.some(x => x.username === u)

    const fetchOnline = async () => {
        const ago = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data } = await supabase.from('online_status').select('*').eq('is_online', true).gte('last_seen', ago)
        if (data) setOnline(data)
    }

    const boot = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }
        const { data: meData } = await supabase.from('applications').select('*').eq('email', user.email).eq('status', 'approved').single()
        if (!meData) { window.location.href = '/'; return }
        setMe(meData)
        await supabase.from('online_status').upsert({ username: meData.username, is_online: true, last_seen: new Date().toISOString() }, { onConflict: 'username' })

        const { data: allData } = await supabase.from('applications').select('*').eq('status', 'approved').neq('username', meData.username).order('name', { ascending: true })
        if (allData) setAll(allData)

        await fetchConvs(meData.username)
        await fetchOnline()
        setLoading(false)

        const urlUser = sp.get('user')
        if (urlUser && allData) {
            const found = allData.find(a => a.username === urlUser)
            if (found) setSel(found)
        }

        // Realtime
        const ch = supabase.channel(`dm-${Date.now()}`)
        ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' },
            p => {
                const msg = p.new
                if (msg.sender_username === meData.username || msg.receiver_username === meData.username) {
                    setMsgs(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
                    fetchConvs(meData.username)
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' },
                p => setMsgs(prev => prev.map(m => m.id === p.new.id ? p.new : m)))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'online_status' }, fetchOnline)
            .subscribe()
    }

    const fetchConvs = async (myU) => {
        const { data } = await supabase.from('direct_messages').select('*')
            .or(`sender_username.eq.${myU},receiver_username.eq.${myU}`)
            .order('created_at', { ascending: false })
        if (!data) return
        const map = {}
        data.forEach(msg => {
            const p = msg.sender_username === myU ? msg.receiver_username : msg.sender_username
            if (!map[p]) map[p] = { p, last: msg, unread: 0 }
            if (!msg.read && msg.receiver_username === myU) map[p].unread++
        })
        setConvs(Object.values(map))
    }

    const fetchMsgs = async (other) => {
        if (!me) return
        const { data } = await supabase.from('direct_messages').select('*')
            .or(`and(sender_username.eq.${me.username},receiver_username.eq.${other}),and(sender_username.eq.${other},receiver_username.eq.${me.username})`)
            .order('created_at', { ascending: true })
        if (data) setMsgs(data)
        await supabase.from('direct_messages').update({ read: true }).eq('receiver_username', me.username).eq('sender_username', other)
        fetchConvs(me.username)
    }

    const send = async () => {
        const t = txt.trim()
        if (!t || !me || !sel || sending) return
        setSending(true); setTxt('')
        const { error } = await supabase.from('direct_messages').insert({
            sender_username: me.username, sender_name: me.name,
            receiver_username: sel.username, message: t,
        })
        if (!error) {
            await supabase.from('notifications').insert({
                username: sel.username, type: 'dm',
                message: `${me.name} sent you a message: "${t.substring(0, 40)}"`,
                link: `/dm?user=${me.username}`,
            })
        }
        setSending(false)
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const sendImg = async (e) => {
        const file = e.target.files[0]; if (!file || !me || !sel) return
        setImgUp(true)
        try {
            const n = `dm-${Date.now()}.${file.name.split('.').pop()}`
            await supabase.storage.from('artworks').upload(n, file)
            const { data: ud } = supabase.storage.from('artworks').getPublicUrl(n)
            await supabase.from('direct_messages').insert({ sender_username: me.username, sender_name: me.name, receiver_username: sel.username, message: '📷 Image', image_url: ud.publicUrl })
        } catch (err) { console.error(err) }
        setImgUp(false); e.target.value = ''
    }

    const react = async (msg, emoji) => {
        const r = msg.reactions || {}
        const users = r[emoji] || []
        const u = me?.username; if (!u) return
        const nu = users.includes(u) ? users.filter(x => x !== u) : [...users, u]
        const nr = { ...r, [emoji]: nu }
        if (!nr[emoji]?.length) delete nr[emoji]
        await supabase.from('direct_messages').update({ reactions: nr }).eq('id', msg.id)
        setEmojiFor(null)
    }

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

    const list = q
        ? all.filter(a => a.name?.toLowerCase().includes(q.toLowerCase()) || a.username?.toLowerCase().includes(q.toLowerCase()))
        : convs.length > 0
            ? convs.map(c => { const a = all.find(x => x.username === c.p); return a ? { ...a, unread: c.unread, last: c.last } : null }).filter(Boolean)
            : all

    if (loading) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'rgba(234,230,242,0.3)', fontSize: 20 }}>Loading...</p></div>

    return (
        <div style={{ display: 'flex', height: '100%' }}>

            {/* SIDEBAR */}
            <div style={{ width: 280, minWidth: 280, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)', display: sel ? 'none' : 'flex', flexDirection: 'column', height: '100%', background: '#0C0C1E' }} className="md:!flex">
                <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                    <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: '#F2EEF8', fontSize: 20, fontWeight: 300, marginBottom: 14 }}>Messages</p>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(234,230,242,0.3)', pointerEvents: 'none' }} />
                        <input type="text" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 30px', borderRadius: 22, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2EEF8', fontSize: 13, outline: 'none' }} />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {list.map(a => {
                        const c = gc(a.username), isSel = sel?.username === a.username, on = isOnline(a.username)
                        return (
                            <button key={a.username} onClick={() => setSel(a)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textAlign: 'left', background: isSel ? 'rgba(0,240,255,0.07)' : 'transparent', borderLeft: `3px solid ${isSel ? '#00F0FF' : 'transparent'}`, border: 'none', cursor: 'pointer' }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${c}20`, border: `2px solid ${c}35`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {a.profile_pic || a.image_url ? <img src={a.profile_pic || a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: c, fontSize: 18, fontFamily: "'Cormorant Garamond',serif" }}>{a.name?.[0]}</span>}
                                    </div>
                                    {on && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#00F0FF', border: '2px solid #0C0C1E' }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#F2EEF8', fontSize: 14, fontWeight: a.unread ? 600 : 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                                        {a.last && <span style={{ color: 'rgba(234,230,242,0.25)', fontSize: 11, flexShrink: 0, marginLeft: 4 }}>{ta(a.last.created_at)}</span>}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: a.unread ? 'rgba(234,230,242,0.7)' : 'rgba(234,230,242,0.35)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {on ? '🟢 Online' : a.last ? a.last.message.substring(0, 22) : `@${a.username}`}
                                        </span>
                                        {a.unread > 0 && <span style={{ background: '#00F0FF', color: '#03030A', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, flexShrink: 0, marginLeft: 4 }}>{a.unread}</span>}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* CHAT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, background: '#080818' }}>
                {sel ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: '#0D0D22' }}>
                            <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(234,230,242,0.5)', padding: 4, display: 'flex' }}><ArrowLeft size={20} /></button>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: `${gc(sel.username)}20`, border: `2px solid ${gc(sel.username)}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {sel.profile_pic || sel.image_url ? <img src={sel.profile_pic || sel.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: gc(sel.username), fontSize: 16, fontFamily: "'Cormorant Garamond',serif" }}>{sel.name?.[0]}</span>}
                                </div>
                                {isOnline(sel.username) && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: '#00F0FF', border: '2px solid #0D0D22' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ color: '#F2EEF8', fontSize: 16, margin: 0, fontWeight: 300, fontFamily: "'Cormorant Garamond',serif" }}>{sel.name}</p>
                                <p style={{ color: isOnline(sel.username) ? '#00F0FF' : 'rgba(234,230,242,0.4)', fontSize: 12, margin: 0 }}>
                                    {isOnline(sel.username) ? '🟢 Online' : `@${sel.username}`}
                                </p>
                            </div>
                            <a href={`/artist/${sel.username}`} style={{ color: 'rgba(0,240,255,0.5)', fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>View Chamber</a>
                        </div>

                        {/* Messages — ONLY this scrolls */}
                        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {msgs.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: `${gc(sel.username)}20`, border: `2px solid ${gc(sel.username)}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {sel.profile_pic || sel.image_url ? <img src={sel.profile_pic || sel.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: gc(sel.username), fontSize: 24, fontFamily: "'Cormorant Garamond',serif" }}>{sel.name?.[0]}</span>}
                                    </div>
                                    <p style={{ color: '#F2EEF8', fontSize: 18, fontWeight: 300, margin: 0, fontFamily: "'Cormorant Garamond',serif" }}>{sel.name}</p>
                                    <p style={{ color: 'rgba(234,230,242,0.35)', fontSize: 13, margin: 0 }}>Start a private conversation</p>
                                </div>
                            ) : msgs.map((msg, i) => {
                                const isMe = msg.sender_username === me.username
                                const next = msgs[i + 1], isLast = !next || next.sender_username !== msg.sender_username
                                const reactions = msg.reactions || {}
                                const c = gc(isMe ? me.username : sel.username)
                                return (
                                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8, marginTop: 2 }} className="group">
                                        {!isMe && (
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: `${gc(sel.username)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', visibility: isLast ? 'visible' : 'hidden' }}>
                                                {sel.profile_pic || sel.image_url ? <img src={sel.profile_pic || sel.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: gc(sel.username), fontSize: 12 }}>{sel.name?.[0]}</span>}
                                            </div>
                                        )}
                                        <div style={{ maxWidth: '65%' }}>
                                            {msg.image_url && <img src={msg.image_url} alt="img" onClick={() => window.open(msg.image_url, '_blank')} style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 14, cursor: 'pointer', display: 'block', marginBottom: 3 }} />}
                                            {msg.message !== '📷 Image' && (
                                                <div style={{ padding: '10px 15px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? `linear-gradient(135deg,${c}22,${c}10)` : 'rgba(255,255,255,0.08)', border: `1px solid ${isMe ? `${c}30` : 'rgba(255,255,255,0.1)'}` }}>
                                                    <p style={{ color: '#F2EEF8', fontSize: 14, margin: 0, lineHeight: 1.55 }}>{msg.message}</p>
                                                </div>
                                            )}
                                            {/* Reactions */}
                                            {Object.keys(reactions).length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                                    {Object.entries(reactions).map(([e, u]) => u.length > 0 && (
                                                        <button key={e} onClick={() => react(msg, e)}
                                                            style={{ fontSize: 12, padding: '2px 7px', borderRadius: 20, background: u.includes(me?.username) ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.07)', border: u.includes(me?.username) ? '1px solid rgba(0,240,255,0.3)' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                                                            {e} {u.length}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Seen + time */}
                                            {isLast && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                                    <span style={{ color: 'rgba(234,230,242,0.2)', fontSize: 11 }}>{ft(msg.created_at)}</span>
                                                    {isMe && (msg.read
                                                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#00F0FF', fontSize: 11 }}><CheckCheck size={12} /> Seen {ta(msg.created_at)}</span>
                                                        : <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(234,230,242,0.3)', fontSize: 11 }}><Check size={12} /> Sent</span>
                                                    )}
                                                </div>
                                            )}
                                            {/* Emoji on hover */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginTop: 2, position: 'relative' }}>
                                                <button onClick={() => setEmojiFor(emojiFor === msg.id ? null : msg.id)}
                                                    style={{ fontSize: 14, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                                                    😊
                                                </button>
                                                {emojiFor === msg.id && (
                                                    <div style={{ position: 'absolute', zIndex: 50, bottom: 28, [isMe ? 'right' : 'left']: 0, background: '#0E0E24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 10, width: 230, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
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
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Input */}
                        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: '#0D0D22' }}>
                            <label style={{ cursor: 'pointer', color: imgUp ? '#00F0FF' : 'rgba(234,230,242,0.4)', display: 'flex', padding: 6, flexShrink: 0 }}>
                                <Image size={22} />
                                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={sendImg} disabled={imgUp} />
                            </label>
                            <input ref={inputRef} type="text" placeholder={`Message ${sel.name}...`}
                                value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={handleKey}
                                style={{ flex: 1, padding: '11px 18px', borderRadius: 25, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', color: '#F2EEF8', fontSize: 14, outline: 'none' }} />
                            <button onClick={send} disabled={!txt.trim() || sending}
                                style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: txt.trim() && !sending ? `linear-gradient(135deg,${gc(me?.username || '')},#B57BFF)` : 'rgba(255,255,255,0.07)', border: 'none', cursor: txt.trim() && !sending ? 'pointer' : 'default', transition: 'background 0.3s' }}>
                                <Send size={18} style={{ color: txt.trim() && !sending ? '#03030A' : 'rgba(234,230,242,0.25)' }} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Send size={30} style={{ color: '#00F0FF', opacity: 0.7 }} strokeWidth={1.5} />
                        </div>
                        <p style={{ fontFamily: "'Cormorant Garamond',serif", color: '#F2EEF8', fontSize: 24, fontWeight: 300, margin: 0 }}>Your Messages</p>
                        <p style={{ color: 'rgba(234,230,242,0.3)', fontSize: 14, margin: 0 }}>Select an artist to start a private conversation</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function DMPage() {
    return (
        <div style={{ position: 'fixed', inset: 0, top: 64, background: '#080818', zIndex: 40 }}>
            <Suspense fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'rgba(234,230,242,0.3)', fontSize: 20 }}>Loading...</p></div>}>
                <DM />
            </Suspense>
        </div>
    )
}