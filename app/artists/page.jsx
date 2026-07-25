'use client'
import { useState } from 'react'
import { Search, Feather, MapPin } from 'lucide-react'

const ARTISTS = [
  { name: 'Zainab Khalid',  username: 'zainab-k',  title: 'Ink Alchemist',       location: 'Lahore, PK',    works: 24, mediums: ['Digital Ink', 'Charcoal'],    color: '#00E5FF', passportNo: 'AX-00041' },
  { name: 'Arslan Mehboob', username: 'arslan-m',  title: 'Digital Surrealist',  location: 'Karachi, PK',   works: 18, mediums: ['Pencil', 'Digital Art'],      color: '#B57BFF', passportNo: 'AX-00087' },
  { name: 'Aisha Raza',     username: 'aisha-r',   title: 'Oil & Soul',          location: 'Islamabad, PK', works: 31, mediums: ['Oil Pastel', 'Watercolor'],   color: '#FF6B35', passportNo: 'AX-00012' },
  { name: 'Haris Javed',    username: 'haris-j',   title: 'Neon Dreamer',        location: 'Istanbul, TR',  works: 15, mediums: ['Digital Art', 'Glitch'],      color: '#00E5FF', passportNo: 'AX-00156' },
  { name: 'Fatima Noor',    username: 'fatima-n',  title: 'Abstract Fury',       location: 'Cairo, EG',     works: 22, mediums: ['Acrylic', 'Mixed Media'],     color: '#FF4444', passportNo: 'AX-00203' },
  { name: 'Sara Malik',     username: 'sara-m',    title: 'Water & Memory',      location: 'Tehran, IR',    works: 19, mediums: ['Watercolor', 'Ink'],          color: '#00B8D4', passportNo: 'AX-00089' },
  { name: 'Omar Sheikh',    username: 'omar-s',    title: 'Calligraphy Master',  location: 'Dubai, UAE',    works: 27, mediums: ['Calligraphy', 'Gold Leaf'],   color: '#00E5FF', passportNo: 'AX-00034' },
  { name: 'Leyla Demir',    username: 'leyla-d',   title: 'Colour Poet',         location: 'Seoul, KR',     works: 14, mediums: ['Gouache', 'Pastel'],          color: '#FF6B35', passportNo: 'AX-00298' },
]

export default function ArtistsPage() {
  const [query, setQuery] = useState('')
  const filtered = ARTISTS.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.location.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="page-enter pt-24 pb-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
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
            <input type="text" placeholder="Search artists, cities..." value={query}
              onChange={e => setQuery(e.target.value)} className="input-sacred pl-9 py-2.5 text-sm" />
          </div>
        </div>

        <div className="glow-line" style={{ margin: '0 0 2.5rem' }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((artist, i) => (
            <a key={artist.username} href={`/artist/${artist.username}`}
              className="tenet-card group block no-underline"
              style={{ animationDelay: `${i * 60}ms`, textDecoration: 'none' }}>

              {/* Avatar placeholder */}
              <div className="w-16 h-16 rounded-full mb-4 relative overflow-hidden flex items-center justify-center"
                style={{ background: `${artist.color}15`, border: `1px solid ${artist.color}30` }}>
                <div className="w-10 h-10 rounded-full"
                  style={{ background: `radial-gradient(circle, ${artist.color}, transparent)`, opacity: 0.5, filter: 'blur(6px)' }} />
                <Feather size={16} className="absolute" style={{ color: artist.color, opacity: 0.7 }} strokeWidth={1.5} />
              </div>

              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: artist.color, opacity: 0.6 }}>
                {artist.passportNo}
              </p>
              <h3 className="font-display text-xl font-light mb-1" style={{ color: 'var(--ghost)' }}>{artist.name}</h3>
              <p className="text-xs mb-3" style={{ color: 'rgba(234,230,242,0.35)' }}>{artist.title}</p>

              <div className="flex items-center gap-1 mb-3">
                <MapPin size={10} style={{ color: 'rgba(234,230,242,0.25)' }} />
                <span className="text-xs" style={{ color: 'rgba(234,230,242,0.25)' }}>{artist.location}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {artist.mediums.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-sm"
                    style={{ color: 'rgba(234,230,242,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {m}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs" style={{ color: 'rgba(234,230,242,0.25)' }}>{artist.works} works</span>
                <span className="text-xs" style={{ color: artist.color, opacity: 0.6 }}>View Chamber →</span>
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-28">
            <Feather size={36} className="mx-auto mb-5 opacity-15" strokeWidth={0.8} />
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.25)' }}>No artists found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
