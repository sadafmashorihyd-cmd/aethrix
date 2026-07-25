'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Feather, Eye, EyeOff, Fingerprint, Sparkles, Lock, Infinity } from 'lucide-react'

function InkDrop() {
  return (
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
  )
}

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

const PREVIEWS = [
  { id: 1, aspect: 'aspect-[3/4]',  gradient: 'from-cyan-900/50 via-blue-900/30',   color: '#00E5FF', title: 'Midnight Reverie',  artist: 'Zainab K.' },
  { id: 2, aspect: 'aspect-square',  gradient: 'from-violet-900/50 via-purple-900/30', color: '#B57BFF', title: 'Shattered Gold',    artist: 'Arslan M.' },
  { id: 3, aspect: 'aspect-[4/5]',  gradient: 'from-orange-900/40 via-red-900/20',   color: '#FF6B35', title: 'Desert Storm',      artist: 'Aisha R.' },
  { id: 4, aspect: 'aspect-[3/4]',  gradient: 'from-teal-900/40 via-cyan-900/20',    color: '#00E5FF', title: 'Neon Dharma',       artist: 'Haris J.' },
]

const TENETS = [
  { icon: EyeOff,       title: 'Zero Algorithm Noise',   body: 'Your work is seen because it deserves to be — not because you paid or posted at the right hour.',     color: 'var(--cyan)',   num: '01' },
  { icon: Lock,         title: 'The Velvet Rope',        body: 'Every artist here earned their Passport. No brands, no bots, no noise. Only hands that carry ink.',     color: 'var(--violet)', num: '02' },
  { icon: Sparkles,     title: 'Mood-Match Discovery',   body: 'Browse by feeling, not follower count. Find art that mirrors your exact state of mind at midnight.',    color: 'var(--ember)',  num: '03' },
  { icon: Fingerprint,  title: 'Your Artist Chamber',    body: 'A custom portfolio page that carries your name like a permanent exhibition — not a feed, a gallery.',   color: 'var(--cyan)',   num: '04' },
  { icon: Infinity,     title: 'The Infinite Canvas',    body: 'A living, breathing gallery. Every visit, a new constellation of masterpieces waiting to be found.',    color: 'var(--violet)', num: '05' },
  { icon: Feather,      title: 'Pure Expression',        body: 'No like counts. No toxic metrics. The work speaks, and the right eyes will always find the right art.', color: 'var(--ember)',  num: '06' },
]

export default function HomePage() {
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const h = (e) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  return (
    <div className="page-enter">
      {/* Cursor glow */}
      <div className="fixed pointer-events-none z-20 rounded-full" style={{
        left: cursor.x - 180, top: cursor.y - 180,
        width: 360, height: 360,
        background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)',
        transition: 'left 0.12s ease, top 0.12s ease',
      }} />

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
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
            <div className="flex justify-center fade-up d2">
              <InkDrop />
            </div>
          </div>
        </div>
        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25">
          <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, var(--cyan), transparent)', animation: 'breathe 2s ease-in-out infinite' }} />
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--ghost-dim)' }}>Descend</p>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="py-24 md:py-36 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(181,123,255,0.04), transparent)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal><span className="section-label">The Sacred Law</span></ScrollReveal>
          <div className="space-y-4 md:space-y-6">
            {[
              { text: 'Your art was never meant', italic: false },
              { text: 'to chase an algorithm.', italic: true, color: 'var(--cyan)' },
              { text: 'It was meant to', italic: false },
              { text: 'stop someone\'s heart.', italic: true, color: 'var(--ember)' },
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
                "Every great gallery has a velvet rope. Ours is digital, and it only opens
                for those whose hands know the weight of a brush."
              </p>
              <p className="mt-4 text-xs tracking-widest uppercase" style={{ color: 'rgba(0,229,255,0.5)' }}>
                — The AETHRIX Charter, Article I
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="glow-line max-w-7xl mx-auto px-4 md:px-8" />

      {/* ── GALLERY PREVIEW ── */}
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
          <div className="masonry-grid">
            {PREVIEWS.map((art, i) => (
              <ScrollReveal key={art.id} delay={i * 100}>
                <div className="artwork-card group">
                  <div className={`w-full ${art.aspect} bg-gradient-to-b ${art.gradient} to-void relative overflow-hidden`}>
                    <div className="absolute inset-0 noise-overlay" style={{ opacity: 0.85 }} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-25 group-hover:opacity-50 transition-opacity duration-500">
                      <div className="w-1/2 h-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${art.color}, transparent)`, filter: 'blur(25px)' }} />
                    </div>
                  </div>
                  <div className="artwork-card-overlay">
                    <p className="text-xs tracking-widest uppercase mb-1" style={{ color: art.color, opacity: 0.7 }}>{art.artist}</p>
                    <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{art.title}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-line max-w-7xl mx-auto px-4 md:px-8" />

      {/* ── TENETS ── */}
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

      {/* ── CTA ── */}
      <section className="py-36 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[500px] h-[250px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.07), transparent)', filter: 'blur(50px)' }} />
        </div>
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
            <p className="mt-5 text-xs tracking-widest uppercase" style={{ color: 'rgba(234,230,242,0.18)' }}>
              Free forever for verified artists
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
