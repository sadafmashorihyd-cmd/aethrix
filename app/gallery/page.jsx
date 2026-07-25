'use client'
import { useState, useMemo } from 'react'
import { Moon, Sun, Zap, CloudRain, Flame, Waves, Search, SlidersHorizontal, X, Feather } from 'lucide-react'

const MOODS = [
  { id: 'all',           label: 'All Works',     icon: Feather,   color: '#EAE6F2' },
  { id: 'midnight-rain', label: 'Midnight Rain', icon: CloudRain, color: '#00E5FF' },
  { id: 'melancholy',    label: 'Melancholy',    icon: Moon,      color: '#B57BFF' },
  { id: 'sunset',        label: 'Sunset',        icon: Sun,       color: '#FF6B35' },
  { id: 'cyberpunk',     label: 'Cyberpunk',     icon: Zap,       color: '#00E5FF' },
  { id: 'wildfire',      label: 'Wildfire',      icon: Flame,     color: '#FF4444' },
  { id: 'deep-ocean',    label: 'Deep Ocean',    icon: Waves,     color: '#00B8D4' },
]

const ARTWORKS = [
  { id: 1,  title: 'Shattered Glass Iris',  artist: 'Zainab Khalid',  username: 'zainab-k',  mood: 'midnight-rain', medium: 'Digital Ink',        aspect: 'aspect-[3/4]',  gradient: 'from-cyan-900/50 via-blue-900/30',    color: '#00E5FF', year: 2024 },
  { id: 2,  title: 'The Weight of Silence', artist: 'Arslan Mehboob', username: 'arslan-m',  mood: 'melancholy',    medium: 'Pencil on Paper',    aspect: 'aspect-square', gradient: 'from-violet-900/50 via-purple-900/30', color: '#B57BFF', year: 2025 },
  { id: 3,  title: 'Amber Horizons',        artist: 'Aisha Raza',     username: 'aisha-r',   mood: 'sunset',        medium: 'Oil Pastel',         aspect: 'aspect-[4/5]',  gradient: 'from-orange-900/50 via-red-900/30',   color: '#FF6B35', year: 2024 },
  { id: 4,  title: 'Neon Dharma',           artist: 'Haris Javed',    username: 'haris-j',   mood: 'cyberpunk',     medium: 'Digital Art',        aspect: 'aspect-[3/4]',  gradient: 'from-cyan-900/40 via-teal-900/20',    color: '#00E5FF', year: 2025 },
  { id: 5,  title: 'Desert Storm Waltz',    artist: 'Fatima Noor',    username: 'fatima-n',  mood: 'wildfire',      medium: 'Acrylic',            aspect: 'aspect-[5/6]',  gradient: 'from-red-900/50 via-orange-900/30',   color: '#FF4444', year: 2024 },
  { id: 6,  title: 'Midnight Letters',      artist: 'Omar Sheikh',    username: 'omar-s',    mood: 'midnight-rain', medium: 'Ink Calligraphy',    aspect: 'aspect-square', gradient: 'from-blue-900/40 via-indigo-900/30',  color: '#00E5FF', year: 2025 },
  { id: 7,  title: 'Submerged Reverie',     artist: 'Sara Malik',     username: 'sara-m',    mood: 'deep-ocean',    medium: 'Watercolor',         aspect: 'aspect-[2/3]',  gradient: 'from-cyan-900/30 via-blue-900/50',    color: '#00B8D4', year: 2024 },
  { id: 8,  title: 'Ghost Protocol',        artist: 'Bilal Qureshi',  username: 'bilal-q',   mood: 'cyberpunk',     medium: 'Digital Glitch Art', aspect: 'aspect-[4/5]',  gradient: 'from-violet-900/30 via-cyan-900/20',  color: '#B57BFF', year: 2025 },
  { id: 9,  title: 'The Grieving Garden',   artist: 'Mahnoor Bano',   username: 'mahnoor-b', mood: 'melancholy',    medium: 'Charcoal',           aspect: 'aspect-[3/4]',  gradient: 'from-violet-900/60 via-gray-900/40',  color: '#B57BFF', year: 2024 },
  { id: 10, title: 'Fire Scripture',        artist: 'Kamran Ali',     username: 'kamran-a',  mood: 'wildfire',      medium: 'Ink on Canvas',      aspect: 'aspect-square', gradient: 'from-red-900/60 via-orange-900/20',   color: '#FF4444', year: 2025 },
  { id: 11, title: 'Bosphorus Dream',       artist: 'Leyla Demir',    username: 'leyla-d',   mood: 'sunset',        medium: 'Gouache',            aspect: 'aspect-[4/5]',  gradient: 'from-amber-900/50 via-rose-900/30',   color: '#FF6B35', year: 2024 },
  { id: 12, title: 'Abyssal Light',         artist: 'Jin-ho Park',    username: 'jinho-p',   mood: 'deep-ocean',    medium: 'Digital Painting',   aspect: 'aspect-[3/4]',  gradient: 'from-teal-900/40 via-blue-900/50',    color: '#00B8D4', year: 2025 },
]

function ArtworkCard({ artwork }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="artwork-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={`w-full ${artwork.aspect} bg-gradient-to-b ${artwork.gradient} to-void relative overflow-hidden`}>
        <div className="absolute inset-0 noise-overlay" style={{ opacity: 0.85 }} />
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: hovered ? 0.55 : 0.2, transition: 'opacity 0.5s ease' }}>
          <div className="w-2/3 h-2/3 rounded-full"
            style={{ background: `radial-gradient(ellipse, ${artwork.color}, transparent)`, filter: 'blur(28px)' }} />
        </div>
        <div className="absolute top-3 left-3 z-10" style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.4s ease' }}>
          <span className="text-xs tracking-widest uppercase px-2 py-1 rounded-sm"
            style={{ color: artwork.color, background: `${artwork.color}15`, border: `1px solid ${artwork.color}30`, backdropFilter: 'blur(8px)' }}>
            {artwork.medium}
          </span>
        </div>
      </div>
      <div className="artwork-card-overlay">
        <a href={`/artist/${artwork.username}`} className="text-xs tracking-widest uppercase mb-1 block"
          style={{ color: artwork.color, opacity: 0.7 }} onClick={e => e.stopPropagation()}>
          {artwork.artist}
        </a>
        <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{artwork.title}</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(234,230,242,0.3)' }}>{artwork.year}</p>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const [activeMood, setActiveMood] = useState('all')
  const [query, setQuery] = useState('')
  const activeMoodData = MOODS.find(m => m.id === activeMood)

  const filtered = useMemo(() => {
    let r = ARTWORKS
    if (activeMood !== 'all') r = r.filter(a => a.mood === activeMood)
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(a => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q))
    }
    return r
  }, [activeMood, query])

  return (
    <div className="page-enter pt-24 pb-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <span className="section-label">Current Exhibition</span>
            <h1 className="font-display font-light leading-tight" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--ghost)' }}>
              The Midnight<br />
              <em className="italic" style={{ color: activeMoodData?.color || 'var(--cyan)', transition: 'color 0.4s ease' }}>Gallery</em>
            </h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(234,230,242,0.3)' }}>
              {filtered.length} works on display
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(234,230,242,0.3)' }} />
            <input type="text" placeholder="Search artworks, artists..." value={query}
              onChange={e => setQuery(e.target.value)} className="input-sacred pl-9 pr-9 py-2.5 text-sm" />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(234,230,242,0.3)' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="glow-line" style={{ margin: '0 0 1.5rem' }} />

        <div className="rounded-sm p-4 mb-8 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${activeMoodData?.color || '#00E5FF'}, transparent)`, opacity: 0.05, filter: 'blur(30px)', transition: 'all 0.5s ease' }} />
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={12} style={{ color: activeMoodData?.color || 'var(--cyan)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(234,230,242,0.35)' }}>Mood Sanctuary</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(mood => {
              const Icon = mood.icon
              const isActive = activeMood === mood.id
              return (
                <button key={mood.id} onClick={() => setActiveMood(mood.id)} className="mood-badge"
                  style={isActive ? { color: mood.color, borderColor: mood.color, background: `${mood.color}10`, boxShadow: `0 0 18px ${mood.color}20` } : {}}>
                  <Icon size={10} strokeWidth={1.5} />
                  {mood.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {filtered.length === 0 ? (
          <div className="text-center py-28">
            <Feather size={36} className="mx-auto mb-5 opacity-15" strokeWidth={0.8} />
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.25)' }}>No works match this mood.</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {filtered.map(art => <ArtworkCard key={art.id} artwork={art} />)}
          </div>
        )}
        {filtered.length > 0 && (
          <div className="text-center mt-16">
            <button className="btn-velvet mx-auto"><span>Load More Masterpieces</span></button>
          </div>
        )}
      </div>
    </div>
  )
}
