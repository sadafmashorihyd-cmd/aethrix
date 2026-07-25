'use client'
import { useState, useEffect } from 'react'
import { Feather, Instagram, Twitter, Linkedin, Globe, Upload, Check, Plus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const MOODS = ['Midnight Rain', 'Melancholy', 'Sunset', 'Cyberpunk', 'Wildfire', 'Deep Ocean']

function WorkCard({ work, hovered, onHover }) {
  const moodColor = '#00E5FF'
  return (
    <div className="artwork-card" onMouseEnter={() => onHover(work.id)} onMouseLeave={() => onHover(null)}>
      <div className="w-full relative overflow-hidden" style={{ minHeight: '200px' }}>
        <img src={work.image_url} alt={work.title || 'Artwork'}
          className="w-full object-cover"
          style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.6s ease' }} />
      </div>
      <div className="artwork-card-overlay">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: moodColor, opacity: 0.7 }}>{work.mood}</p>
        <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{work.title || work.medium}</p>
      </div>
    </div>
  )
}

export default function ArtistChamberPage({ params }) {
  const [artist, setArtist] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', medium: '', mood: '' })
  const [uploadFile, setUploadFile] = useState(null)
  const [uploaded, setUploaded] = useState(false)

  useEffect(() => {
    fetchArtist()
    fetchArtworks()
  }, [])

  const fetchArtist = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('username', params.username)
      .single()
    if (data) setArtist(data)
    setLoading(false)
  }

  const fetchArtworks = async () => {
    const { data } = await supabase
      .from('artworks')
      .select('*')
      .eq('artist_username', params.username)
      .order('created_at', { ascending: false })
    if (data) setArtworks(data)
  }

  const handleUpload = async () => {
    if (!uploadFile) return
    setUploading(true)
    try {
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${Date.now()}-${params.username}.${fileExt}`
      const { error: upErr } = await supabase.storage.from('artworks').upload(fileName, uploadFile)
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(fileName)
      const { error: dbErr } = await supabase.from('artworks').insert({
        artist_username: params.username,
        image_url: urlData.publicUrl,
        title: uploadForm.title,
        medium: uploadForm.medium || artist?.medium,
        mood: uploadForm.mood,
      })
      if (dbErr) throw dbErr
      setUploaded(true)
      setUploadForm({ title: '', medium: '', mood: '' })
      setUploadFile(null)
      fetchArtworks()
      setTimeout(() => { setUploaded(false); setShowUpload(false) }, 2000)
    } catch (err) {
      console.error(err)
    }
    setUploading(false)
  }

  const SOCIAL_LINKS = [
    { key: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C', prefix: 'https://instagram.com/' },
    { key: 'twitter', label: 'Twitter', icon: Twitter, color: '#1DA1F2', prefix: 'https://twitter.com/' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0077B5', prefix: 'https://linkedin.com/in/' },
    { key: 'tiktok', label: 'TikTok', icon: Globe, color: '#00F2EA', prefix: 'https://tiktok.com/@' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
    </div>
  )

  if (!artist) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Artist not found.</p>
    </div>
  )

  const allWorks = [
    ...(artist.image_url ? [{ id: 'main', image_url: artist.image_url, title: 'Original Submission', medium: artist.medium, mood: artist.mood }] : []),
    ...artworks
  ]

  return (
    <div className="page-enter pt-24 pb-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2">
            {artist.image_url && (
              <div className="w-24 h-24 rounded-full mb-6 overflow-hidden"
                style={{ border: '1px solid rgba(0,229,255,0.3)' }}>
                <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="font-display font-light leading-[0.92] mb-4"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: 'var(--ghost)' }}>
              {artist.name}
            </h1>
            <p className="text-xs tracking-widest uppercase mb-6" style={{ color: 'var(--cyan)' }}>
              @{artist.username} · {artist.medium}
            </p>
            {artist.bio && (
              <p className="font-display text-lg font-light italic leading-relaxed max-w-xl mb-8"
                style={{ color: 'rgba(234,230,242,0.45)' }}>
                "{artist.bio}"
              </p>
            )}
            <div className="flex flex-wrap gap-3 mb-8">
              {SOCIAL_LINKS.map(social => {
                const Icon = social.icon
                const handle = artist[social.key]
                if (!handle) return null
                return (
                  <a key={social.key} href={`${social.prefix}${handle}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-velvet" style={{ borderColor: `${social.color}40`, color: social.color }}>
                    <Icon size={13} /><span>{social.label}</span>
                  </a>
                )
              })}
            </div>
          </div>

          <div className="tenet-card">
            <p className="section-label">Artist Info</p>
            <div className="space-y-5">
              {[
                { label: 'Medium', val: artist.medium || 'Not specified' },
                { label: 'Mood', val: artist.mood || 'Not specified' },
                { label: 'Status', val: '✓ Verified Artist' },
                { label: 'Works', val: `${allWorks.length} pieces` },
                { label: 'Joined', val: new Date(artist.created_at).toLocaleDateString() },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(234,230,242,0.25)' }}>{r.label}</p>
                  <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{r.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glow-line" style={{ margin: '3rem 0 2.5rem' }} />

        {/* Works Section */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="section-label">The Chamber</span>
            <h2 className="font-display text-4xl font-light" style={{ color: 'var(--ghost)' }}>
              {allWorks.length} {allWorks.length === 1 ? 'Masterpiece' : 'Masterpieces'}
            </h2>
          </div>
          <button onClick={() => setShowUpload(!showUpload)} className="btn-velvet">
            <Plus size={13} /><span>Add Artwork</span>
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="rounded-sm p-6 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,229,255,0.15)' }}>
            <h3 className="font-display text-2xl font-light mb-5" style={{ color: 'var(--ghost)' }}>Upload New Artwork</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Title</label>
                <input type="text" placeholder="Artwork title..." value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="input-sacred" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Medium</label>
                <input type="text" placeholder="Pencil, Oil, Digital..." value={uploadForm.medium}
                  onChange={e => setUploadForm({ ...uploadForm, medium: e.target.value })}
                  className="input-sacred" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Mood</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(m => (
                  <button key={m} type="button" onClick={() => setUploadForm({ ...uploadForm, mood: m })}
                    className="mood-badge"
                    style={uploadForm.mood === m ? { color: 'var(--cyan)', borderColor: 'var(--cyan)', background: 'rgba(0,229,255,0.08)' } : {}}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Artwork Image</label>
              <div className="rounded-sm p-6 text-center cursor-pointer"
                style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
                onClick={() => document.getElementById('artwork-upload').click()}>
                <input id="artwork-upload" type="file" className="hidden" accept="image/*"
                  onChange={e => setUploadFile(e.target.files[0])} />
                {uploadFile ? (
                  <p className="font-display text-lg font-light" style={{ color: 'var(--cyan)' }}>{uploadFile.name}</p>
                ) : (
                  <div>
                    <Upload size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm" style={{ color: 'rgba(234,230,242,0.4)' }}>Click to upload artwork</p>
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleUpload} disabled={!uploadFile || uploading}
              className="btn-ember w-full justify-center"
              style={{ opacity: !uploadFile || uploading ? 0.6 : 1 }}>
              {uploaded ? <><Check size={14} /><span>Uploaded!</span></> :
                uploading ? <span>Uploading...</span> :
                  <><Upload size={14} /><span>Upload Artwork</span></>}
            </button>
          </div>
        )}

        {/* Gallery */}
        {allWorks.length === 0 ? (
          <div className="text-center py-20">
            <Feather size={32} className="mx-auto mb-4 opacity-20" strokeWidth={0.8} />
            <p className="font-display text-xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>No works yet.</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {allWorks.map(work => (
              <WorkCard key={work.id} work={work} hovered={hoveredId === work.id} onHover={setHoveredId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}