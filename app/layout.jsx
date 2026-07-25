import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'AETHRIX — Where Art Transcends',
  description: "The world's first sacred digital sanctuary for true artists. No algorithms. No noise. Only pure expression.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-ghost antialiased min-h-screen overflow-x-hidden">
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="ambient-orb ambient-orb--cyan" />
          <div className="ambient-orb ambient-orb--violet" />
          <div className="ambient-orb ambient-orb--ember" />
        </div>
        <div className="fixed inset-0 noise-overlay pointer-events-none z-0" aria-hidden="true" />

        <header className="fixed top-0 left-0 right-0 z-50 nav-glass">
          <nav className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

            {/* Logo */}
            <a href="/" className="flex-shrink-0 flex items-center">
              <span className="font-display text-xl md:text-2xl tracking-[0.25em] text-ghost font-light">AE</span>
              <span className="font-display text-xl md:text-2xl tracking-[0.25em] text-cyan font-light">THRIX</span>
            </a>

            {/* Center nav */}
            <div className="hidden md:flex items-center gap-6 lg:gap-10">
              <a href="/gallery" className="nav-link">Gallery</a>
              <a href="/artists" className="nav-link">Artists</a>
              <a href="/sanctuary" className="nav-link">Sanctuary</a>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <a href="/login" className="nav-link hidden sm:block">Sign In</a>
              <a href="/apply" className="btn-velvet text-xs px-3 py-2 md:px-5 md:py-2.5">
                Apply for Passport
              </a>
            </div>

          </nav>
        </header>

        <main className="relative z-10">{children}</main>

        <footer className="relative z-10 border-t border-white/5 mt-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <p className="font-display text-2xl text-ghost font-light mb-3">
                AE<span className="text-cyan">THRIX</span>
              </p>
              <p className="text-ghost/40 text-sm leading-relaxed">
                A sacred digital sanctuary built by artists, for artists.
                No algorithms. No noise. Only truth.
              </p>
            </div>
            <div>
              <p className="text-ghost/20 uppercase tracking-widest text-xs mb-4">Navigate</p>
              <div className="flex flex-col gap-2">
                {['Gallery', 'Artists', 'Sanctuary', 'About'].map((item) => (
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
              2025 AETHRIX. Built in reverence for the art.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
