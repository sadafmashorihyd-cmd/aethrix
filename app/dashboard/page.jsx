'use client'
import { useState, useEffect } from 'react'
import { Save, Check, Instagram, Twitter, Linkedin, Globe, Feather, Camera } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
    const [artist, setArtist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [uploadingPic, setUploadingPic] = useState(false)
    const [form, setForm] = useState({
        bio: '', instagram: '', twitter: '', linkedin: '', tiktok: '', facebook: ''
    })

    useEffect(() => { checkUser() }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }
        const { data } = await supabase
            .from('applications')
            .select('*')
            .eq('email', user.email)
            .eq('status', 'approved')
            .single()
        if (data) {
            setArtist(data)
            setForm({
                bio: data.bio || '',
                instagram: data.instagram || '',
                twitter: data.twitter || '',
                linkedin: data.linkedin || '',
                tiktok: data.tiktok || '',
                facebook: data.facebook || '',
            })
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!artist) return
        setSaving(true)
        await supabase.from('applications').update({
            bio: form.bio, instagram: form.instagram, twitter: form.twitter,
            linkedin: form.linkedin, tiktok: form.tiktok, facebook: form.facebook,
        }).eq('id', artist.id)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        setSaving(false)
    }

    const handleProfilePic = async (e) => {
        const file = e.target.files[0]
        if (!file || !artist) return
        setUploadingPic(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `profile-${artist.username}-${Date.now()}.${fileExt}`
            const { error: upErr } = await supabase.storage.from('artworks').upload(fileName, file)
            if (upErr) throw upErr
            const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(fileName)
            await supabase.from('applications').update({ image_url: urlData.publicUrl }).eq('id', artist.id)
            setArtist({ ...artist, image_url: urlData.publicUrl })
        } catch (err) { console.error(err) }
        setUploadingPic(false)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
        </div>
    )

    if (!artist) return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <Feather size={40} className="mx-auto mb-6 opacity-20" strokeWidth={0.8} />
                <h2 className="font-display text-3xl font-light mb-4" style={{ color: 'var(--ghost)' }}>Not Yet Approved</h2>
                <p className="font-display text-lg font-light italic mb-8" style={{ color: 'rgba(234,230,242,0.4)' }}>
                    Your application is under review. We will notify you within 48 hours.
                </p>
                <button onClick={handleSignOut} className="btn-velvet mx-auto"><span>Sign Out</span></button>
            </div>
        </div>
    )

    return (
        <div className="page-enter pt-24 pb-28 px-4">
            <div className="max-w-3xl mx-auto">

                <div className="flex items-start justify-between mb-12">
                    <div>
                        <span className="section-label">Artist Dashboard</span>
                        <h1 className="font-display text-5xl font-light" style={{ color: 'var(--ghost)' }}>
                            Welcome,<br />
                            <em className="italic" style={{ color: 'var(--cyan)' }}>{artist.name}</em>
                        </h1>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <a href={`/artist/${artist.username}`} className="btn-velvet"><span>View Chamber</span></a>
                        <button onClick={handleSignOut} className="btn-velvet"
                            style={{ borderColor: 'rgba(255,68,68,0.3)', color: '#FF4444' }}>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Profile Picture */}
                <div className="rounded-sm p-7 mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <h2 className="font-display text-2xl font-light mb-6" style={{ color: 'var(--ghost)' }}>Profile Picture</h2>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full overflow-hidden relative flex-shrink-0"
                            style={{ border: '2px solid rgba(0,229,255,0.3)' }}>
                            {artist.image_url ? (
                                <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"
                                    style={{ background: 'rgba(0,229,255,0.1)' }}>
                                    <Feather size={24} style={{ color: 'var(--cyan)', opacity: 0.5 }} strokeWidth={1.5} />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-sm mb-3" style={{ color: 'rgba(234,230,242,0.4)' }}>
                                Upload a profile picture or use your artwork as your avatar.
                            </p>
                            <label className="btn-velvet cursor-pointer inline-flex">
                                <Camera size={13} />
                                <span>{uploadingPic ? 'Uploading...' : 'Change Picture'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePic} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Profile Edit */}
                <div className="rounded-sm p-7 mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <h2 className="font-display text-2xl font-light mb-6" style={{ color: 'var(--ghost)' }}>Your Profile</h2>

                    <div className="mb-5">
                        <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Bio / Manifesto</label>
                        <textarea className="input-sacred resize-none" style={{ minHeight: '100px', lineHeight: '1.7' }}
                            placeholder="Tell the world about your art..."
                            value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                    </div>

                    <h3 className="font-display text-xl font-light mb-4" style={{ color: 'var(--ghost)' }}>Social Links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {[
                            { key: 'instagram', label: 'Instagram', color: '#E1306C', placeholder: 'username' },
                            { key: 'twitter', label: 'Twitter / X', color: '#1DA1F2', placeholder: 'handle' },
                            { key: 'linkedin', label: 'LinkedIn', color: '#0077B5', placeholder: 'profile-name' },
                            { key: 'tiktok', label: 'TikTok', color: '#00F2EA', placeholder: 'username' },
                            { key: 'facebook', label: 'Facebook', color: '#1877F2', placeholder: 'profile or page name' },
                        ].map(social => (
                            <div key={social.key}>
                                <label className="block text-xs tracking-widest uppercase mb-2"
                                    style={{ color: social.color, opacity: 0.7 }}>
                                    {social.label}
                                </label>
                                <input type="text" placeholder={social.placeholder}
                                    value={form[social.key]}
                                    onChange={e => setForm({ ...form, [social.key]: e.target.value })}
                                    className="input-sacred" />
                            </div>
                        ))}
                    </div>

                    <button onClick={handleSave} disabled={saving} className="btn-ember w-full justify-center"
                        style={{ opacity: saving ? 0.7 : 1 }}>
                        {saved ? <><Check size={14} /><span>Saved!</span></> :
                            saving ? <span>Saving...</span> :
                                <><Save size={14} /><span>Save Profile</span></>}
                    </button>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Username', val: `@${artist.username}` },
                        { label: 'Medium', val: artist.medium || 'Not set' },
                        { label: 'Status', val: '✓ Verified' },
                    ].map(r => (
                        <div key={r.label} className="tenet-card text-center">
                            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.25)' }}>{r.label}</p>
                            <p className="font-display text-lg font-light" style={{ color: 'var(--cyan)' }}>{r.val}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}