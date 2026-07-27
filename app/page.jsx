'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Feather, EyeOff, Fingerprint, Sparkles, Lock, Infinity } from 'lucide-react'
import { supabase } from '../lib/supabase'

function ScrollReveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>{children}</div>
  )
}

const TENETS = [
  { icon: EyeOff, title: 'Zero Algorithm Noise', body: 'Your work is seen because it deserves to be — not because you paid or posted at the right hour.', color: 'var(--cyan)', num: '01' },
  { icon: Lock, title: 'The Velvet Rope', body: 'Every artist here earned their Passport. No brands, no bots, no noise. Only hands that carry ink.', color: 'var(--violet)', num: '02' },
  { icon: Sparkles, title: 'Mood-Match Discovery', body: 'Browse by feeling, not follower count. Find art that mirrors your exact state of mind at midnight.', color: 'var(--ember)', num: '03' },
  { icon: Fingerprint, title: 'Your Artist Chamber', body: 'A custom portfolio page that carries your name like a permanent exhibition — not a feed, a gallery.', color: 'var(--cyan)', num: '04' },
  { icon: Infinity, title: 'The Infinite Canvas', body: 'A living, breathing gallery. Every visit, a new constellation of masterpieces waiting to be found.', color: 'var(--violet)', num: '05' },
  { icon: Feather, title: 'Pure Expression', body: 'No like counts. No toxic metrics. The work speaks, and the right eyes will always find the right art.', color: 'var(--ember)', num: '06' },
]

const MOOD_COLORS = {
  'Midnight Rain': '#00E5FF',
  'Melancholy': '#B57BFF',
  'Sunset': '#FF6B35',
  'Cyberpunk': '#00E5FF',
  'Wildfire': '#FF4444',
  'Deep Ocean': '#00B8D4',
}

export default function HomePage() {
  const [artworks, setArtworks] = useState([])
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    supabase
      .from('applications')
      .select('*')
      .in('username', ['sadaf-art', 'florish_fusion', 'beenish-art', 'hamdanraza-art'])
      .not('image_url', 'is', null)
      .then(({ data }) => { if (data) setArtworks(data) })

    supabase
      .from('applications')
      .select('*')
      .eq('status', 'approved')
      .not('image_url', 'is', null)
      .limit(4)
      .then(({ data }) => { if (data) setPreviews(data) })
  }, [])

  return (
    <div className="page-enter">

      {/* HERO */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Background collage — blurred artworks */}
        {artworks.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            {/* Background images grid */}
            <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4 }}>
              {artworks.slice(0, 4).map((art, i) => (
                <div key={art.id} style={{ overflow: 'hidden', position: 'relative' }}>
                  <img src={art.image_url} alt="" style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    filter: 'blur(12px) brightness(0.35) saturate(1.6)',
                    transform: 'scale(1.1)',
                  }} />
                </div>
              ))}
            </div>
            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(8,8,24,0.92) 0%, rgba(8,8,24,0.75) 50%, rgba(8,8,24,0.88) 100%)' }} />
            {/* Cyan glow overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(0,240,255,0.08), transparent 60%)' }} />
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full px-4 md:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — Text */}
            <div>
              <div className="hero-eyebrow fade-up">A Sacred Digital Sanctuary</div>
              <h1 className="hero-title fade-up d1 mb-4">
                Where Art<em>Transcends.</em>
              </h1>
              <p className="hero-subtitle fade-up d2 mb-8">
                Not a social network. Not a marketplace.
                A consecrated space where ink, pencil, and digital strokes
                find their rightful audience.
              </p>
              <div className="flex flex-wrap gap-4 fade-up d3">
                <a href="/apply" className="btn-ember">
                  <span>Claim Your Passport</span>
                  <ArrowRight size={14} />
                </a>
                <a href="/gallery" className="btn-velvet">
                  <span>Enter Gallery</span>
                </a>
              </div>
              <div className="mt-10 fade-up d4">
                <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: 'rgba(234,230,242,0.18)' }}>
                  Artists from
                </p>
                <div className="flex flex-wrap gap-4">
                  {['Lahore', 'Istanbul', 'Tehran', 'Seoul', 'Lagos', 'Cairo'].map(c => (
                    <span key={c} className="text-xs font-light tracking-wider" style={{ color: 'rgba(234,230,242,0.25)' }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Artwork Collage (foreground) */}
            <div className="fade-up d2">
              {artworks.length > 0 ? (
                <div style={{ position: 'relative', height: '480px' }}>
                  {/* Main large artwork */}
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', width: '55%', height: '65%',
                    borderRadius: 12, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.6), 0 0 40px rgba(0,240,255,0.1)',
                    transform: 'rotate(-2deg)', zIndex: 3,
                  }}>
                    {artworks[0] && <img src={artworks[0].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                      <p style={{ color: 'rgba(234,230,242,0.9)', fontSize: 12, margin: 0 }}>{artworks[0]?.name}</p>
                      <p style={{ color: MOOD_COLORS[artworks[0]?.mood] || '#00E5FF', fontSize: 10, margin: '2px 0 0', opacity: 0.8 }}>{artworks[0]?.mood}</p>
                    </div>
                  </div>

                  {/* Second artwork */}
                  <div style={{
                    position: 'absolute', top: '15%', right: 0, width: '45%', height: '55%',
                    borderRadius: 12, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
                    transform: 'rotate(1.5deg)', zIndex: 2,
                  }}>
                    {artworks[1] && <img src={artworks[1].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                      <p style={{ color: 'rgba(234,230,242,0.9)', fontSize: 12, margin: 0 }}>{artworks[1]?.name}</p>
                    </div>
                  </div>

                  {/* Third artwork */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, width: '42%', height: '42%',
                    borderRadius: 12, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
                    transform: 'rotate(2deg)', zIndex: 4,
                  }}>
                    {artworks[2] && <img src={artworks[2].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>

                  {/* Fourth artwork */}
                  {artworks[3] && (
                    <div style={{
                      position: 'absolute', bottom: '5%', right: '5%', width: '35%', height: '35%',
                      borderRadius: 12, overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
                      transform: 'rotate(-1deg)', zIndex: 1,
                    }}>
                      <img src={artworks[3].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="ink-drop-container">
                  <div className="ink-drop-ring" />
                  <div className="ink-drop-ring ink-drop-ring--2" />
                  <div className="ink-drop ink-drop--1" />
                  <div className="ink-drop ink-drop--2" />
                  <div className="ink-drop ink-drop--3" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Feather size={44} strokeWidth={0.75}
                      style={{ color: 'var(--ghost)', opacity: 0.65, filter: 'drop-shadow(0 0 18px rgba(0,229,255,0.55))' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25" style={{ zIndex: 1 }}>
          <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, var(--cyan), transparent)' }} />
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--ghost-dim)' }}>Descend</p>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="py-24 md:py-36 px-4 md:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal><span className="section-label">The Sacred Law</span></ScrollReveal>
          <div className="space-y-4 md:space-y-6">
            {[
              { text: 'Your art was never meant', italic: false },
              { text: 'to chase an algorithm.', italic: true, color: 'var(--cyan)' },
              { text: 'It was meant to', italic: false },
              { text: "stop someone's heart.", italic: true, color: 'var(--ember)' },
            ].map((line, i) => (
              <ScrollReveal key={i} delay={i * 120}>
                <p className="font-display font-light leading-[1.05]"
                  style={{ fontSize: 'clamp(2rem, 5.5vw, 4.5rem)', color: line.color || 'var(--ghost)', fontStyle: line.italic ? 'italic' : 'normal' }}>
                  {line.text}
                </p>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={600}>
            <div className="mt-14 max-w-xl mx-auto">
              <p className="font-display text-lg font-light italic leading-relaxed" style={{ color: 'rgba(234,230,242,0.38)' }}>
                "Every great gallery has a velvet rope. Ours is digital, and it only opens for those whose hands know the weight of a brush."
              </p>
              <p className="mt-4 text-xs tracking-widest uppercase" style={{ color: 'rgba(0,229,255,0.5)' }}>
                — The AETHRIX Charter, Article I
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="glow-line max-w-7xl mx-auto px-4 md:px-8" />

      {/* GALLERY PREVIEW */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-label">Current Exhibition</span>
                <h2 className="section-title">The Midnight Show</h2>
              </div>
              <a href="/gallery" className="nav-link flex items-center gap-2 group">
                Enter <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </ScrollReveal>
          {previews.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-20">
                <Feather size={32} className="mx-auto mb-4 opacity-20" strokeWidth={0.8} />
                <p className="font-display text-xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>
                  Gallery opening soon.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="masonry-grid">
              {previews.map((art, i) => (
                <ScrollReveal key={art.id} delay={i * 100}>
                  <div className="artwork-card group">
                    <div className="w-full relative overflow-hidden" style={{ minHeight: '200px' }}>
                      <img src={art.image_url} alt={art.name}
                        className="w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="artwork-card-overlay">
                      <a href={`/artist/${art.username}`}
                        className="text-xs tracking-widest uppercase mb-1 block"
                        style={{ color: MOOD_COLORS[art.mood] || 'var(--cyan)', opacity: 0.7 }}>
                        {art.name}
                      </a>
                      <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{art.medium}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="glow-line max-w-7xl mx-auto px-4 md:px-8" />

      {/* TENETS */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="section-label">What We Stand For</span>
              <h2 className="section-title">Six Sacred Promises</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TENETS.map((t, i) => {
              const Icon = t.icon
              return (
                <ScrollReveal key={t.num} delay={i * 70}>
                  <div className="tenet-card h-full">
                    <span className="tenet-number">{t.num}</span>
                    <div className="w-9 h-9 rounded-sm flex items-center justify-center mb-5"
                      style={{ background: `${t.color}12`, border: `1px solid ${t.color}22` }}>
                      <Icon size={16} style={{ color: t.color }} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display text-xl font-light mb-2 leading-tight" style={{ color: 'var(--ghost)' }}>{t.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(234,230,242,0.38)' }}>{t.body}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-36 px-4 md:px-8 relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <span className="section-label">Ready to Enter?</span>
            <h2 className="font-display font-light leading-[1.05] mb-5" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--ghost)' }}>
              The doors are open.<br />
              <em className="italic" style={{ color: 'var(--cyan)' }}>But only for artists.</em>
            </h2>
            <p className="font-display text-lg font-light italic leading-relaxed mb-10" style={{ color: 'rgba(234,230,242,0.38)' }}>
              Submit one piece. Earn your Passport. Step into the only sanctuary
              the internet has ever built for artists who refuse to perform.
            </p>
            <a href="/apply" className="btn-ember inline-flex mx-auto">
              <span>Apply for Your Artist Passport</span>
              <ArrowRight size={15} />
            </a>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}