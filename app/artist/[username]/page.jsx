'use client'
import { useState } from 'react'
import { MapPin, Calendar, Palette, Globe, Feather } from 'lucide-react'

const ARTIST = {
  name: 'Zainab Khalid', username: 'zainab-k', title: 'Ink Alchemist · Digital Surrealist',
  bio: 'I paint what words abandon. My work lives in the space between midnight and 3am — that suspended silence where emotion refuses to be named.',
  location: 'Lahore, Pakistan', joinedYear: 2024, passportNo: 'AX-00041',
  mediums: ['Digital Ink', 'Charcoal', 'Watercolor'],
  website: 'https://zainab.art',
  stats: { works: 24, admirers: 1847, years: 6 },
  works: [
    { id: 1, title: 'Shattered Glass Iris',  mood: 'Midnight Rain', aspect: 'aspect-[3/4]',  gradient: 'from-cyan-900/50 via-blue-900/30',    color: '#00E5FF', year: 2024 },
    { id: 2, title: 'Letters I Never Sent',  mood: 'Melancholy',    aspect: 'aspect-square', gradient: 'from-violet-900/50 via-purple-900/30', color: '#B57BFF', year: 2025 },
    { id: 3, title: 'The City at 4AM',       mood: 'Midnight Rain', aspect: 'aspect-[4/5]',  gradient: 'from-blue-900/50 via-cyan-900/20',    color: '#00E5FF', year: 2024 },
    { id: 4, title: 'Grief, Annotated',      mood: 'Melancholy',    aspect: 'aspect-[3/4]',  gradient: 'from-violet-900/60 via-indigo-900/30', color: '#B57BFF', year: 2025 },
    { id: 5, title: 'What Remains',          mood: 'Midnight Rain', aspect: 'aspect-[5/6]',  gradient: 'from-teal-900/40 via-blue-900/40',    color: '#00E5FF', year: 2024 },
    { id: 6, title: 'Dissolving Portraits',  mood: 'Melancholy',    aspect: 'aspect-square', gradient: 'from-purple-900/50 via-violet-900/20', color: '#B57BFF', year: 2025 },
  ]
}

function WorkCard({ work }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="artwork-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={`w-full ${work.aspect} bg-gradient-to-b ${work.gradient} to-void relative overflow-hidden`}>
        <div className="absolute inset-0 noise-overlay" style={{ opacity: 0.9 }} />
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: hovered ? 0.5 : 0.18, transition: 'opacity 0.5s ease' }}>
          <div className="w-2/3 h-2/3 rounded-full"
            style={{ background: `radial-gradient(ellipse, ${work.color}, transparent)`, filter: 'blur(28px)' }} />
        </div>
      </div>
      <div className="artwork-card-overlay">
        <span className="text-xs tracking-widest uppercase mb-1 block" style={{ color: work.color, opacity: 0.6 }}>{work.mood}</span>
        <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{work.title}</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(234,230,242,0.3)' }}>{work.year}</p>
      </div>
    </div>
  )
}

export default function ArtistChamberPage() {
  return (
    <div className="page-enter pt-24 pb-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">

        {/* Passport badge */}
        <div className="flex items-center gap-3 mb-10 opacity-25">
          <div className="w-8 h-px" style={{ background: 'var(--cyan)' }} />
          <span className="text-xs tracking-[0.4em] uppercase" style={{ color: 'var(--cyan)' }}>
            Artist Passport · {ARTIST.passportNo}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Identity */}
          <div className="lg:col-span-2">
            <h1 className="font-display font-light leading-[0.92] mb-4"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: 'var(--ghost)' }}>
              {ARTIST.name}
            </h1>
            <p className="text-xs tracking-widest uppercase mb-6" style={{ color: 'var(--cyan)' }}>{ARTIST.title}</p>
            <p className="font-display text-lg font-light italic leading-relaxed max-w-xl mb-8"
              style={{ color: 'rgba(234,230,242,0.45)' }}>
              "{ARTIST.bio}"
            </p>
            <div className="flex flex-wrap gap-5 mb-8">
              {[
                { icon: MapPin,    text: ARTIST.location },
                { icon: Calendar,  text: `Member since ${ARTIST.joinedYear}` },
                { icon: Palette,   text: ARTIST.mediums.join(' · ') },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(234,230,242,0.3)' }}>
                  <Icon size={12} strokeWidth={1.5} />{text}
                </span>
              ))}
            </div>
            {ARTIST.website && (
              <a href={ARTIST.website} target="_blank" rel="noopener noreferrer" className="btn-velvet inline-flex">
                <Globe size={12} /><span>Portfolio</span>
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="tenet-card">
            <p className="section-label">At a Glance</p>
            <div className="space-y-7">
              {[
                { value: ARTIST.stats.works,    label: 'Works Exhibited' },
                { value: ARTIST.stats.admirers, label: 'Silent Admirers' },
                { value: ARTIST.stats.years,    label: 'Years Creating' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="font-display font-light leading-none mb-1"
                    style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'var(--ghost)' }}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(234,230,242,0.28)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glow-line" style={{ margin: '3rem 0 2.5rem' }} />

        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="section-label">The Chamber</span>
            <h2 className="font-display text-4xl font-light" style={{ color: 'var(--ghost)' }}>
              {ARTIST.stats.works} Masterpieces
            </h2>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="masonry-grid">
          {ARTIST.works.map(work => <WorkCard key={work.id} work={work} />)}
        </div>
      </div>
    </div>
  )
}
