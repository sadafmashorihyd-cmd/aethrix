'use client'
import { useState, useEffect, useMemo } from 'react'
import { Moon, Sun, Zap, CloudRain, Flame, Waves, Search, SlidersHorizontal, X, Feather } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const MOODS = [
  { id: 'all',           label: 'All Works',     icon: Feather,   color: '#EAE6F2' },
  { id: 'Midnight Rain', label: 'Midnight Rain', icon: CloudRain, color: '#00E5FF' },
  { id: 'Melancholy',    label: 'Melancholy',    icon: Moon,      color: '#B57BFF' },
  { id: 'Sunset',        label: 'Sunset',        icon: Sun,       color: '#FF6B35' },
  { id: 'Cyberpunk',     label: 'Cyberpunk',     icon: Zap,       color: '#00E5FF' },
  { id: 'Wildfire',      label: 'Wildfire',      icon: Flame,     color: '#FF4444' },
  { id: 'Deep Ocean',    label: 'Deep Ocean',    icon: Waves,     color: '#00B8D4' },
]

function ArtworkCard({ artwork }) {
  const [hovered, setHovered] = useState(false)
  const moodColor = MOODS.find(m => m.id === artwork.mood)?.color || '#00E5FF'

  return (
    <div className="artwork-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="w-full relative overflow-hidden" style={{ minHeight: '200px' }}>
        <img src={artwork.image_url} alt={artwork.name || 'Artwork'}
          className="w-full object-cover"
          style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.6s ease' }} />
      </div>
      <div className="artwork-card-overlay">
        <a href={`/artist/${artwork.username}`}
          className="text-xs tracking-widest uppercase mb-1 block"
          style={{ color: moodColor, opacity: 0.7 }}
          onClick={e => e.stopPropagation()}>
          {artwork.name || artwork.username}
        </a>
        <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>
          {artwork.title || artwork.medium || 'Untitled'}
        </p>
        {artwork.mood && (
          <p className="text-xs mt-1" style={{ color: 'rgba(234,230,242,0.3)' }}>{artwork.mood}</p>
        )}
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMood, setActiveMood] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => { fetchArtworks() }, [])

  const fetchArtworks = async () => {
    setLoading(true)

    // Applications table se — submitted artworks
    const { data: appData } = await supabase
      .from('applications')
      .select('*')
      .eq('status', 'approved')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })

    // Artworks table se — uploaded artworks
    const { data: artData } = await supabase
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false })

    const appFormatted = (appData || []).map(a => ({
      id: `app-${a.id}`,
      name: a.name,
      username: a.username,
      image_url: a.image_url,
      medium: a.medium,
      mood: a.mood,
      title: null,
    }))

    const artFormatted = (artData || []).map(a => ({
      id: `art-${a.id}`,
      name: a.artist_username,
      username: a.artist_username,
      image_url: a.image_url,
      medium: a.medium,
      mood: a.mood,
      title: a.title,
    }))

    setArtworks([...artFormatted, ...appFormatted])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let r = artworks
    if (activeMood !== 'all') r = r.filter(a => a.mood === activeMood)
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.medium?.toLowerCase().includes(q) ||
        a.title?.toLowerCase().includes(q)
      )
    }
    return r
  }, [artworks, activeMood, query])

  const activeMoodData = MOODS.find(m => m.id === activeMood)

  return (
    <div className="page-enter pt-24 pb-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <span className="section-label">Current Exhibition</span>
            <h1 className="font-display font-light leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--ghost)' }}>
              The Midnight<br />
              <em className="italic" style={{ color: activeMoodData?.color || 'var(--cyan)', transition: 'color 0.4s ease' }}>
                Gallery
              </em>
            </h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(234,230,242,0.3)' }}>
              {filtered.length} works on display
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgba(234,230,242,0.3)' }} />
            <input type="text" placeholder="Search artworks, artists..." value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-sacred pl-9 pr-9 py-2.5 text-sm" />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(234,230,242,0.3)' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="glow-line" style={{ margin: '0 0 1.5rem' }} />

        {/* Mood Sanctuary */}
        <div className="rounded-sm p-4 mb-8 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${activeMoodData?.color || '#00E5FF'}, transparent)`,
              opacity: 0.05, filter: 'blur(30px)', transition: 'all 0.5s ease'
            }} />
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={12} style={{ color: activeMoodData?.color || 'var(--cyan)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(234,230,242,0.35)' }}>
              Mood Sanctuary
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(mood => {
              const Icon = mood.icon
              const isActive = activeMood === mood.id
              return (
                <button key={mood.id} onClick={() => setActiveMood(mood.id)} className="mood-badge"
                  style={isActive ? {
                    color: mood.color,
                    borderColor: mood.color,
                    background: `${mood.color}10`,
                    boxShadow: `0 0 18px ${mood.color}20`
                  } : {}}>
                  <Icon size={10} strokeWidth={1.5} />
                  {mood.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {loading ? (
          <div className="text-center py-28">
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>
              Loading gallery...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-28">
            <Feather size={36} className="mx-auto mb-5 opacity-15" strokeWidth={0.8} />
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.25)' }}>
              No works yet.
            </p>
          </div>
        ) : (
          <div className="masonry-grid">
            {filtered.map(art => <ArtworkCard key={art.id} artwork={art} />)}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="text-center mt-16">
            <button className="btn-velvet mx-auto" onClick={fetchArtworks}>
              <span>Refresh Gallery</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}