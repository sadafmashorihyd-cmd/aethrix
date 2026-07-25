'use client'
import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleReset = async () => {
        if (!email) { setError('Email daalo!'); return }
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) {
            setError(error.message)
        } else {
            setSent(true)
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
                        Reset your password
                    </p>
                </div>

                <div className="rounded-sm p-7" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

                    {sent ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
                                <Check size={24} style={{ color: 'var(--cyan)' }} />
                            </div>
                            <p className="font-display text-xl font-light mb-3" style={{ color: 'var(--ghost)' }}>
                                Reset link sent!
                            </p>
                            <p className="text-sm mb-6" style={{ color: 'rgba(234,230,242,0.4)' }}>
                                Check your email inbox for the password reset link.
                            </p>
                            <a href="/login" className="btn-velvet mx-auto inline-flex">
                                <span>Back to Sign In</span>
                            </a>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 p-3 rounded-sm text-sm"
                                    style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444' }}>
                                    {error}
                                </div>
                            )}
                            <div className="mb-5">
                                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                    Email Address
                                </label>
                                <input type="email" placeholder="your@email.com" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                                    className="input-sacred" />
                            </div>
                            <button type="button" onClick={handleReset} disabled={loading}
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
                                {loading ? 'Sending...' : 'Send Reset Link'}
                                {!loading && <ArrowRight size={14} />}
                            </button>
                            <div className="mt-5 text-center">
                                <a href="/login" className="text-xs" style={{ color: 'rgba(0,229,255,0.5)' }}>
                                    Back to Sign In
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}