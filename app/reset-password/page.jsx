'use client'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState('')

    const handleReset = async () => {
        if (!password || password.length < 6) {
            setError('Password kam az kam 6 characters ka hona chahiye!')
            return
        }
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            setError(error.message)
        } else {
            setDone(true)
        }
        setLoading(false)
    }

    return (
        <div className="page-enter min-h-screen flex items-center justify-center px-4 pt-16">
            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-10">
                    <a href="/" className="inline-flex items-center justify-center">
                        <span className="font-display text-3xl tracking-[0.3em] font-light" style={{ color: 'var(--ghost)' }}>AE</span>
                        <span className="font-display text-3xl tracking-[0.3em] font-light" style={{ color: 'var(--cyan)' }}>THRIX</span>
                    </a>
                    <p className="mt-3 font-display text-lg font-light italic" style={{ color: 'rgba(234,230,242,0.4)' }}>
                        Set new password
                    </p>
                </div>

                <div className="rounded-sm p-7" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {done ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
                                <Check size={24} style={{ color: 'var(--cyan)' }} />
                            </div>
                            <p className="font-display text-xl font-light mb-3" style={{ color: 'var(--ghost)' }}>Password updated!</p>
                            <a href="/login" className="btn-ember inline-flex mx-auto">
                                <span>Sign In Now</span>
                                <ArrowRight size={14} />
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
                                    New Password
                                </label>
                                <div className="relative">
                                    <input type={show ? 'text' : 'password'} placeholder="Min 6 characters"
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        className="input-sacred pr-10" />
                                    <button type="button" onClick={() => setShow(!show)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        style={{ color: 'rgba(234,230,242,0.3)' }}>
                                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
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
                                {loading ? 'Updating...' : 'Update Password'}
                                {!loading && <ArrowRight size={14} />}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}