'use client'
import { useState } from 'react'
import { Upload, Feather, ArrowRight, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const STEPS = ['Identity', 'Your Art', 'Manifesto', 'Submit']
const MOODS = ['Midnight Rain', 'Melancholy', 'Sunset', 'Cyberpunk', 'Wildfire', 'Deep Ocean']

export default function ApplyPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', username: '', email: '', medium: '', bio: '', mood: '' })
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      let imageUrl = ''
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${form.username}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('artworks')
          .upload(fileName, file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage
          .from('artworks')
          .getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
      const { error: dbError } = await supabase
        .from('applications')
        .insert({
          name: form.name,
          username: form.username,
          email: form.email,
          medium: form.medium,
          bio: form.bio,
          mood: form.mood,
          image_url: imageUrl,
          status: 'pending'
        })
      if (dbError) throw dbError
      setSubmitted(true)
    } catch (err) {
      setError('Kuch masla hua! Dobara try karo.')
      console.error(err)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="page-enter min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
            <Check size={32} style={{ color: 'var(--cyan)' }} />
          </div>
          <h2 className="font-display text-4xl font-light mb-4" style={{ color: 'var(--ghost)' }}>
            Application Submitted!
          </h2>
          <p className="font-display text-lg font-light italic mb-8" style={{ color: 'rgba(234,230,242,0.4)' }}>
            Your passport application is under review. We will notify you within 48 hours.
          </p>
          <a href="/" className="btn-ember inline-flex mx-auto">
            <span>Return to AETHRIX</span>
            <Feather size={14} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <span className="section-label">The Velvet Rope</span>
          <h1 className="font-display font-light mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--ghost)' }}>
            Apply for Your<br />
            <em className="italic" style={{ color: 'var(--cyan)' }}>Artist Passport</em>
          </h1>
          <p className="font-display font-light italic" style={{ color: 'rgba(234,230,242,0.38)', fontSize: '1.05rem' }}>
            Submit one piece. Earn your place among the chosen.
          </p>
        </div>

        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-light transition-all duration-400"
                  style={{
                    background: i < step ? 'var(--cyan)' : i === step ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border: i <= step ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.1)',
                    color: i < step ? 'var(--void)' : i === step ? 'var(--cyan)' : 'rgba(234,230,242,0.3)',
                  }}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <p className="text-xs mt-1 tracking-wider hidden sm:block"
                  style={{ color: i === step ? 'var(--cyan)' : 'rgba(234,230,242,0.2)' }}>{s}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1"
                  style={{ background: i < step ? 'var(--cyan)' : 'rgba(255,255,255,0.08)', transition: 'background 0.4s ease' }} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-sm p-7" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-light mb-5" style={{ color: 'var(--ghost)' }}>Who are you?</h2>
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your real name' },
                { key: 'username', label: 'Artist Handle', type: 'text', placeholder: 'how-the-world-knows-you' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
                { key: 'medium', label: 'Primary Medium', type: 'text', placeholder: 'Digital Ink, Charcoal, Oil...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="input-sacred" />
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-light mb-2" style={{ color: 'var(--ghost)' }}>Show us your truth.</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(234,230,242,0.3)' }}>One piece. Make it count.</p>
              <div className="rounded-sm p-10 text-center cursor-pointer transition-all duration-300"
                style={{
                  border: `2px dashed ${dragging ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'}`,
                  background: dragging ? 'rgba(0,229,255,0.04)' : 'rgba(255,255,255,0.02)',
                }}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]) }}
                onClick={() => document.getElementById('file-input').click()}>
                <input id="file-input" type="file" className="hidden" accept="image/*"
                  onChange={e => setFile(e.target.files[0])} />
                {file ? (
                  <div>
                    <Check size={32} className="mx-auto mb-3" style={{ color: 'var(--cyan)' }} />
                    <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>{file.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(234,230,242,0.3)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-display text-lg font-light" style={{ color: 'rgba(234,230,242,0.5)' }}>Drop your masterpiece here</p>
                    <p className="text-xs mt-2" style={{ color: 'rgba(234,230,242,0.2)' }}>PNG, JPG, WebP · Max 50MB</p>
                  </div>
                )}
              </div>
              <div className="mt-5">
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(234,230,242,0.3)' }}>Artwork Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button key={m} type="button" onClick={() => setForm({ ...form, mood: m })} className="mood-badge"
                      style={form.mood === m ? { color: 'var(--cyan)', borderColor: 'var(--cyan)', background: 'rgba(0,229,255,0.08)' } : {}}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl font-light mb-2" style={{ color: 'var(--ghost)' }}>Your artist manifesto.</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(234,230,242,0.3)' }}>What drives your hand?</p>
              <textarea className="input-sacred resize-none" style={{ minHeight: '180px', lineHeight: '1.7' }}
                placeholder="Write your truth here. No rules. No format. Just honesty."
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
              <p className="text-xs mt-2 text-right" style={{ color: 'rgba(234,230,242,0.2)' }}>{form.bio.length} / 500</p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
                <Feather size={24} style={{ color: 'var(--cyan)' }} strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-2xl font-light mb-3" style={{ color: 'var(--ghost)' }}>Ready to apply?</h2>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(234,230,242,0.35)' }}>
                Your application will be reviewed within 48 hours.
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-sm text-sm"
                  style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444' }}>
                  {error}
                </div>
              )}
              <div className="rounded-sm p-4 text-left space-y-2 mb-6"
                style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                {[
                  { label: 'Name', val: form.name || 'Not filled' },
                  { label: 'Handle', val: form.username ? `@${form.username}` : 'Not filled' },
                  { label: 'Email', val: form.email || 'Not filled' },
                  { label: 'Medium', val: form.medium || 'Not filled' },
                  { label: 'Artwork', val: file ? file.name : 'Not uploaded' },
                  { label: 'Mood', val: form.mood || 'Not selected' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(234,230,242,0.3)' }}>{r.label}</span>
                    <span style={{ color: 'var(--ghost)' }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="btn-velvet"><span>Back</span></button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-ember">
                <span>Continue</span><ArrowRight size={13} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-ember"
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                <span>{loading ? 'Submitting...' : 'Submit Application'}</span>
                <Feather size={13} />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(234,230,242,0.18)' }}>
          Already have a passport? <a href="/login" style={{ color: 'var(--cyan)' }}>Sign in here</a>
        </p>
      </div>
    </div>
  )
}