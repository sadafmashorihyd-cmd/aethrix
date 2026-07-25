'use client'
import { useState } from 'react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [show, setShow] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleAuth() {
    if (!email || !password) {
      setMessage({ text: 'Email aur password dono bharo!', type: 'error' })
      return
    }
    setLoading(true)
    setMessage({ text: '', type: '' })

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage({ text: error.message, type: 'error' })
      } else {
        setMessage({ text: 'Account ban gaya! Email check karo confirmation ke liye.', type: 'success' })
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ text: 'Email ya password galat hai!', type: 'error' })
      } else {
        window.location.href = '/dashboard'
      }
    }
    setLoading(false)
  }

  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.06), transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center justify-center">
            <span className="font-display text-3xl tracking-[0.3em] font-light" style={{ color: 'var(--ghost)' }}>AE</span>
            <span className="font-display text-3xl tracking-[0.3em] font-light" style={{ color: 'var(--cyan)' }}>THRIX</span>
          </a>
          <p className="mt-3 font-display text-lg font-light italic" style={{ color: 'rgba(234,230,242,0.4)' }}>
            {isSignup ? 'Join the sanctuary.' : 'Welcome back, artist.'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-sm mb-6 p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <button type="button" onClick={() => setIsSignup(false)}
            className="flex-1 py-2 text-xs tracking-widest uppercase rounded-sm transition-all duration-300"
            style={{ background: !isSignup ? 'rgba(0,229,255,0.12)' : 'transparent', color: !isSignup ? 'var(--cyan)' : 'rgba(234,230,242,0.35)' }}>
            Sign In
          </button>
          <button type="button" onClick={() => setIsSignup(true)}
            className="flex-1 py-2 text-xs tracking-widest uppercase rounded-sm transition-all duration-300"
            style={{ background: isSignup ? 'rgba(0,229,255,0.12)' : 'transparent', color: isSignup ? 'var(--cyan)' : 'rgba(234,230,242,0.35)' }}>
            Sign Up
          </button>
        </div>

        <div className="rounded-sm p-7" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

          {message.text && (
            <div className="mb-4 p-3 rounded-sm text-sm"
              style={{
                background: message.type === 'error' ? 'rgba(255,68,68,0.1)' : 'rgba(0,229,255,0.1)',
                border: `1px solid ${message.type === 'error' ? 'rgba(255,68,68,0.3)' : 'rgba(0,229,255,0.3)'}`,
                color: message.type === 'error' ? '#FF4444' : 'var(--cyan)',
              }}>
              {message.text}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-sacred"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-sacred pr-10"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(234,230,242,0.3)' }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAuth}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.9rem 2rem',
              background: loading ? 'rgba(255,107,53,0.5)' : 'linear-gradient(135deg, var(--ember), #FF8C5A)',
              color: 'var(--void)',
              fontSize: '0.78rem',
              fontWeight: '700',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              borderRadius: '2px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Enter the Sanctuary'}
            {!loading && <ArrowRight size={14} />}
          </button>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(234,230,242,0.25)' }}>
              {isSignup ? 'Already have a passport? ' : 'No passport yet? '}
              <button type="button" onClick={() => setIsSignup(!isSignup)} style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {isSignup ? 'Sign in here' : 'Apply here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}