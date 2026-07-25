'use client'
import { useState, useEffect } from 'react'
import { Search, Feather, MapPin } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function ArtistsPage() {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchArtists()
  }, [])

  const fetchArtists = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (!error) setArtists(data || [])
    setLoading(false)
  }

  const filtered = artists.filter(a =>
    a.name?.toLowerCase().includes(query.toLowerCase()) ||
    a.username?.toLowerCase().includes(query.toLowerCase()) ||
    a.medium?.toLowerCase().includes(query.toLowerCase())
  )

  const COLORS = ['#00E5FF', '#B57BFF', '#FF6B35', '#FF4444', '#00B8D4', '#FFD580']

  return (
    <div className="page-enter pt-24 pb-28 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <span className="section-label">Verified Artists</span>
            <h1 className="font-display font-light" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--ghost)' }}>
              The<br /><em className="italic" style={{ color: 'var(--cyan)' }}>Chosen Few</em>
            </h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(234,230,242,0.3)' }}>
              {filtered.length} verified artists · Passport holders only
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(234,230,242,0.3)' }} />
            <input type="text" placeholder="Search artists..." value={query}
              onChange={e => setQuery(e.target.value)} className="input-sacred pl-9 py-2.5 text-sm" />
          </div>
        </div>

        <div className="glow-line" style={{ margin: '0 0 2.5rem' }} />

        {loading ? (
          <div className="text-center py-28">
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading artists...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-28">
            <Feather size={36} className="mx-auto mb-5 opacity-15" strokeWidth={0.8} />
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.25)' }}>No artists found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((artist, i) => {
              const color = COLORS[i % COLORS.length]
              return (
                <a key={artist.id} href={`/artist/${artist.username}`}
                  className="tenet-card block no-underline" style={{ textDecoration: 'none' }}>

                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full mb-4 relative overflow-hidden flex items-center justify-center"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <Feather size={16} style={{ color, opacity: 0.7 }} strokeWidth={1.5} />
                    )}
                  </div>

                  <h3 className="font-display text-xl font-light mb-1" style={{ color: 'var(--ghost)' }}>{artist.name}</h3>
                  <p className="text-xs mb-3" style={{ color: 'rgba(234,230,242,0.35)' }}>@{artist.username}</p>

                  {artist.medium && (
                    <span className="text-xs px-2 py-0.5 rounded-sm mb-3 inline-block"
                      style={{ color: 'rgba(234,230,242,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {artist.medium}
                    </span>
                  )}

                  {artist.mood && (
                    <p className="text-xs mb-3" style={{ color: 'rgba(234,230,242,0.25)' }}>Mood: {artist.mood}</p>
                  )}

                  <div className="flex items-center justify-end pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-xs" style={{ color, opacity: 0.6 }}>View Chamber →</span>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}