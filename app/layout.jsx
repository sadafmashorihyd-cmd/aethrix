'use client'
import { Inter } from 'next/font/google'
import './globals.css'
import NotificationBell from './components/NotificationBell'
import { useState } from 'react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {/* Hamburger button */}
      <button onClick={() => setOpen(!open)} className="md:hidden flex flex-col gap-1.5 p-2"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <span style={{ display: 'block', width: 22, height: 2, background: open ? 'var(--cyan)' : 'var(--ghost)', transition: 'all 0.3s', transform: open ? 'rotate(45deg) translate(3px, 3px)' : 'none' }} />
        <span style={{ display: 'block', width: 22, height: 2, background: open ? 'transparent' : 'var(--ghost)', transition: 'all 0.3s', opacity: open ? 0 : 1 }} />
        <span style={{ display: 'block', width: 22, height: 2, background: open ? 'var(--cyan)' : 'var(--ghost)', transition: 'all 0.3s', transform: open ? 'rotate(-45deg) translate(3px, -3px)' : 'none' }} />
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40" style={{ top: 64 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,24,0.95)', backdropFilter: 'blur(20px)' }}
            onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', zIndex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { href: '/gallery', label: 'Gallery' },
              { href: '/artists', label: 'Artists' },
              { href: '/streaks', label: 'Streaks' },
              { href: '/chat', label: 'Chat' },
              { href: '/dm', label: 'DMs' },
              { href: '/sanctuary', label: 'Sanctuary' },
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/login', label: 'Sign In' },
            ].map(item => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{ color: 'var(--ghost)', fontSize: 24, fontFamily: "'Playfair Display', serif", fontWeight: 300, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 16 }}>
                {item.label}
              </a>
            ))}
            <a href="/apply" onClick={() => setOpen(false)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 24px', background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', color: '#03030A', fontSize: 14, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: 4, textDecoration: 'none', marginTop: 8 }}>
              Apply for Passport
            </a>
          </div>
        </div>
      )}
    </>
  )
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-ghost antialiased min-h-screen" id="root-body">
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="ambient-orb ambient-orb--cyan" />
          <div className="ambient-orb ambient-orb--violet" />
          <div className="ambient-orb ambient-orb--ember" />
        </div>
        <div className="fixed inset-0 noise-overlay pointer-events-none z-0" aria-hidden="true" />

        <header className="fixed top-0 left-0 right-0 z-50 nav-glass">
          <nav className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
            <a href="/" className="flex-shrink-0 flex items-center">
              <span className="font-display text-xl md:text-2xl tracking-[0.25em] text-ghost font-light">AE</span>
              <span className="font-display text-xl md:text-2xl tracking-[0.25em] text-cyan font-light">THRIX</span>
            </a>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="/gallery" className="nav-link">Gallery</a>
              <a href="/artists" className="nav-link">Artists</a>
              <a href="/streaks" className="nav-link">Streaks</a>
              <a href="/chat" className="nav-link">Chat</a>
              <a href="/dm" className="nav-link">DMs</a>
              <a href="/sanctuary" className="nav-link">Sanctuary</a>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <a href="/dashboard" className="nav-link hidden md:block">Dashboard</a>
              <a href="/login" className="nav-link hidden md:block">Sign In</a>
              <a href="/apply" className="btn-velvet text-xs px-3 py-2 md:px-5 md:py-2.5 hidden md:inline-flex">Apply</a>
              <MobileNav />
            </div>
          </nav>
        </header>

        <div id="page-content" className="relative z-10">
          {children}
        </div>

        <footer id="site-footer" className="relative z-10 border-t border-white/5 mt-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <p className="font-display text-2xl text-ghost font-light mb-3">
                AE<span className="text-cyan">THRIX</span>
              </p>
              <p className="text-ghost/40 text-sm leading-relaxed">
                A sacred digital sanctuary built by artists, for artists. No algorithms. No noise. Only truth.
              </p>
            </div>
            <div>
              <p className="text-ghost/20 uppercase tracking-widest text-xs mb-4">Navigate</p>
              <div className="flex flex-col gap-2">
                {['Gallery', 'Artists', 'Streaks', 'Chat', 'DMs', 'Sanctuary'].map((item) => (
                  <a key={item} href={`/${item.toLowerCase()}`} className="footer-link">{item}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-ghost/20 uppercase tracking-widest text-xs mb-4">Sacred Law</p>
              <div className="flex flex-col gap-2">
                {['Privacy', 'Terms', 'Artist Charter', 'Contact'].map((item) => (
                  <a key={item} href="#" className="footer-link">{item}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 py-5 text-center">
            <p className="text-ghost/20 text-xs tracking-widest uppercase">
              2025 AETHRIX · Built by Sadaf · Founder, AETHRIX
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}