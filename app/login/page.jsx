'use client'
import { useState } from 'react'
import { Eye, EyeOff, Feather, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.06), transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center justify-center gap-1">
            <span className="font-display text-3xl tracking-[0.3em] font-light" style={{ color: 'var(--ghost)' }}>AE</span>
            <span className="font-display text-3xl tracking-[0.3em] font-light" style={{ color: 'var(--cyan)' }}>THRIX</span>
          </a>
          <p className="mt-3 font-display text-lg font-light italic" style={{ color: 'rgba(234,230,242,0.4)' }}>
            Welcome back, artist.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-sm p-7" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Email</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-sacred" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-sacred pr-10" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(234,230,242,0.3)' }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <a href="#" className="text-xs" style={{ color: 'rgba(0,229,255,0.5)' }}>Forgot password?</a>
            </div>
          </div>

          <button className="btn-ember w-full mt-6 justify-center">
            <span>Enter the Sanctuary</span>
            <ArrowRight size={14} />
          </button>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(234,230,242,0.25)' }}>
              No passport yet?{' '}
              <a href="/apply" style={{ color: 'var(--cyan)' }}>Apply here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}