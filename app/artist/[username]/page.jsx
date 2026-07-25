'use client'
import { useState, useEffect } from 'react'
import { Feather, Globe } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function ArtistChamberPage({ params }) {
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArtist()
  }, [])

  const fetchArtist = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('username', params.username)
      .single()
    if (!error) setArtist(data)
    setLoading(false)
  }

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

  return (
    <div className="page-enter pt-24 pb-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2">

            {/* Avatar */}
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

            <div className="flex flex-wrap gap-4 mb-8">
              {artist.mood && (
                <span className="text-sm" style={{ color: 'rgba(234,230,242,0.4)' }}>
                  Mood: {artist.mood}
                </span>
              )}
              <span className="text-sm" style={{ color: 'rgba(234,230,242,0.4)' }}>
                {artist.email}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="tenet-card">
            <p className="section-label">Artist Info</p>
            <div className="space-y-5">
              {[
                { label: 'Medium', val: artist.medium || 'Not specified' },
                { label: 'Mood', val: artist.mood || 'Not specified' },
                { label: 'Status', val: 'Verified ✓' },
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

        {/* Artwork */}
        {artist.image_url && (
          <div>
            <span className="section-label">Submitted Work</span>
            <h2 className="font-display text-4xl font-light mb-8" style={{ color: 'var(--ghost)' }}>
              The Masterpiece
            </h2>
            <div className="max-w-lg">
              <div className="rounded-sm overflow-hidden">
                <img src={artist.image_url} alt="Artwork" className="w-full" />
              </div>
              <p className="font-display text-xl font-light mt-4 italic" style={{ color: 'rgba(234,230,242,0.5)' }}>
                {artist.medium} · {artist.mood}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}